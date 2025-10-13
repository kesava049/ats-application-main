"""
Resume controller for handling API endpoints.
Simplified version with only essential endpoints.
"""

import time
import logging
import uuid
import os
import json
import zipfile
import tempfile
import shutil
import asyncio
import httpx
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, File, UploadFile, HTTPException, status, BackgroundTasks, Request, Query
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.models.schemas import (
    BatchResumeParseResponse,
    ErrorResponse, 
    HealthResponse
)
from app.services.file_processor import FileProcessor
from app.services.openai_service import OpenAIService
from app.services.database_service import DatabaseService
from app.services.enhanced_resume_processor import enhanced_resume_processor
from app.config.settings import settings
from app.controllers._process_single_file import _process_single_file

# Global tracking for bulk processing jobs
bulk_processing_jobs = {}

async def create_candidates_from_resume_data(resume_data_ids: List[int], company_id: int, job_id: int = None, auth_token: str = None) -> Dict[str, Any]:
    """
    Call Node.js API to create candidates from parsed resume data.
    
    Args:
        resume_data_ids: List of resume data IDs to create candidates for
        company_id: Company ID for the candidates
        job_id: Optional job ID to assign candidates to
        auth_token: Authentication token for the API call
        
    Returns:
        Dict with success status and results
    """
    try:
        print(f"🔍 Creating candidates from resume data IDs: {resume_data_ids}")
        
        # Prepare the request payload
        payload = {
            "resumeDataIds": resume_data_ids
        }
        if job_id:
            payload["jobId"] = job_id
            
        # Prepare headers
        headers = {
            "Content-Type": "application/json",
            "X-Company-ID": str(company_id)  # Pass company ID in header
        }
        
        # Add authentication token if provided
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        else:
            print("⚠️ Warning: No authentication token provided for candidate creation")
            
        # Make HTTP request to Node.js API
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.NODE_API_URL}/api/candidates/create-from-resume-data",
                json=payload,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"🔍 Candidate creation successful: {result.get('summary', {})}")
                return {
                    "success": True,
                    "data": result
                }
            elif response.status_code == 401:
                print(f"🔍 Candidate creation failed: Authentication error - {response.text}")
                return {
                    "success": False,
                    "error": "Authentication failed. Please check your token.",
                    "details": response.text,
                    "suggested_action": "Please login again to refresh your authentication token."
                }
            elif response.status_code == 403:
                print(f"🔍 Candidate creation failed: Access denied - {response.text}")
                return {
                    "success": False,
                    "error": "Access denied. Insufficient permissions.",
                    "details": response.text,
                    "suggested_action": "Please contact your administrator for access."
                }
            elif response.status_code == 500:
                print(f"🔍 Candidate creation failed: Server error - {response.text}")
                return {
                    "success": False,
                    "error": "Server error occurred during candidate creation.",
                    "details": response.text,
                    "suggested_action": "Please try again later or contact support."
                }
            else:
                print(f"🔍 Candidate creation failed: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": f"API error: {response.status_code}",
                    "details": response.text,
                    "suggested_action": "Please check the error details and try again."
                }
                
    except httpx.TimeoutException:
        print("🔍 Candidate creation timeout")
        return {
            "success": False,
            "error": "Request timeout"
        }
    except Exception as e:
        print(f"🔍 Candidate creation error: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

# Configure logging
logger = logging.getLogger(__name__)

def _normalize_skills(skills_text: str) -> str:
    """
    Pass through skills text without normalization.
    Let GPT Text-Embedding-3-Small handle all variations naturally.
    """
    if not skills_text:
        return ""
    
    # No normalization - trust GPT's natural understanding
    return skills_text

async def _extract_resume_files_from_zip(zip_file: UploadFile) -> List[Dict[str, Any]]:
    """
    Extract resume files from a zip file containing folders.
    
    Args:
        zip_file: Uploaded zip file
        
    Returns:
        List of file data and metadata
    """
    extracted_files = []
    
    try:
        # Create temporary directory for extraction
        with tempfile.TemporaryDirectory() as temp_dir:
            # Save zip file to temp directory
            zip_path = os.path.join(temp_dir, zip_file.filename)
            with open(zip_path, "wb") as f:
                content = await zip_file.read()
                f.write(content)
            
            # Extract zip file
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            # Recursively find all resume files
            for root, dirs, files in os.walk(temp_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    file_extension = os.path.splitext(file)[1].lower()
                    
                    # Check if it's a supported resume file
                    if file_extension in settings.ALLOWED_EXTENSIONS:
                        # Read file content
                        with open(file_path, "rb") as f:
                            file_content = f.read()
                        
                        # Get relative path from zip root
                        rel_path = os.path.relpath(file_path, temp_dir)
                        
                        extracted_files.append({
                            "filename": rel_path,  # Keep folder structure in filename
                            "content": file_content,
                            "size": len(file_content),
                            "extension": file_extension
                        })
            
            logger.info(f"Extracted {len(extracted_files)} resume files from zip: {zip_file.filename}")
            return extracted_files
            
    except Exception as e:
        logger.error(f"Error extracting zip file {zip_file.filename}: {str(e)}")
        raise Exception(f"Failed to extract zip file: {str(e)}")

# Create router
router = APIRouter(prefix="/api/v1", tags=["resume"])

# Initialize rate limiter for 1000+ users
limiter = Limiter(key_func=get_remote_address)

# Initialize services
file_processor = FileProcessor()
openai_service = OpenAIService()
database_service = DatabaseService()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint for resume service.
    
    Returns:
        HealthResponse: Service health status
    """
    try:
        return HealthResponse(
            status="healthy",
            version=settings.APP_VERSION,
            timestamp=str(time.time())
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Health check failed: {str(e)}"
        )

@router.get("/resume-embeddings-status")
async def get_resume_embeddings_status():
    """
    Get comprehensive status of resume embeddings in the database.
    Shows embedding progress, modes, and detailed statistics.
    
    Returns:
        Dict: Comprehensive status information about resume embeddings
    """
    try:
        # Get total resumes
        all_resumes = await database_service.get_all_resumes(limit=1000)
        total_resumes = len(all_resumes)
        
        # Count resumes with embeddings and analyze embedding sources
        resumes_with_embeddings = 0
        automatic_embeddings = 0
        manual_embeddings = 0
        embedding_errors = 0
        recent_embeddings = 0
        current_time = time.time()
        
        # Handle case where no resumes exist
        if not all_resumes:
            return {
                "total_resumes": 0,
                "resumes_with_embeddings": 0,
                "resumes_without_embeddings": 0,
                "embedding_percentage": 0,
                "embedding_breakdown": {
                    "automatic_embeddings": 0,
                    "manual_embeddings": 0,
                    "automatic_percentage": 0,
                    "manual_percentage": 0
                },
                "recent_activity": {
                    "recent_embeddings_24h": 0,
                    "embedding_errors": 0
                },
                "embedding_modes": {
                    "automatic_mode": "✅ Active - Embeddings generated automatically when resumes are uploaded",
                    "manual_mode": "✅ Available - Use POST /api/v1/generate-resume-embeddings as backup",
                    "status": "operational"
                },
                "recommendations": {
                    "use_automatic": "Primary method - Embeddings generated automatically",
                    "use_manual": "Backup method - Call /api/v1/generate-resume-embeddings if needed",
                    "check_errors": "No resumes found"
                }
            }
        
        for resume in all_resumes:
            has_embedding = False
            embedding_source = "none"
            
            # Check separate embedding column first (automatic)
            if resume.get('embedding'):
                has_embedding = True
                embedding_source = "automatic"
                automatic_embeddings += 1
                
                # Check if embedding was created recently (last 24 hours)
                created_at = resume.get('created_at', 0)
                try:
                    # Convert to float if it's a string
                    if isinstance(created_at, str):
                        created_at = float(created_at)
                    elif created_at is None:
                        created_at = 0
                    
                    if current_time - created_at < 86400:  # 24 hours
                        recent_embeddings += 1
                except (ValueError, TypeError):
                    # Skip if created_at is not a valid number
                    pass
            
            # Fallback: check parsed_data for backward compatibility (manual)
            if not has_embedding:
                parsed_data = resume.get('parsed_data', {})
                
                # Handle parsed_data that might be a JSON string
                if isinstance(parsed_data, str):
                    try:
                        parsed_data = json.loads(parsed_data)
                    except (json.JSONDecodeError, TypeError):
                        continue
                
                if parsed_data and isinstance(parsed_data, dict):
                    if 'embedding' in parsed_data and parsed_data['embedding']:
                        has_embedding = True
                        embedding_source = "manual"
                        manual_embeddings += 1
            
            if has_embedding:
                resumes_with_embeddings += 1
            else:
                # Check if there was an embedding error
                if resume.get('embedding_error'):
                    embedding_errors += 1
        
        # Calculate statistics
        resumes_without_embeddings = total_resumes - resumes_with_embeddings
        embedding_percentage = (resumes_with_embeddings / total_resumes * 100) if total_resumes > 0 else 0
        automatic_percentage = (automatic_embeddings / total_resumes * 100) if total_resumes > 0 else 0
        manual_percentage = (manual_embeddings / total_resumes * 100) if total_resumes > 0 else 0
        
        return {
            "total_resumes": total_resumes,
            "resumes_with_embeddings": resumes_with_embeddings,
            "resumes_without_embeddings": resumes_without_embeddings,
            "embedding_percentage": round(embedding_percentage, 2),
            "embedding_breakdown": {
                "automatic_embeddings": automatic_embeddings,
                "manual_embeddings": manual_embeddings,
                "automatic_percentage": round(automatic_percentage, 2),
                "manual_percentage": round(manual_percentage, 2)
            },
            "recent_activity": {
                "recent_embeddings_24h": recent_embeddings,
                "embedding_errors": embedding_errors
            },
            "embedding_modes": {
                "automatic_mode": "✅ Active - Embeddings generated automatically when resumes are uploaded",
                "manual_mode": "✅ Available - Use POST /api/v1/generate-resume-embeddings as backup",
                "status": "operational"
            },
            "recommendations": {
                "use_automatic": "Primary method - Embeddings generated automatically",
                "use_manual": "Backup method - Call /api/v1/generate-resume-embeddings if needed",
                "check_errors": f"Found {embedding_errors} resumes with embedding errors"
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting resume embeddings status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get resume embeddings status: {str(e)}"
        )

@router.get("/parsing-metrics")
async def get_parsing_metrics():
    """
    Get resume parsing metrics and statistics.
    
    Returns:
        Dict with parsing metrics, error breakdown, and performance statistics
    """
    try:
        metrics = enhanced_resume_processor.get_metrics()
        return JSONResponse(content={
            "success": True,
            "metrics": metrics,
            "timestamp": time.time()
        })
    except Exception as e:
        logger.error(f"Failed to get parsing metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get parsing metrics: {str(e)}"
        )

@router.get("/error-breakdown")
async def get_error_breakdown():
    """
    Get error breakdown by type.
    
    Returns:
        Dict with error counts by type
    """
    try:
        error_breakdown = enhanced_resume_processor.get_error_breakdown()
        return JSONResponse(content={
            "success": True,
            "error_breakdown": error_breakdown,
            "timestamp": time.time()
        })
    except Exception as e:
        logger.error(f"Failed to get error breakdown: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get error breakdown: {str(e)}"
        )

@router.get("/recent-errors")
async def get_recent_errors(limit: int = Query(10, description="Number of recent errors to return")):
    """
    Get recent parsing errors for debugging.
    
    Args:
        limit (int): Number of recent errors to return (default: 10, max: 100)
        
    Returns:
        List of recent errors with details
    """
    try:
        limit = min(limit, 100)  # Cap at 100
        recent_errors = enhanced_resume_processor.get_recent_errors(limit)
        return JSONResponse(content={
            "success": True,
            "recent_errors": recent_errors,
            "count": len(recent_errors),
            "timestamp": time.time()
        })
    except Exception as e:
        logger.error(f"Failed to get recent errors: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get recent errors: {str(e)}"
        )

@router.post("/reset-metrics")
async def reset_parsing_metrics():
    """
    Reset parsing metrics and error tracking.
    
    Returns:
        Success confirmation
    """
    try:
        enhanced_resume_processor.reset_metrics()
        return JSONResponse(content={
            "success": True,
            "message": "Parsing metrics reset successfully",
            "timestamp": time.time()
        })
    except Exception as e:
        logger.error(f"Failed to reset metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset metrics: {str(e)}"
        )

@router.post("/parse-resume-enhanced", response_model=BatchResumeParseResponse)
@limiter.limit("30/minute")  # Rate limit: 30 requests per minute per IP for enhanced processing
async def parse_resume_enhanced(request: Request, file: UploadFile = File(...), background_tasks: BackgroundTasks = None, company_id: int = Query(None, description="Company ID for data isolation")):
    """
    Enhanced resume parsing with comprehensive error handling, retry logic, and validation.
    Provides detailed error messages and improved parsing success rates.
    
    Args:
        file (UploadFile): Resume file to parse
        company_id (int, optional): Company ID for data isolation
        
    Returns:
        BatchResumeParseResponse: Enhanced processing results with detailed error information
        
    Raises:
        HTTPException: If file processing or parsing fails
    """
    start_time = time.time()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Process with enhanced processor
        result = await enhanced_resume_processor.process_resume(
            file_content, file.filename, company_id
        )
        
        if result.success:
            # Save to database
            database_service = DatabaseService()
            record_id = await database_service.save_resume_data(
                filename=file.filename,
                file_path=f"uploads/{file.filename}",
                file_type=file.filename.split('.')[-1],
                file_size=len(file_content),
                processing_time=result.processing_time,
                parsed_data=result.parsed_data,
                company_id=company_id  # Ensure company isolation is persisted
            )
            
            return BatchResumeParseResponse(
                success=True,
                message="Resume parsed successfully with enhanced processing",
                total_files=1,
                successful_files=1,
                failed_files=0,
                duplicate_files=0,
                results=[{
                    "filename": file.filename,
                    "status": "success",
                    "parsed_data": result.parsed_data,
                    "processing_time": result.processing_time,
                    "record_id": record_id,
                    "attempts": result.attempts,
                    "contact_extraction_confidence": result.parsed_data.get('_processing_metadata', {}).get('contact_extraction_confidence', 0.0)
                }],
                processing_time=time.time() - start_time
            )
        else:
            # Handle processing failure
            error_details = {
                "error_type": result.error.error_type if hasattr(result.error, 'error_type') else 'unknown',
                "error_message": result.error.message if hasattr(result.error, 'message') else str(result.error),
                "attempts": result.attempts or [],
                "validation_result": result.validation_result.__dict__ if result.validation_result else None
            }
            
            return BatchResumeParseResponse(
                success=False,
                message=f"Resume parsing failed: {result.error.message if hasattr(result.error, 'message') else str(result.error)}",
                total_files=1,
                successful_files=0,
                failed_files=1,
                duplicate_files=0,
                results=[{
                    "filename": file.filename,
                    "status": "failed",
                    "error": result.error.message if hasattr(result.error, 'message') else str(result.error),
                    "error_details": error_details,
                    "processing_time": result.processing_time,
                    "attempts": result.attempts or []
                }],
                processing_time=time.time() - start_time
            )
            
    except Exception as e:
        logger.error(f"Unexpected error in enhanced resume parsing: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        )

@router.post("/parse-resume", response_model=BatchResumeParseResponse)
@limiter.limit("50/minute")  # Rate limit: 50 requests per minute per IP for 1000+ users
async def parse_resume(request: Request, file: UploadFile = File(...), background_tasks: BackgroundTasks = None, company_id: int = Query(None, description="Company ID for data isolation")):
    """
    Parse a single resume file with high-scale processing support for 1000+ concurrent users.
    Supports single file upload (1 resume per request) with async queue processing.
    Handles 1000+ users simultaneously with Redis queue and background workers.
    Supports various file formats: PDF, DOCX, DOC, TXT, RTF, PNG, JPG, JPEG, WEBP
    
    Args:
        file (UploadFile): Single resume file to parse (1 file only)
        
    Returns:
        BatchResumeParseResponse: Processing results with job tracking
        
    Raises:
        HTTPException: If file processing or parsing fails
    """
    start_time = time.time()
    
    # Debug logging
    logger.info(f"🔍 Resume Parse Debug - File received: {file.filename if file else 'None'}")
    logger.info(f"🔍 Resume Parse Debug - File size: {file.size if file else 'None'}")
    logger.info(f"🔍 Resume Parse Debug - Content type: {file.content_type if file else 'None'}")
    
    if not file:
        logger.error("❌ No file provided")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )
    
    # Check if queue system is available for high-scale processing
    try:
        from app.services.queue_service import queue_service
        
        # If Redis is available, use queue-based processing for high-scale
        if queue_service.redis_client:
            return await _process_with_queue([file], start_time)
        else:
            logger.warning("⚠️ Queue system not available, falling back to synchronous processing")
    except Exception as e:
        logger.warning(f"⚠️ Queue system error: {str(e)}, falling back to synchronous processing")
    
    # Fallback to synchronous processing for low-scale usage
    results = []
    successful_files = 0
    failed_files = 0
    batch_data_to_save = []
    
    try:
        # Process single file
        file_start_time = time.time()
        file_result = {
            "filename": file.filename,
            "status": "failed",
            "error": None,
            "parsed_data": None,
            "file_type": None,
            "processing_time": 0
        }
        
        try:
            # Validate file
            if not file.filename:
                file_result["error"] = "No filename provided"
            else:
                # Check file extension
                file_extension = os.path.splitext(file.filename)[1].lower()
                if file_extension not in settings.ALLOWED_EXTENSIONS:
                    file_result["error"] = f"Unsupported file format. Supported formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
                    file_result["file_type"] = file_extension.lstrip('.')
                else:
                    # Check file size
                    file_content = await file.read()
                    file_size = len(file_content)
                    if file_size > settings.MAX_FILE_SIZE:
                        file_result["error"] = f"File size exceeds maximum limit of {settings.MAX_FILE_SIZE} bytes"
                        file_result["file_type"] = file_extension.lstrip('.')
                    else:
                        # Process the file with company isolation
                        await _process_single_file(file, file_content, file_size, file_extension, file_result, batch_data_to_save, results, company_id)
        
        except Exception as e:
            file_processing_time = time.time() - file_start_time
            file_result.update({
                "error": f"Failed to process file: {str(e)}",
                "processing_time": file_processing_time
            })
            logger.error(f"Error processing file {file.filename}: {str(e)}")
        
        results.append(file_result)
        
        # Count successful and failed files from results
        successful_files = len([r for r in results if r.get("status") == "success"])
        failed_files = len([r for r in results if r.get("status") == "failed"])
        
        print(f"🔍 Debug - Results: {results}")
        print(f"🔍 Debug - Successful files: {successful_files}")
        print(f"🔍 Debug - Failed files: {failed_files}")
        print(f"🔍 Debug - Batch data to save: {len(batch_data_to_save)} items")
        
        # Save successful files to database in batch
        if batch_data_to_save:
            print(f"🔍 Debug - About to save batch data: {len(batch_data_to_save)} items")
            print(f"🔍 Debug - Batch data content: {batch_data_to_save}")
            try:
                # Get company_id from request query parameters
                company_id = request.query_params.get('company_id')
                if company_id:
                    company_id = int(company_id)
                else:
                    company_id = None
                
                record_ids = await database_service.save_batch_resume_data(batch_data_to_save, company_id)
                logger.info(f"Successfully saved {len(record_ids)} resume records to database for company: {company_id}")
                
                # Save embeddings immediately for resumes that have them
                for i, (resume_data, db_id) in enumerate(zip(batch_data_to_save, record_ids)):
                    if 'embedding' in resume_data and resume_data['embedding']:
                        try:
                            await database_service.update_resume_embedding_column(
                                db_id, 
                                resume_data['embedding']
                            )
                            logger.info(f"✅ Embedding saved immediately for resume {i+1}/{len(batch_data_to_save)} (DB ID: {db_id})")
                        except Exception as e:
                            logger.error(f"❌ Error saving embedding for resume {i+1} (DB ID: {db_id}): {str(e)}")
                
            except Exception as e:
                logger.error(f"Error saving batch data to database: {str(e)}")
        
        total_processing_time = time.time() - start_time
        
        return BatchResumeParseResponse(
            total_files=1,
            successful_files=successful_files,
            failed_files=failed_files,
            total_processing_time=total_processing_time,
            results=results
        )
        
    except Exception as e:
        logger.error(f"Error in resume parsing: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process resume: {str(e)}"
        )

async def _check_resume_uniqueness(parsed_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Check if resume is unique based on name, email, phone, and skills.
    
    Args:
        parsed_data: Parsed resume data
        
    Returns:
        Dict with uniqueness status and details
    """
    try:
        # Extract key fields for uniqueness check
        name = parsed_data.get('Name', '').strip().lower()
        email = parsed_data.get('Email', '').strip().lower()
        phone = parsed_data.get('Phone', '').strip()
        skills = parsed_data.get('Skills', [])
        
        # Normalize skills
        if isinstance(skills, list):
            skills_normalized = [skill.strip().lower() for skill in skills if skill.strip()]
        else:
            skills_normalized = [str(skills).strip().lower()] if str(skills).strip() else []
        
        # Check if required fields are present
        missing_fields = []
        if not name:
            missing_fields.append("Name")
        if not email:
            missing_fields.append("Email")
        if not phone:
            missing_fields.append("Phone")
        if not skills_normalized:
            missing_fields.append("Skills")
        
        if missing_fields:
            return {
                "is_unique": False,
                "reason": "missing_required_fields",
                "missing_fields": missing_fields,
                "error": f"Resume parsing failed: Missing required fields: {', '.join(missing_fields)}"
            }
        
        # Check against existing resumes in database (limit to avoid event loop issues)
        try:
            existing_resumes = await database_service.get_all_resumes(limit=500)
        except Exception as e:
            logger.error(f"Error fetching existing resumes for uniqueness check: {str(e)}")
            # Do not block bulk processing when DB read fails; treat as unique so file can proceed
            return {
                "is_unique": True,
                "reason": "db_check_skipped",
                "error": None
            }
        
        for existing_resume in existing_resumes:
            existing_parsed_data = existing_resume.get('parsed_data', {})
            if isinstance(existing_parsed_data, str):
                try:
                    existing_parsed_data = json.loads(existing_parsed_data)
                except:
                    continue
            
            if not isinstance(existing_parsed_data, dict):
                continue
            
            # Check name match
            existing_name = existing_parsed_data.get('Name', '').strip().lower()
            if name and existing_name and name == existing_name:
                return {
                    "is_unique": False,
                    "reason": "duplicate_name",
                    "duplicate_field": "Name",
                    "duplicate_value": name,
                    "error": f"Duplicate resume found with same name: {name}"
                }
            
            # Check email match
            existing_email = existing_parsed_data.get('Email', '').strip().lower()
            if email and existing_email and email == existing_email:
                return {
                    "is_unique": False,
                    "reason": "duplicate_email",
                    "duplicate_field": "Email",
                    "duplicate_value": email,
                    "error": f"Duplicate resume found with same email: {email}"
                }
            
            # Check phone match
            existing_phone = existing_parsed_data.get('Phone', '').strip()
            if phone and existing_phone and phone == existing_phone:
                return {
                    "is_unique": False,
                    "reason": "duplicate_phone",
                    "duplicate_field": "Phone",
                    "duplicate_value": phone,
                    "error": f"Duplicate resume found with same phone: {phone}"
                }
            
            # Check skills match (80% similarity)
            existing_skills = existing_parsed_data.get('Skills', [])
            if isinstance(existing_skills, list):
                existing_skills_normalized = [skill.strip().lower() for skill in existing_skills if skill.strip()]
            else:
                existing_skills_normalized = [str(existing_skills).strip().lower()] if str(existing_skills).strip() else []
            
            if skills_normalized and existing_skills_normalized:
                # Calculate skills similarity
                common_skills = set(skills_normalized) & set(existing_skills_normalized)
                total_skills = len(set(skills_normalized) | set(existing_skills_normalized))
                similarity = len(common_skills) / total_skills if total_skills > 0 else 0
                
                if similarity >= 0.8:  # 80% similarity threshold
                    return {
                        "is_unique": False,
                        "reason": "duplicate_skills",
                        "duplicate_field": "Skills",
                        "similarity_percentage": round(similarity * 100, 2),
                        "error": f"Duplicate resume found with similar skills ({round(similarity * 100, 2)}% match)"
                    }
        
        return {
            "is_unique": True,
            "reason": "unique_resume",
            "extracted_fields": {
                "name": name,
                "email": email,
                "phone": phone,
                "skills_count": len(skills_normalized)
            }
        }
        
    except Exception as e:
        logger.error(f"Error checking resume uniqueness: {str(e)}")
        return {
            "is_unique": False,
            "reason": "uniqueness_check_failed",
            "error": f"Failed to check uniqueness: {str(e)}"
        }

async def _retry_failed_embeddings():
    """Retry failed embeddings in the background."""
    try:
        # Get resumes with embedding errors
        all_resumes = await database_service.get_all_resumes(limit=1000)
        failed_embeddings = []
        
        for resume in all_resumes:
            if resume.get('embedding_error') and not resume.get('embedding'):
                failed_embeddings.append(resume)
        
        if failed_embeddings:
            logger.info(f"🔄 Found {len(failed_embeddings)} resumes with failed embeddings, retrying...")
            
            for resume in failed_embeddings:
                resume_id = resume.get('id')
                parsed_data = resume.get('parsed_data', {})
                
                if isinstance(parsed_data, str):
                    try:
                        parsed_data = json.loads(parsed_data)
                    except (json.JSONDecodeError, TypeError):
                        continue
                
                if parsed_data and isinstance(parsed_data, dict):
                    # Retry embedding generation
                    await _generate_embedding_background(parsed_data, resume_id, 0, 3)
                    await asyncio.sleep(5)  # Wait 5 seconds between retries
        
    except Exception as e:
        logger.error(f"Error in retry failed embeddings: {str(e)}")

async def _generate_embedding_background(parsed_data: Dict[str, Any], resume_id: str, retry_count: int = 0, max_retries: int = 3):
    """Generate embedding for a resume in the background with automatic retry."""
    try:
        # Generate embedding for the resume
        embedding = await openai_service.generate_resume_embedding(parsed_data)
        
        if embedding:
            # Update the resume with embedding in separate column
            await database_service.update_resume_embedding_column(resume_id, embedding)
            logger.info(f"✅ Embedding generated successfully for resume {resume_id}")
            return True
        else:
            logger.warning(f"⚠️ Failed to generate embedding for resume {resume_id} (attempt {retry_count + 1})")
            
            # Retry if we haven't exceeded max retries
            if retry_count < max_retries:
                logger.info(f"🔄 Retrying embedding generation for resume {resume_id} in 30 seconds...")
                await asyncio.sleep(30)  # Wait 30 seconds before retry
                return await _generate_embedding_background(parsed_data, resume_id, retry_count + 1, max_retries)
            else:
                # Mark as failed after max retries
                await database_service.update_resume_embedding_error(resume_id, f"Failed after {max_retries} attempts")
                logger.error(f"❌ Embedding generation failed permanently for resume {resume_id} after {max_retries} attempts")
                return False
            
    except Exception as e:
        logger.error(f"❌ Error generating embedding for resume {resume_id} (attempt {retry_count + 1}): {str(e)}")
        
        # Retry if we haven't exceeded max retries
        if retry_count < max_retries:
            logger.info(f"🔄 Retrying embedding generation for resume {resume_id} in 30 seconds...")
            await asyncio.sleep(30)  # Wait 30 seconds before retry
            return await _generate_embedding_background(parsed_data, resume_id, retry_count + 1, max_retries)
        else:
            # Mark as failed after max retries
            await database_service.update_resume_embedding_error(resume_id, f"Error after {max_retries} attempts: {str(e)}")
            logger.error(f"❌ Embedding generation failed permanently for resume {resume_id} after {max_retries} attempts")
            return False

async def _process_single_file_from_data(file_data: Dict[str, Any], file_result: Dict[str, Any], batch_data_to_save: List[Dict], results: List[Dict], successful_files: int, failed_files: int, duplicate_files: int):
    """Process a single file from extracted data (zip or regular file) with uniqueness check."""
    file_start_time = time.time()  # Start timing the file processing
    try:
        # Create upload and failed folders
        os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(os.path.join(settings.UPLOAD_FOLDER, "failed"), exist_ok=True)
        
        # Process file and extract text
        extracted_text = await file_processor.process_file(file_data["content"], file_data["filename"])
        
        if not extracted_text or not extracted_text.strip():
            file_result["error"] = "No text could be extracted from the file"
            file_result["file_type"] = file_data["extension"].lstrip('.')
            file_result["processing_time"] = time.time() - file_start_time
            failed_files[0] += 1
            return
        
        # Parse resume with AI
        parsed_data = await openai_service.parse_resume_text(extracted_text)
        
        # Validate and classify parsing result
        validation_result = _validate_parsed_data(parsed_data)
        parsed_data.update(validation_result)
        
        # Generate embedding immediately after parsing
        embedding = None
        try:
            embedding = await openai_service.generate_embedding(str(parsed_data))
            if embedding:
                logger.info(f"✅ Embedding generated immediately for resume: {file_data['filename']}")
            else:
                logger.warning(f"⚠️ Failed to generate embedding for resume: {file_data['filename']}")
        except Exception as e:
            logger.error(f"❌ Error generating embedding for resume {file_data['filename']}: {str(e)}")
        
        # Check uniqueness for bulk parsing API only
        uniqueness_check = await _check_resume_uniqueness(parsed_data)
        
        if not uniqueness_check["is_unique"]:
            # Save to failed folder
            file_uuid = str(uuid.uuid4())
            unique_filename = f"{file_uuid}{file_data['extension']}"
            failed_file_path = os.path.join(settings.UPLOAD_FOLDER, "failed", unique_filename)
            
            with open(failed_file_path, "wb") as f:
                f.write(file_data["content"])
            
            # Save failure metadata
            metadata = {
                "failure_reason": uniqueness_check["error"],
                "failure_type": uniqueness_check["reason"],
                "original_filename": file_data["filename"],
                "failed_at": time.time(),
                "uniqueness_check": uniqueness_check
            }
            
            metadata_file = os.path.join(settings.UPLOAD_FOLDER, "failed", f"{file_uuid}.metadata.json")
            with open(metadata_file, "w", encoding="utf-8") as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            
            file_result.update({
                "status": "duplicate",
                "error": uniqueness_check["error"],
                "file_type": file_data["extension"].lstrip('.'),
                "processing_time": time.time() - file_start_time,
                "uniqueness_check": uniqueness_check,
                "failed_file_path": failed_file_path,
                "resume_id": file_uuid,
                "failure_reason": uniqueness_check["error"],
                "failure_type": uniqueness_check["reason"]
            })
            duplicate_files[0] += 1
            logger.warning(f"Duplicate resume rejected: {file_data['filename']} - {uniqueness_check['error']}")
            return
        
        # Resume is unique, save to upload folder
        file_uuid = str(uuid.uuid4())
        unique_filename = f"{file_uuid}{file_data['extension']}"
        file_path = os.path.join(settings.UPLOAD_FOLDER, unique_filename)
        
        with open(file_path, "wb") as f:
            f.write(file_data["content"])
        
        # Calculate processing time
        file_processing_time = time.time() - file_start_time
        
        # Determine final status based on validation
        final_status = "success"
        if validation_result.get("quality") == "partial":
            final_status = "partial_success"
        elif validation_result.get("quality") == "poor":
            final_status = "failed"
            file_result["error"] = "Insufficient data quality for parsing"
        
        # Update result for successful processing
        file_result.update({
            "status": final_status,
            "parsed_data": parsed_data,
            "file_type": file_data["extension"].lstrip('.'),
            "processing_time": file_processing_time,
            "uniqueness_check": uniqueness_check,
            "embedding_status": "completed" if embedding else "failed",
            "embedding_generated": embedding is not None,
            "warnings": validation_result.get("warnings", []),
            "quality": validation_result.get("quality", "good")
        })
        
        # Add to batch save data
        batch_data_to_save.append({
            "filename": file_data["filename"],
            "file_path": file_path,
            "file_type": file_data["extension"].lstrip('.'),
            "file_size": file_data["size"],
            "processing_time": file_processing_time,
            "parsed_data": parsed_data,
            "resume_id": file_uuid,
            "embedding": embedding  # Include embedding in batch data
        })
        
        successful_files[0] += 1
        logger.info(f"Successfully parsed unique resume: {file_data['filename']}")
        
    except Exception as e:
        file_result.update({
            "error": f"Failed to process file: {str(e)}"
        })
        failed_files[0] += 1
        logger.error(f"Error processing file {file_data['filename']}: {str(e)}")

async def _process_with_queue(files: List[UploadFile], start_time: float) -> BatchResumeParseResponse:
    """
    Process resumes using queue system for high-scale processing.
    
    Args:
        files: List of resume files
        start_time: Processing start time
        
    Returns:
        BatchResumeParseResponse: Queue processing results
    """
    from app.services.queue_service import queue_service
    
    results = []
    job_ids = []
    
    try:
        for file in files:
            # Validate file
            if not file.filename:
                results.append({
                    "filename": "unknown",
                    "status": "failed",
                    "error": "No filename provided",
                    "parsed_data": None,
                    "file_type": None,
                    "processing_time": 0,
                    "job_id": None
                })
                continue
            
            # Check file size
            file_content = await file.read()
            if len(file_content) > settings.MAX_FILE_SIZE:
                results.append({
                    "filename": file.filename,
                    "status": "failed",
                    "error": f"File too large. Maximum size: {settings.MAX_FILE_SIZE} bytes",
                    "parsed_data": None,
                    "file_type": file.filename.split('.')[-1],
                    "processing_time": 0,
                    "job_id": None
                })
                continue
            
            # Check file extension
            file_extension = os.path.splitext(file.filename)[1].lower()
            if file_extension not in settings.ALLOWED_EXTENSIONS:
                results.append({
                    "filename": file.filename,
                    "status": "failed",
                    "error": f"Unsupported file format. Supported formats: {', '.join(settings.ALLOWED_EXTENSIONS)}",
                    "parsed_data": None,
                    "file_type": file_extension.lstrip('.'),
                    "processing_time": 0,
                    "job_id": None
                })
                continue
            
            # Add to queue
            try:
                job_id = await queue_service.add_resume_job(
                    file_data=file_content,
                    filename=file.filename
                )
                
                results.append({
                    "filename": file.filename,
                    "status": "queued",
                    "error": None,
                    "parsed_data": None,
                    "file_type": file_extension.lstrip('.'),
                    "processing_time": 0,
                    "job_id": job_id,
                    "message": "Resume queued for processing. Use job_id to check status."
                })
                job_ids.append(job_id)
                
            except Exception as e:
                results.append({
                    "filename": file.filename,
                    "status": "failed",
                    "error": f"Failed to queue resume: {str(e)}",
                    "parsed_data": None,
                    "file_type": file_extension.lstrip('.'),
                    "processing_time": 0,
                    "job_id": None
                })
        
        total_processing_time = time.time() - start_time
        successful_files = len([r for r in results if r["status"] == "queued"])
        failed_files = len([r for r in results if r["status"] == "failed"])
        
        return BatchResumeParseResponse(
            total_files=len(files),
            successful_files=successful_files,
            failed_files=failed_files,
            total_processing_time=total_processing_time,
            results=results,
            queue_info={
                "processing_mode": "async_queue",
                "job_ids": job_ids,
                "status_endpoint": "/api/v1/job-status/{job_id}",
                "estimated_processing_time": "2-5 minutes"
            }
        )
        
    except Exception as e:
        logger.error(f"Error in queue processing: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process resumes with queue: {str(e)}"
        )

@router.get("/job-status/{job_id}")
async def get_job_status(job_id: str):
    """
    Get processing status for a queued resume job.
    
    Args:
        job_id: Job identifier from queue processing
        
    Returns:
        Dict: Job status and results
    """
    try:
        from app.services.queue_service import queue_service
        status_info = await queue_service.get_job_status(job_id)
        
        if "error" in status_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=status_info["error"]
            )
        
        return status_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting job status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get job status: {str(e)}"
        )

@router.get("/candaidte-job-appliction-reume-queue-status")
async def get_queue_status():
    """
    Get current queue status and statistics.
    
    Returns:
        Dict: Queue statistics
    """
    try:
        from app.services.queue_service import queue_service
        
        # Check if Redis is available
        if not queue_service.redis_client:
            return {
                "queue_length": 0,
                "status": "redis_unavailable",
                "max_concurrent_jobs": 1000,
                "estimated_processing_time": "N/A - Redis not available",
                "processing_mode": "synchronous_fallback",
                "message": "Redis server not available. Using synchronous processing fallback.",
                "redis_status": "disconnected"
            }
        
        queue_length = await queue_service.get_queue_length()
        
        return {
            "queue_length": queue_length,
            "status": "operational",
            "max_concurrent_jobs": 1000,
            "estimated_processing_time": f"{queue_length * 2} minutes",
            "processing_mode": "async_queue",
            "redis_status": "connected"
        }
        
    except Exception as e:
        logger.error(f"Error getting queue status: {str(e)}")
        return {
            "queue_length": 0,
            "status": "error",
            "max_concurrent_jobs": 1000,
            "estimated_processing_time": "N/A",
            "processing_mode": "synchronous_fallback",
            "error": str(e),
            "redis_status": "error"
        }

@router.post("/bulk-parse-resumes")
@limiter.limit("5/minute")  # Rate limit: 5 bulk requests per minute per IP
async def bulk_parse_resumes(request: Request, files: List[UploadFile] = File(...), company_id: int = Query(None, description="Company ID for data isolation")):
    """
    Bulk parse multiple resume files with high-scale processing support for 1000+ users.
    Supports unlimited file uploads (1000, 20000+ resumes) with async queue processing.
    Handles folder uploads with nested directories and various file formats.
    Supports: PDF, DOCX, DOC, TXT, RTF, PNG, JPG, JPEG, WEBP
    
    IMPORTANT: For folder uploads, you need to:
    1. Zip the folder containing resume files
    2. Upload the zip file as a single file
    3. The system will extract and process all resume files inside
    
    FOR RE-UPLOADING FAILED RESUMES:
    - Use the separate /api/v1/re-upload-failed-resumes endpoint
    - This endpoint only handles new file uploads
    
    Args:
        files: Multiple resume files to parse (unlimited count) OR zip files containing folders
        
    Returns:
        Dict: Bulk processing results with job tracking
        
    Raises:
        HTTPException: If file processing or parsing fails
    """
    start_time = time.time()
    
    # Extract authentication token from request headers
    auth_token = request.headers.get("authorization", "").replace("Bearer ", "") if request.headers.get("authorization") else None
    
    # Create a bulk processing job ID
    bulk_job_id = str(uuid.uuid4())
    user_id = getattr(request.client, 'host', 'unknown') if hasattr(request, 'client') else 'unknown'
    
    # Track the bulk processing job
    bulk_processing_jobs[bulk_job_id] = {
        "job_id": bulk_job_id,
        "status": "processing",
        "user_id": user_id,
        "created_at": time.time(),
        "updated_at": time.time(),
        "total_files": 0,
        "processed_files": 0,
        "successful_files": 0,
        "failed_files": 0,
        "duplicate_files": 0,
        "progress": "0",
        "results": []
    }
    
    # Debug logging
    logger.info(f"Received request - files: {files}")
    logger.info(f"Files type: {type(files)}")
    
    # Check if we have files
    if not files or len(files) == 0:
        logger.error("No files provided")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files provided"
        )
    
    # Validate file count
    if len(files) > 50000:  # Reasonable limit for bulk processing
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many files. Maximum 50,000 files per bulk request."
        )
    
    # Check if queue system is available for high-scale processing
    try:
        from app.services.queue_service import queue_service
        
        # If Redis is available, use queue-based processing for high-scale
        if queue_service.redis_client:
            return await _process_bulk_with_queue(files, start_time)
        else:
            logger.warning("⚠️ Queue system not available, falling back to synchronous processing")
    except Exception as e:
        logger.warning(f"⚠️ Queue system error: {str(e)}, falling back to synchronous processing")
    
    # Fallback: run processing in background and return immediately with jobId
    try:
        import asyncio
        # Snapshot headers we need
        auth_token = request.headers.get("authorization", "").replace("Bearer ", "") if request.headers.get("authorization") else None
        # Launch background task to process with ultra-fast processing
        asyncio.create_task(_background_process_bulk_ultra_fast(files, bulk_job_id, company_id, auth_token, request))
        return {
            "status": "queued",
            "job_id": bulk_job_id,
            "bulk_job_id": bulk_job_id,  # Keep both for compatibility
            "message": "Bulk parsing started in background",
            "status_endpoint": f"/api/v1/bulk-processing-status/{bulk_job_id}"
        }
    except Exception as e:
        logger.warning(f"⚠️ Background task launch failed, executing inline: {str(e)}")

    # Synchronous inline (last resort)
    results = []
    successful_files = [0]  # Use list to make it mutable
    failed_files = [0]      # Use list to make it mutable
    duplicate_files = [0]   # Use list to make it mutable
    batch_data_to_save = []
    all_files_to_process = []
    
    try:
        # Extract files from zip files and collect all files to process
        for file in files:
            file_extension = os.path.splitext(file.filename)[1].lower()
            
            if file_extension == '.zip':
                # Extract resume files from zip
                try:
                    extracted_files = await _extract_resume_files_from_zip(file)
                    for extracted_file in extracted_files:
                        all_files_to_process.append({
                            "filename": extracted_file["filename"],
                            "content": extracted_file["content"],
                            "size": extracted_file["size"],
                            "extension": extracted_file["extension"],
                            "is_from_zip": True,
                            "original_zip": file.filename
                        })
                except Exception as e:
                    logger.error(f"Error processing zip file {file.filename}: {str(e)}")
                    results.append({
                        "filename": file.filename,
                        "status": "failed",
                        "error": f"Failed to extract zip file: {str(e)}",
                        "parsed_data": None,
                        "file_type": "zip",
                        "processing_time": 0,
                        "file_index": len(results) + 1
                    })
                    failed_files[0] += 1
            else:
                # Regular file
                file_content = await file.read()
                file_size = len(file_content)
                file_ext = os.path.splitext(file.filename)[1].lower()
                
                all_files_to_process.append({
                    "filename": file.filename,
                    "content": file_content,
                    "size": file_size,
                    "extension": file_ext,
                    "is_from_zip": False,
                    "original_zip": None
                })
        
        # Update job status with total files count
        if bulk_job_id in bulk_processing_jobs:
            bulk_processing_jobs[bulk_job_id].update({
                "total_files": len(all_files_to_process),
                "updated_at": time.time()
            })
        
        # Process all collected files
        for i, file_data in enumerate(all_files_to_process):
            # Check if job was cancelled
            if bulk_job_id in bulk_processing_jobs and bulk_processing_jobs[bulk_job_id].get("status") == "cancelled":
                logger.info(f"Job {bulk_job_id} was cancelled, stopping processing")
                break
                
            file_start_time = time.time()
            file_result = {
                "filename": file_data["filename"],
                "status": "failed",
                "error": None,
                "parsed_data": None,
                "file_type": None,
                "processing_time": 0,
                "file_index": i + 1,
                "is_from_zip": file_data["is_from_zip"],
                "original_zip": file_data["original_zip"]
            }
            
            try:
                # Validate file
                        if not file_data["filename"]:
                            file_result["error"] = "No filename provided"
                            failed_files[0] += 1
                        else:
                            # Check file extension
                            file_extension = file_data["extension"]
                            if file_extension not in settings.ALLOWED_EXTENSIONS:
                                file_result["error"] = f"Unsupported file format. Supported formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
                                file_result["file_type"] = file_extension.lstrip('.')
                                failed_files[0] += 1
                            else:
                                # Check file size
                                file_size = file_data["size"]
                                if file_size > settings.MAX_FILE_SIZE:
                                    file_result["error"] = f"File size exceeds maximum limit of {settings.MAX_FILE_SIZE} bytes"
                                    file_result["file_type"] = file_extension.lstrip('.')
                                    failed_files[0] += 1
                                else:
                                    # Check if job was cancelled before processing
                                    if bulk_job_id in bulk_processing_jobs and bulk_processing_jobs[bulk_job_id].get("status") == "cancelled":
                                        logger.info(f"Job {bulk_job_id} was cancelled, skipping file processing")
                                        file_result["error"] = "Processing cancelled by user"
                                        failed_files[0] += 1
                                    else:
                                        # Process the file
                                        await _process_single_file_from_data(file_data, file_result, batch_data_to_save, results, successful_files, failed_files, duplicate_files)
            
            except Exception as e:
                file_processing_time = time.time() - file_start_time
                file_result.update({
                    "error": f"Failed to process file: {str(e)}",
                    "processing_time": file_processing_time
                })
                failed_files[0] += 1
                logger.error(f"Error processing file {file.filename}: {str(e)}")
            
            results.append(file_result)
            
            # Update job progress and store results incrementally
            if bulk_job_id in bulk_processing_jobs:
                progress_percentage = round(((i + 1) / len(all_files_to_process)) * 100, 2)
                bulk_processing_jobs[bulk_job_id].update({
                    "processed_files": i + 1,
                    "successful_files": successful_files[0],
                    "failed_files": failed_files[0],
                    "duplicate_files": duplicate_files[0],
                    "progress": str(progress_percentage),
                    "updated_at": time.time(),
                    "results": results.copy()  # Store current results incrementally
                })
            
            # Progress update every 100 files
            if (i + 1) % 100 == 0:
                logger.info(f"Processed {i + 1}/{len(all_files_to_process)} files...")
        
        # Save successful files to database in batch
        if batch_data_to_save:
            try:
                # Prefer the function argument company_id if provided via Query param
                resolved_company_id = None
                try:
                    if company_id is not None:
                        resolved_company_id = int(company_id)
                except Exception:
                    resolved_company_id = None

                # Fallback to query param if not provided in signature
                if resolved_company_id is None:
                    qp_id = request.query_params.get('company_id')
                    if qp_id:
                        try:
                            resolved_company_id = int(qp_id)
                        except Exception:
                            resolved_company_id = None

                # Fallback to auth middleware state (when JWT protected endpoints are used)
                if resolved_company_id is None and hasattr(request, 'state') and getattr(request.state, 'company_id', None):
                    try:
                        resolved_company_id = int(request.state.company_id)
                    except Exception:
                        resolved_company_id = None
                
                # Persist
                print(f"🔍 Debug - About to save batch data: {len(batch_data_to_save)} items")
                print(f"🔍 Debug - Resolved company_id: {resolved_company_id}")
                print(f"🔍 Debug - First item keys: {list(batch_data_to_save[0].keys()) if batch_data_to_save else 'No items'}")
                record_ids = await database_service.save_batch_resume_data(batch_data_to_save, resolved_company_id)
                print(f"🔍 Debug - Save returned record_ids: {record_ids}")
                logger.info(f"Successfully saved {len(record_ids)} resume records to database for company: {resolved_company_id}")
                
                # Save embeddings immediately for resumes that have them
                for i, (resume_data, db_id) in enumerate(zip(batch_data_to_save, record_ids)):
                    if 'embedding' in resume_data and resume_data['embedding']:
                        try:
                            await database_service.update_resume_embedding_column(
                                db_id, 
                                resume_data['embedding']
                            )
                            logger.info(f"✅ Embedding saved immediately for resume {i+1}/{len(batch_data_to_save)} (DB ID: {db_id})")
                        except Exception as e:
                            logger.error(f"❌ Error saving embedding for resume {i+1} (DB ID: {db_id}): {str(e)}")
                
                # Update all results with candidate creation status (including duplicates)
                for result in results:
                    if result.get('status') == 'duplicate':
                        # Duplicate files don't go through candidate creation
                        result['candidate_created'] = False
                        result['candidate_creation_error'] = 'File marked as duplicate'
                    else:
                        # Non-duplicate files will be processed for candidate creation
                        result['candidate_created'] = False  # Will be updated after candidate creation
                        result['candidate_creation_error'] = None
                        result['candidate_id'] = None
                        result['resume_id'] = None

                # Auto-create candidates from parsed resume data
                print(f"🔍 Checking candidate creation: record_ids={len(record_ids) if record_ids else 0}, company_id={resolved_company_id}")
                print(f"🔍 record_ids content: {record_ids}")
                print(f"🔍 resolved_company_id: {resolved_company_id}")
                if record_ids and resolved_company_id:
                    try:
                        print(f"🔍 Auto-creating candidates from {len(record_ids)} parsed resumes")
                        candidate_creation_result = await create_candidates_from_resume_data(
                            resume_data_ids=record_ids,
                            company_id=resolved_company_id,
                            auth_token=auth_token
                        )
                        
                        if candidate_creation_result["success"]:
                            candidate_data = candidate_creation_result["data"]
                            print(f"🔍 Candidate creation completed: {candidate_data.get('summary', {})}")
                            
                            # Update the bulk job with candidate creation stats
                            if bulk_job_id in bulk_processing_jobs:
                                bulk_processing_jobs[bulk_job_id]["candidates_created"] = candidate_data.get('summary', {}).get('success', 0)
                                bulk_processing_jobs[bulk_job_id]["candidates_failed"] = candidate_data.get('summary', {}).get('failed', 0)
                                bulk_processing_jobs[bulk_job_id]["candidates_duplicates"] = candidate_data.get('summary', {}).get('duplicates', 0)
                            
                            # Update individual file results with candidate creation status
                            candidates_created = candidate_data.get('summary', {}).get('success', 0)
                            candidates_failed = candidate_data.get('summary', {}).get('failed', 0)
                            
                            # Update results array with candidate creation status
                            for i, result in enumerate(results):
                                if i < len(record_ids):  # Only update results that correspond to created records
                                    result['candidate_created'] = True
                                    result['candidate_creation_error'] = None
                                else:
                                    result['candidate_created'] = False
                                    result['candidate_creation_error'] = 'No corresponding database record'
                            
                            # Recalculate successful_files and failed_files based on candidate creation
                            # A file is successful only if both parsing AND candidate creation succeeded
                            successful_files[0] = candidates_created
                            failed_files[0] = len(all_files_to_process) - successful_files[0]
                            
                            print(f"🔍 Updated counts - Successful: {successful_files[0]}, Failed: {failed_files[0]}")
                            
                        else:
                            error_msg = candidate_creation_result.get('error', 'Unknown error')
                            suggested_action = candidate_creation_result.get('suggested_action', 'Please try again later.')
                            print(f"🔍 Candidate creation failed: {error_msg}")
                            print(f"🔍 Suggested action: {suggested_action}")
                            
                            # Update the bulk job with error information
                            if bulk_job_id in bulk_processing_jobs:
                                bulk_processing_jobs[bulk_job_id]["candidate_creation_error"] = error_msg
                                bulk_processing_jobs[bulk_job_id]["candidate_creation_suggestion"] = suggested_action
                            
                            # Update individual file results with candidate creation failure
                            for result in results:
                                result['candidate_created'] = False
                                result['candidate_creation_error'] = error_msg
                            
                            # All files failed due to candidate creation failure
                            failed_files[0] = len(all_files_to_process)
                            successful_files[0] = 0
                            
                            print(f"🔍 All files failed due to candidate creation - Successful: {successful_files[0]}, Failed: {failed_files[0]}")
                            
                    except Exception as e:
                        print(f"🔍 Error in auto-candidate creation: {str(e)}")
                        logger.error(f"Error in auto-candidate creation: {str(e)}")
                        
                        # Update the bulk job with error information
                        if bulk_job_id in bulk_processing_jobs:
                            bulk_processing_jobs[bulk_job_id]["candidate_creation_error"] = f"Unexpected error: {str(e)}"
                            bulk_processing_jobs[bulk_job_id]["candidate_creation_suggestion"] = "Please contact support if this issue persists."
                        
                        # Update individual file results with candidate creation failure
                        for result in results:
                            result['candidate_created'] = False
                            result['candidate_creation_error'] = f"Unexpected error: {str(e)}"
                        
                        # All files failed due to candidate creation error
                        failed_files[0] = len(all_files_to_process)
                        successful_files[0] = 0
                        
                        print(f"🔍 All files failed due to candidate creation error - Successful: {successful_files[0]}, Failed: {failed_files[0]}")
                else:
                    # No record_ids means all files were duplicates or failed parsing
                    print(f"🔍 No database records created - all files were duplicates or failed parsing")
                    print(f"🔍 record_ids: {record_ids}, resolved_company_id: {resolved_company_id}")
                    # Count duplicates and failed files
                    duplicate_count = len([r for r in results if r.get('status') == 'duplicate'])
                    failed_count = len([r for r in results if r.get('status') == 'failed'])
                    successful_files[0] = 0
                    failed_files[0] = duplicate_count + failed_count
                    print(f"🔍 Final counts - Successful: {successful_files[0]}, Failed: {failed_files[0]}, Duplicates: {duplicate_count}")
                    
                    # Update results with candidate creation status for non-duplicate files
                    for result in results:
                        if result.get('status') != 'duplicate':
                            result['candidate_created'] = False
                            result['candidate_creation_error'] = 'No database records created for candidate creation'
                            result['candidate_id'] = None
                            result['resume_id'] = None
                
            except Exception as e:
                # Surface precise DB error context
                logger.error(f"Error saving batch data to database: {str(e)} | items={len(batch_data_to_save)}")
        
        total_processing_time = time.time() - start_time
        
        # Update job status to completed
        if bulk_job_id in bulk_processing_jobs:
            bulk_processing_jobs[bulk_job_id].update({
                "status": "completed",
                "updated_at": time.time(),
                "total_files": len(all_files_to_process),
                "processed_files": len(all_files_to_process),
                "successful_files": successful_files[0],
                "failed_files": failed_files[0],
                "duplicate_files": duplicate_files[0],
                "progress": "100",
                "total_processing_time": total_processing_time,
                "results": results
            })
        
        return {
            "total_files": len(all_files_to_process),
            "successful_files": successful_files[0],
            "failed_files": failed_files[0],
            "duplicate_files": duplicate_files[0],
            "total_processing_time": total_processing_time,
            "results": results,
            "processing_mode": "synchronous_bulk",
            "success_rate": round((successful_files[0] / len(all_files_to_process) * 100) if len(all_files_to_process) > 0 else 0, 2),
            "duplicate_rate": round((duplicate_files[0] / len(all_files_to_process) * 100) if len(all_files_to_process) > 0 else 0, 2),
            "zip_files_processed": len([f for f in files if f.filename.endswith('.zip')]),
            "extracted_files_count": len(all_files_to_process),
            "bulk_job_id": bulk_job_id,
            "candidates_created": bulk_processing_jobs.get(bulk_job_id, {}).get("candidates_created", 0),
            "candidates_failed": bulk_processing_jobs.get(bulk_job_id, {}).get("candidates_failed", 0),
            "candidates_duplicates": bulk_processing_jobs.get(bulk_job_id, {}).get("candidates_duplicates", 0)
        }
        
    except Exception as e:
        logger.error(f"Error in bulk resume parsing: {str(e)}")
        
        # Update job status to failed
        if bulk_job_id in bulk_processing_jobs:
            bulk_processing_jobs[bulk_job_id].update({
                "status": "failed",
                "updated_at": time.time(),
                "error": str(e),
                "progress": "0"
            })
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process bulk resumes: {str(e)}"
        )

async def _background_process_bulk(files: List[UploadFile], bulk_job_id: str, company_id: Optional[int], auth_token: Optional[str], request: Request) -> None:
    """Process files in background using the existing synchronous logic, updating bulk_processing_jobs."""
    try:
        start_time = time.time()
        # Collect all files (re-using logic similar to inline flow)
        all_files_to_process = []
        results: List[Dict[str, Any]] = []
        successful_files = [0]
        failed_files = [0]
        duplicate_files = [0]
        batch_data_to_save: List[Dict[str, Any]] = []

        for file in files:
            file_extension = os.path.splitext(file.filename)[1].lower()
            if file_extension == '.zip':
                try:
                    extracted_files = await _extract_resume_files_from_zip(file)
                    for extracted_file in extracted_files:
                        all_files_to_process.append({
                            "filename": extracted_file["filename"],
                            "content": extracted_file["content"],
                            "size": extracted_file["size"],
                            "extension": extracted_file["extension"],
                            "is_from_zip": True,
                            "original_zip": file.filename
                        })
                except Exception as e:
                    results.append({
                        "filename": file.filename,
                        "status": "failed",
                        "error": f"Failed to extract zip file: {str(e)}",
                        "parsed_data": None,
                        "file_type": "zip",
                        "processing_time": 0,
                        "file_index": len(results) + 1
                    })
                    failed_files[0] += 1
            else:
                content = await file.read()
                all_files_to_process.append({
                    "filename": file.filename,
                    "content": content,
                    "size": len(content),
                    "extension": file_extension,
                    "is_from_zip": False,
                    "original_zip": None
                })

        if bulk_job_id in bulk_processing_jobs:
            bulk_processing_jobs[bulk_job_id].update({
                "total_files": len(all_files_to_process),
                "updated_at": time.time()
            })

        for i, file_data in enumerate(all_files_to_process):
            if bulk_job_id in bulk_processing_jobs and bulk_processing_jobs[bulk_job_id].get("status") == "cancelled":
                break
            file_result = {
                "filename": file_data["filename"],
                "status": "failed",
                "error": None,
                "parsed_data": None,
                "file_type": None,
                "processing_time": 0,
                "file_index": i + 1,
                "is_from_zip": file_data["is_from_zip"],
                "original_zip": file_data["original_zip"]
            }
            file_start = time.time()
            try:
                await _process_single_file_from_data(file_data, file_result, batch_data_to_save, results, successful_files, failed_files, duplicate_files)
                # Post-validate parsed_data for partial_success classification
                parsed = file_result.get("parsed_data") or {}
                if isinstance(parsed, dict):
                    missing = []
                    if not str(parsed.get("Email", "")).strip():
                        missing.append("email")
                    if not str(parsed.get("Phone", "")).strip():
                        missing.append("phone")
                    if missing and file_result.get("status") == "success":
                        file_result["status"] = "partial_success"
                        file_result["warnings"] = [f"missing_{m}" for m in missing]
                # Ensure file_type populated from extension
                if not file_result.get("file_type") and file_data.get("extension"):
                    file_result["file_type"] = file_data["extension"].lstrip('.')
            except Exception as e:
                file_result["error"] = f"Failed to process file: {str(e)}"
                file_result["processing_time"] = time.time() - file_start
                failed_files[0] += 1
            results.append(file_result)
            if bulk_job_id in bulk_processing_jobs:
                progress_percentage = round(((i + 1) / max(1, len(all_files_to_process))) * 100, 2)
                bulk_processing_jobs[bulk_job_id].update({
                    "processed_files": i + 1,
                    "successful_files": successful_files[0],
                    "failed_files": failed_files[0],
                    "duplicate_files": duplicate_files[0],
                    "progress": str(progress_percentage),
                    "updated_at": time.time(),
                    "results": results.copy()
                })

        # Save to DB in batch (re-using existing code path)
        if batch_data_to_save:
            resolved_company_id = None
            try:
                if company_id is not None:
                    resolved_company_id = int(company_id)
            except Exception:
                resolved_company_id = None
            if resolved_company_id is None and hasattr(request, 'state') and getattr(request.state, 'company_id', None):
                try:
                    resolved_company_id = int(request.state.company_id)
                except Exception:
                    resolved_company_id = None
            try:
                record_ids = await database_service.save_batch_resume_data(batch_data_to_save, resolved_company_id)
                for i, (resume_data, db_id) in enumerate(zip(batch_data_to_save, record_ids)):
                    if 'embedding' in resume_data and resume_data['embedding']:
                        try:
                            await database_service.update_resume_embedding_column(db_id, resume_data['embedding'])
                        except Exception:
                            pass
            except Exception as e:
                logger.error(f"Error saving batch data (background): {str(e)}")

        total_time = time.time() - start_time
        if bulk_job_id in bulk_processing_jobs:
            bulk_processing_jobs[bulk_job_id].update({
                "status": "completed",
                "updated_at": time.time(),
                "total_files": len(all_files_to_process),
                "processed_files": len(all_files_to_process),
                "successful_files": successful_files[0],
                "failed_files": failed_files[0],
                "duplicate_files": duplicate_files[0],
                "progress": "100",
                "total_processing_time": total_time,
                "results": results
            })
    except Exception as e:
        logger.error(f"Background bulk processing error: {str(e)}")
        if bulk_job_id in bulk_processing_jobs:
            bulk_processing_jobs[bulk_job_id].update({
                "status": "failed",
                "updated_at": time.time(),
                "error": str(e),
                "progress": bulk_processing_jobs[bulk_job_id].get("progress", "0")
            })

async def _background_process_bulk_ultra_fast(files: List[UploadFile], bulk_job_id: str, company_id: Optional[int], auth_token: Optional[str], request: Request) -> None:
    """Ultra-fast background processing with massive parallelization."""
    try:
        start_time = time.time()
        
        # Import ultra-fast processor
        from app.controllers._process_single_file_ultra_fast import _process_single_file_ultra_fast, _stream_files_ultra_fast
        from app.config.settings import settings
        
        # CRITICAL: Process ALL files in parallel (not chunks)
        MAX_CONCURRENT_FILES = settings.MAX_CONCURRENT_FILES
        semaphore = asyncio.Semaphore(MAX_CONCURRENT_FILES)
        
        async def process_single_file_with_semaphore(file_data):
            async with semaphore:
                return await _process_single_file_ultra_fast(file_data, company_id)
        
        # Collect all files first (streaming to avoid memory issues)
        logger.info(f"🚀 Collecting files for ultra-fast processing...")
        all_files = await _stream_files_ultra_fast(files)
        
        # Process ALL files in parallel
        logger.info(f"🚀 Starting ultra-fast processing of {len(all_files)} files with {MAX_CONCURRENT_FILES} concurrent workers...")
        
        # Create tasks for all files
        tasks = [process_single_file_with_semaphore(file_data) for file_data in all_files]
        
        # Process all files concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Separate successful and failed results
        successful_results = []
        failed_count = 0
        
        for result in results:
            if isinstance(result, dict) and result.get('status') == 'success':
                successful_results.append(result.get('data'))
            else:
                failed_count += 1
        
        # Ultra-fast batch save to database
        if successful_results:
            logger.info(f"🚀 Saving {len(successful_results)} successful results to database...")
            await database_service.save_batch_resume_data_ultra_fast(successful_results, company_id)
        
        total_time = time.time() - start_time
        logger.info(f"🚀 Ultra-fast processing completed in {total_time:.2f} seconds")
        logger.info(f"🚀 Successfully processed: {len(successful_results)} files")
        logger.info(f"🚀 Failed: {failed_count} files")
        
        # Update final status
        if bulk_job_id in bulk_processing_jobs:
            bulk_processing_jobs[bulk_job_id].update({
                "status": "completed",
                "total_files": len(all_files),
                "successful_files": len(successful_results),
                "failed_files": failed_count,
                "total_processing_time": total_time,
                "progress": "100"
            })
            
    except Exception as e:
        logger.error(f"Error in ultra-fast processing: {str(e)}")
        if bulk_job_id in bulk_processing_jobs:
            bulk_processing_jobs[bulk_job_id].update({
                "status": "failed",
                "error": str(e)
            })

@router.get("/bulk-processing-status/{job_id}")
async def get_bulk_job_status(job_id: str):
    """Return precise status for a single bulk job (background or in-memory)."""
    try:
        # Prefer Redis if available
        try:
            from app.services.queue_service import queue_service
            if queue_service.redis_client:
                status = await queue_service.get_job_status(job_id)
                if status and not status.get("error"):
                    return status
        except Exception:
            pass
        # Fallback to in-memory
        job = bulk_processing_jobs.get(job_id)
        if not job:
            return {"error": "Job not found", "job_id": job_id}
        # Compute a more accurate progress if possible
        total = max(1, int(job.get("total_files", 0)))
        processed = int(job.get("processed_files", 0))
        progress = round((processed / total) * 100, 2)
        job_copy = dict(job)
        job_copy["progress"] = str(progress)
        return job_copy
    except Exception as e:
        return {"error": str(e), "job_id": job_id}

async def _process_bulk_with_queue(files: List[UploadFile], start_time: float) -> Dict[str, Any]:
    """
    Process bulk resumes using queue system for high-scale processing.
    
    Args:
        files: List of resume files
        start_time: Processing start time
        
    Returns:
        Dict: Queue processing results
    """
    from app.services.queue_service import queue_service
    
    results = []
    job_ids = []
    successful_queued = 0
    failed_files = 0
    
    try:
        for i, file in enumerate(files):
            # Validate file
            if not file.filename:
                results.append({
                    "filename": "unknown",
                    "status": "failed",
                    "error": "No filename provided",
                    "parsed_data": None,
                    "file_type": None,
                    "processing_time": 0,
                    "file_index": i + 1,
                    "job_id": None
                })
                failed_files += 1
                continue
            
            # Check file size
            file_content = await file.read()
            if len(file_content) > settings.MAX_FILE_SIZE:
                results.append({
                    "filename": file.filename,
                    "status": "failed",
                    "error": f"File too large. Maximum size: {settings.MAX_FILE_SIZE} bytes",
                    "parsed_data": None,
                    "file_type": file.filename.split('.')[-1],
                    "processing_time": 0,
                    "file_index": i + 1,
                    "job_id": None
                })
                failed_files += 1
                continue
            
            # Check file extension
            file_extension = os.path.splitext(file.filename)[1].lower()
            if file_extension not in settings.ALLOWED_EXTENSIONS:
                results.append({
                    "filename": file.filename,
                    "status": "failed",
                    "error": f"Unsupported file format. Supported formats: {', '.join(settings.ALLOWED_EXTENSIONS)}",
                    "parsed_data": None,
                    "file_type": file_extension.lstrip('.'),
                    "processing_time": 0,
                    "file_index": i + 1,
                    "job_id": None
                })
                failed_files += 1
                continue
            
            # Add to queue
            try:
                job_id = await queue_service.add_resume_job(
                    file_data=file_content,
                    filename=file.filename
                )
                
                results.append({
                    "filename": file.filename,
                    "status": "queued",
                    "error": None,
                    "parsed_data": None,
                    "file_type": file_extension.lstrip('.'),
                    "processing_time": 0,
                    "file_index": i + 1,
                    "job_id": job_id,
                    "message": "Resume queued for processing. Use job_id to check status."
                })
                job_ids.append(job_id)
                successful_queued += 1
                
            except Exception as e:
                results.append({
                    "filename": file.filename,
                    "status": "failed",
                    "error": f"Failed to queue resume: {str(e)}",
                    "parsed_data": None,
                    "file_type": file_extension.lstrip('.'),
                    "processing_time": 0,
                    "file_index": i + 1,
                    "job_id": None
                })
                failed_files += 1
            
            # Progress update every 100 files
            if (i + 1) % 100 == 0:
                logger.info(f"Queued {i + 1}/{len(files)} files...")
        
        total_processing_time = time.time() - start_time
        
        return {
            "total_files": len(files),
            "successful_files": successful_queued,
            "failed_files": failed_files,
            "total_processing_time": total_processing_time,
            "results": results,
            "processing_mode": "async_queue_bulk",
            "queue_info": {
                "job_ids": job_ids,
                "status_endpoint": "/api/v1/bulk-processing-status/{job_id}",
                "estimated_processing_time": f"{len(job_ids) * 2} minutes",
                "max_concurrent_jobs": 1000
            },
            "success_rate": round((successful_queued / len(files) * 100) if len(files) > 0 else 0, 2)
        }
        
    except Exception as e:
        logger.error(f"Error in bulk queue processing: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process bulk resumes with queue: {str(e)}"
        )

@router.post("/cancel-job/{job_id}")
async def cancel_job(job_id: str):
    """
    Cancel a specific resume processing job.
    
    Args:
        job_id: Job identifier to cancel
        
    Returns:
        Dict: Cancellation result
    """
    try:
        from app.services.queue_service import queue_service
        
        if not queue_service.redis_client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Queue system not available"
            )
        
        success = await queue_service.cancel_job(job_id)
        
        if success:
            return {
                "message": "Job cancelled successfully",
                "job_id": job_id,
                "status": "cancelled"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found or already completed"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling job {job_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel job: {str(e)}"
        )

@router.post("/cancel-all-jobs")
async def cancel_all_jobs():
    """
    Cancel all active resume processing jobs.
    
    Returns:
        Dict: Cancellation result
    """
    try:
        cancelled_count = 0
        
        # Cancel all jobs in the in-memory tracking
        for job_id, job in bulk_processing_jobs.items():
            if job.get("status") in ["processing", "queued"]:
                job["status"] = "cancelled"
                job["updated_at"] = time.time()
                cancelled_count += 1
        
        logger.info(f"Cancelled {cancelled_count} processing jobs")
        
        return {
            "message": f"Successfully cancelled {cancelled_count} processing jobs",
            "cancelled_count": cancelled_count,
            "total_jobs": len(bulk_processing_jobs),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error cancelling all jobs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel all jobs: {str(e)}"
        )

@router.get("/bulk-processing-status")
async def get_all_bulk_processing_status():
    """
    Get processing status for all bulk resume jobs from all users.
    Shows how many users are uploading and their progress.
    
    Returns:
        Dict: All users' bulk processing status with user count and progress
    """
    try:
        from app.services.queue_service import queue_service
        
        # Check if Redis is available
        if not queue_service.redis_client:
            # Use global tracking for bulk processing jobs
            total_jobs = len(bulk_processing_jobs)
            active_jobs = len([job for job in bulk_processing_jobs.values() if job.get("status") in ["processing", "queued"]])
            completed_jobs = len([job for job in bulk_processing_jobs.values() if job.get("status") == "completed"])
            failed_jobs = len([job for job in bulk_processing_jobs.values() if job.get("status") == "failed"])
            duplicate_jobs = len([job for job in bulk_processing_jobs.values() if job.get("status") == "duplicate"])
            
            # Count unique users
            unique_users = set(job.get("user_id", "unknown") for job in bulk_processing_jobs.values())
            active_users = set(job.get("user_id", "unknown") for job in bulk_processing_jobs.values() if job.get("status") in ["processing", "queued"])
            
            # Calculate total file counts from all jobs
            total_files = sum(job.get("total_files", 0) for job in bulk_processing_jobs.values())
            successful_files = sum(job.get("successful_files", 0) for job in bulk_processing_jobs.values())
            failed_files = sum(job.get("failed_files", 0) for job in bulk_processing_jobs.values())
            duplicate_files = sum(job.get("duplicate_files", 0) for job in bulk_processing_jobs.values())
            
            # Calculate progress based on processed files
            total_processed_files = successful_files + failed_files + duplicate_files
            progress_percentage = round((total_processed_files / total_files * 100) if total_files > 0 else 0, 2)
            
            # Collect all file results from all jobs
            all_file_results = []
            filtered_jobs = []
            for job in bulk_processing_jobs.values():
                logger.info(f"Job {job.get('job_id')} status: {job.get('status')}, has results: {bool(job.get('results'))}")
                # Skip jobs that have no files and no results
                if (job.get("total_files", 0) == 0) and (not job.get("results")) and (job.get("processed_files", 0) == 0):
                    continue
                filtered_jobs.append(job)
                if job.get("results"):
                    all_file_results.extend(job.get("results", []))
                    logger.info(f"Job {job.get('job_id')} has {len(job.get('results', []))} results")
                # Also check for partial results in active jobs
                elif job.get("status") == "processing" and job.get("processed_files", 0) > 0:
                    logger.info(f"Job {job.get('job_id')} is processing, processed files: {job.get('processed_files', 0)}")
                    # Active jobs now have incremental results
                    if job.get("results"):
                        all_file_results.extend(job.get("results", []))
                        logger.info(f"Active job {job.get('job_id')} has {len(job.get('results', []))} partial results")
            
            logger.info(f"Total file results collected: {len(all_file_results)}")
            
            return {
                "status": "operational",
                "total_jobs": total_jobs,
                "active_jobs": active_jobs,
                "completed_jobs": completed_jobs,
                "failed_jobs": failed_jobs,
                "duplicate_jobs": duplicate_jobs,
                "total_users": len(unique_users),
                "active_users": len(active_users),
                "progress_percentage": progress_percentage,
                "jobs": filtered_jobs,
                "file_results": all_file_results,
                "redis_status": "disconnected",
                "debug_info": {
                    "jobs_count": len(filtered_jobs),
                    "file_results_count": len(all_file_results),
                    "job_statuses": [job.get("status") for job in filtered_jobs]
                },
                "summary": {
                    "total_files": sum(job.get("total_files", 0) for job in filtered_jobs),
                    "successful_files": sum(job.get("successful_files", 0) for job in filtered_jobs),
                    "failed_files": sum(job.get("failed_files", 0) for job in filtered_jobs),
                    "duplicate_files": sum(job.get("duplicate_files", 0) for job in filtered_jobs),
                    "total_resumes_uploaded": total_jobs,
                    "users_uploading": len(unique_users),
                    "users_currently_active": len(active_users),
                    "processing_progress": f"{progress_percentage}%",
                    "estimated_completion": "All completed" if active_jobs == 0 else "Processing..."
                }
            }
        
        # Get all job statuses from Redis
        try:
            # Get all job keys
            job_keys = queue_service.redis_client.keys("job_status:*")
            all_jobs = []
            
            for job_key in job_keys:
                job_id = job_key.replace("job_status:", "")
                job_data = queue_service.redis_client.hgetall(job_key)
                
                if job_data:
                    # Parse result if available
                    result = None
                    if job_data.get("result"):
                        try:
                            result = json.loads(job_data["result"])
                        except json.JSONDecodeError:
                            result = {"error": "Invalid result format"}
                    
                    job_info = {
                        "job_id": job_id,
                        "status": job_data.get("status", "unknown"),
                        "created_at": job_data.get("created_at"),
                        "updated_at": job_data.get("updated_at"),
                        "filename": job_data.get("filename"),
                        "progress": job_data.get("progress", "0"),
                        "result": result,
                        "error": job_data.get("error")
                    }
                    all_jobs.append(job_info)
            
            # Count jobs by status
            active_jobs = len([j for j in all_jobs if j["status"] in ["queued", "processing"]])
            completed_jobs = len([j for j in all_jobs if j["status"] == "completed"])
            failed_jobs = len([j for j in all_jobs if j["status"] == "failed"])
            duplicate_jobs = len([j for j in all_jobs if j["status"] == "duplicate"])
            
            # Count unique users (based on IP or user_id if available)
            unique_users = set()
            active_users = set()
            
            for job in all_jobs:
                # Try to get user identifier from job data
                user_id = job.get("user_id") or job.get("ip_address") or "unknown"
                unique_users.add(user_id)
                
                if job["status"] in ["queued", "processing"]:
                    active_users.add(user_id)
            
            # Calculate processing progress
            total_processed = completed_jobs + failed_jobs
            progress_percentage = round((total_processed / len(all_jobs) * 100) if len(all_jobs) > 0 else 0, 2)
            
            return {
                "status": "operational",
                "total_jobs": len(all_jobs),
                "active_jobs": active_jobs,
                "completed_jobs": completed_jobs,
                "failed_jobs": failed_jobs,
                "duplicate_jobs": duplicate_jobs,
                "total_users": len(unique_users),
                "active_users": len(active_users),
                "progress_percentage": progress_percentage,
                "jobs": all_jobs,
                "redis_status": "connected",
                "summary": {
                    "total_resumes_uploaded": len(all_jobs),
                    "users_uploading": len(unique_users),
                    "users_currently_active": len(active_users),
                    "processing_progress": f"{progress_percentage}%",
                    "estimated_completion": "2-4 hours" if active_jobs > 0 else "All completed"
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting all job statuses: {str(e)}")
            return {
                "status": "error",
                "message": f"Failed to get job statuses: {str(e)}",
                "total_jobs": 0,
                "active_jobs": 0,
                "completed_jobs": 0,
                "failed_jobs": 0,
                "duplicate_jobs": 0,
                "jobs": []
            }
        
    except Exception as e:
        logger.error(f"Error getting bulk processing status: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to get processing status: {str(e)}",
            "total_jobs": 0,
            "active_jobs": 0,
            "completed_jobs": 0,
            "failed_jobs": 0,
            "duplicate_jobs": 0,
            "jobs": []
        }

@router.delete("/failed-resumes/{resume_id}")
async def delete_failed_resume(resume_id: str):
    """
    Delete a failed resume file by resume ID.
    
    Args:
        resume_id: Unique resume ID to delete
        
    Returns:
        Dict: Deletion confirmation
    """
    try:
        # Create failed folder path
        failed_folder = os.path.join(settings.UPLOAD_FOLDER, "failed")
        
        # Check if failed folder exists
        if not os.path.exists(failed_folder):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Failed resumes folder not found"
            )
        
        # Find file by resume ID (UUID pattern)
        found_file = None
        for filename in os.listdir(failed_folder):
            if filename.startswith(resume_id):
                found_file = filename
                break
        
        if not found_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Failed resume with ID '{resume_id}' not found"
            )
        
        file_path = os.path.join(failed_folder, found_file)
        
        # Delete the file
        os.remove(file_path)
        
        logger.info(f"Successfully deleted failed resume: {found_file} (ID: {resume_id})")
        
        return {
            "message": f"Failed resume with ID '{resume_id}' deleted successfully",
            "deleted_file": found_file,
            "resume_id": resume_id,
            "file_path": file_path
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting failed resume {resume_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete failed resume: {str(e)}"
        )

@router.get("/failed-resumes")
async def list_failed_resumes():
    """
    List all failed resume files with failure reasons.
    
    Returns:
        Dict: List of failed resume files with detailed failure information
    """
    try:
        # Create failed folder path
        failed_folder = os.path.join(settings.UPLOAD_FOLDER, "failed")
        
        # Check if failed folder exists
        if not os.path.exists(failed_folder):
            return {
                "failed_resumes": [],
                "total_count": 0,
                "message": "No failed resumes folder found"
            }
        
        # Get all files in failed folder
        failed_files = []
        for filename in os.listdir(failed_folder):
            file_path = os.path.join(failed_folder, filename)
            if os.path.isfile(file_path):
                file_size = os.path.getsize(file_path)
                file_extension = os.path.splitext(filename)[1].lower()
                
                # Extract resume ID from filename (UUID part)
                resume_id = os.path.splitext(filename)[0]  # Remove extension to get UUID
                
                # Try to read failure reason from metadata file
                failure_reason = "Unknown failure reason"
                failure_type = "unknown"
                original_filename = filename  # Default to UUID filename if no metadata
                metadata_file = os.path.join(failed_folder, f"{resume_id}.metadata.json")
                
                if os.path.exists(metadata_file):
                    try:
                        with open(metadata_file, 'r', encoding='utf-8') as f:
                            metadata = json.load(f)
                            failure_reason = metadata.get("failure_reason", "Unknown failure reason")
                            failure_type = metadata.get("failure_type", "unknown")
                            original_filename = metadata.get("original_filename", filename)
                    except Exception as e:
                        logger.warning(f"Could not read metadata for {filename}: {e}")
                
                failed_files.append({
                    "resume_id": resume_id,
                    "filename": original_filename,  # Use original filename for display
                    "uuid_filename": filename,  # Keep UUID filename for reference
                    "file_size": file_size,
                    "file_type": file_extension.lstrip('.'),
                    "created_at": os.path.getctime(file_path),
                    "file_path": file_path,
                    "failure_reason": failure_reason,
                    "failure_type": failure_type,
                    "can_reupload": True  # All failed resumes can be re-uploaded
                })
        
        # Sort by creation time (newest first)
        failed_files.sort(key=lambda x: x["created_at"], reverse=True)
        
        # Count by failure type
        failure_types = {}
        for file in failed_files:
            failure_type = file["failure_type"]
            failure_types[failure_type] = failure_types.get(failure_type, 0) + 1
        
        return {
            "failed_resumes": failed_files,
            "total_count": len(failed_files),
            "failed_folder": failed_folder,
            "failure_summary": {
                "duplicate_resumes": failure_types.get("duplicate", 0),
                "missing_fields": failure_types.get("missing_required_fields", 0),
                "parsing_errors": failure_types.get("parsing_error", 0),
                "file_errors": failure_types.get("file_error", 0),
                "unknown_errors": failure_types.get("unknown", 0)
            }
        }
        
    except Exception as e:
        logger.error(f"Error listing failed resumes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list failed resumes: {str(e)}"
        )


@router.post("/re-upload-failed-resumes")
async def re_upload_failed_resumes(request: Request):
    """
    Re-upload and re-process failed resume files using metadata (resume IDs).
    This API works with existing files in the failed folder, not new file uploads.
    
    Args:
        request: JSON body containing failed_resume_ids list
        
    Returns:
        Dict: Re-processing results with job tracking
    """
    start_time = time.time()
    
    try:
        # Parse JSON body to get failed resume IDs
        body = await request.json()
        failed_resume_ids = body.get("failed_resume_ids", [])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON body. Expected: {'failed_resume_ids': ['id1', 'id2']}"
        )
    
    # Create a bulk processing job ID
    bulk_job_id = str(uuid.uuid4())
    user_id = "reupload_user"  # Simplified for re-upload operations
    
    # Track the bulk processing job
    bulk_processing_jobs[bulk_job_id] = {
        "job_id": bulk_job_id,
        "status": "processing",
        "user_id": user_id,
        "created_at": time.time(),
        "updated_at": time.time(),
        "total_files": len(failed_resume_ids),
        "processed_files": 0,
        "successful_files": 0,
        "failed_files": 0,
        "duplicate_files": 0,
        "progress": "0"
    }
    
    logger.info(f"Re-uploading {len(failed_resume_ids)} failed resume IDs: {failed_resume_ids}")
    
    # Validate input
    if not failed_resume_ids or len(failed_resume_ids) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No failed resume IDs provided"
        )
    
    if len(failed_resume_ids) > 10000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many failed resume IDs. Maximum 10,000 failed resume IDs per request."
        )
    
    # Process failed resumes
    results = []
    successful_files = [0]
    failed_files = [0]
    duplicate_files = [0]
    batch_data_to_save = []
    all_files_to_process = []
    
    try:
        failed_folder = os.path.join(settings.UPLOAD_FOLDER, "failed")
        logger.info(f"Failed folder path: {failed_folder}")
        
        if not os.path.exists(failed_folder):
            logger.error(f"Failed folder does not exist: {failed_folder}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed resumes folder not found: {failed_folder}"
            )
        
        # Process each failed resume ID
        for resume_id in failed_resume_ids:
            # Check if job was cancelled
            if bulk_job_id in bulk_processing_jobs and bulk_processing_jobs[bulk_job_id].get("status") == "cancelled":
                logger.info(f"Job {bulk_job_id} was cancelled, stopping re-upload processing")
                break
            # Find the file by resume ID
            found_file = None
            for filename in os.listdir(failed_folder):
                if filename.startswith(resume_id) and not filename.endswith('.metadata.json'):
                    found_file = filename
                    break
            
            if found_file:
                file_path = os.path.join(failed_folder, found_file)
                file_extension = os.path.splitext(found_file)[1].lower()
                
                # Read file content
                with open(file_path, "rb") as f:
                    file_content = f.read()
                
                all_files_to_process.append({
                    "filename": found_file,
                    "content": file_content,
                    "size": len(file_content),
                    "extension": file_extension,
                    "is_from_failed": True,
                    "original_resume_id": resume_id
                })
            else:
                logger.warning(f"Failed resume ID {resume_id} not found in failed folder")
                results.append({
                    "filename": resume_id,
                    "status": "failed",
                    "error": f"Failed resume ID {resume_id} not found",
                    "file_type": "unknown",
                    "processing_time": 0
                })
                failed_files[0] += 1
        
        # Process all files
        for i, file_data in enumerate(all_files_to_process):
            # Check if job was cancelled
            if bulk_job_id in bulk_processing_jobs and bulk_processing_jobs[bulk_job_id].get("status") == "cancelled":
                logger.info(f"Job {bulk_job_id} was cancelled, stopping re-upload file processing")
                break
            try:
                # Parse the resume
                parsed_data = await parse_resume_file(file_data)
                
                if parsed_data:
                    # Check for uniqueness
                    uniqueness_check = await check_resume_uniqueness(parsed_data)
                    
                    if uniqueness_check["is_unique"]:
                        # Save to database
                        resume_id = await save_resume_to_database(parsed_data, file_data)
                        
                        # Generate embedding
                        await generate_resume_embedding(resume_id, parsed_data)
                        
                        results.append({
                            "filename": file_data["filename"],
                            "status": "success",
                            "parsed_data": parsed_data,
                            "file_type": file_data["extension"].lstrip('.'),
                            "processing_time": time.time() - start_time,
                            "embedding_status": "completed",
                            "embedding_generated": True
                        })
                        successful_files[0] += 1
                    else:
                        # Mark as duplicate
                        results.append({
                            "filename": file_data["filename"],
                            "status": "duplicate",
                            "error": uniqueness_check["error"],
                            "file_type": file_data["extension"].lstrip('.'),
                            "processing_time": time.time() - start_time
                        })
                        duplicate_files[0] += 1
                else:
                    results.append({
                        "filename": file_data["filename"],
                        "status": "failed",
                        "error": "Failed to parse resume",
                        "file_type": file_data["extension"].lstrip('.'),
                        "processing_time": time.time() - start_time
                    })
                    failed_files[0] += 1
                
                # Update job progress
                if bulk_job_id in bulk_processing_jobs:
                    progress_percentage = round(((i + 1) / len(all_files_to_process)) * 100, 2)
                    bulk_processing_jobs[bulk_job_id].update({
                        "processed_files": i + 1,
                        "successful_files": successful_files[0],
                        "failed_files": failed_files[0],
                        "duplicate_files": duplicate_files[0],
                        "progress": str(progress_percentage),
                        "updated_at": time.time(),
                        "results": results.copy()
                    })
                
            except Exception as e:
                logger.error(f"Error processing file {file_data['filename']}: {str(e)}")
                results.append({
                    "filename": file_data["filename"],
                    "status": "failed",
                    "error": str(e),
                    "file_type": file_data["extension"].lstrip('.'),
                    "processing_time": time.time() - start_time
                })
                failed_files[0] += 1
        
        # Mark job as completed
        if bulk_job_id in bulk_processing_jobs:
            bulk_processing_jobs[bulk_job_id].update({
                "status": "completed",
                "updated_at": time.time()
            })
        
        total_processing_time = time.time() - start_time
        
        return {
            "job_id": bulk_job_id,
            "total_files": len(failed_resume_ids),
            "successful_files": successful_files[0],
            "failed_files": failed_files[0],
            "duplicate_files": duplicate_files[0],
            "total_processing_time": total_processing_time,
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Error re-uploading failed resumes: {str(e)}")
        # Mark job as failed
        if bulk_job_id in bulk_processing_jobs:
            bulk_processing_jobs[bulk_job_id].update({
                "status": "failed",
                "updated_at": time.time()
            })
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to re-upload failed resumes: {str(e)}"
        )

@router.delete("/failed-resumes")
async def delete_all_failed_resumes():
    """
    Delete all failed resume files.
    
    Returns:
        Dict: Deletion confirmation
    """
    try:
        # Create failed folder path
        failed_folder = os.path.join(settings.UPLOAD_FOLDER, "failed")
        
        # Check if failed folder exists
        if not os.path.exists(failed_folder):
            return {
                "message": "No failed resumes folder found",
                "deleted_count": 0
            }
        
        # Get all files in failed folder
        deleted_count = 0
        for filename in os.listdir(failed_folder):
            file_path = os.path.join(failed_folder, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
                deleted_count += 1
        
        logger.info(f"Successfully deleted {deleted_count} failed resumes")
        
        return {
            "message": f"Successfully deleted {deleted_count} failed resume files",
            "deleted_count": deleted_count,
            "failed_folder": failed_folder
        }
        
    except Exception as e:
        logger.error(f"Error deleting all failed resumes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete all failed resumes: {str(e)}"
        )

@router.post("/generate-resume-embeddings")
async def generate_resume_embeddings():
    """
    Generate embeddings for all resumes that don't have them.
    This will process resumes in batches to avoid overwhelming the system.
    
    Returns:
        Dict: Status of embedding generation process
    """
    try:
        # Get all resumes without embeddings
        all_resumes = await database_service.get_all_resumes(limit=1000)
        resumes_without_embeddings = []
        
        for resume in all_resumes:
            # Check if resume already has embedding in separate column
            has_embedding = False
            
            # Check separate embedding column first
            if resume.get('embedding'):
                has_embedding = True
            
            # Fallback: check parsed_data for backward compatibility
            if not has_embedding:
                parsed_data = resume.get('parsed_data', {})
                
                # Handle parsed_data that might be a JSON string
                if isinstance(parsed_data, str):
                    try:
                        parsed_data = json.loads(parsed_data)
                    except (json.JSONDecodeError, TypeError):
                        continue
                
                if parsed_data and isinstance(parsed_data, dict):
                    if 'embedding' in parsed_data and parsed_data['embedding']:
                        has_embedding = True
            
            if not has_embedding:
                resumes_without_embeddings.append(resume)
        
        if not resumes_without_embeddings:
            return {
                "success": True,
                "message": "All resumes already have embeddings!",
                "total_processed": 0,
                "embeddings_generated": 0,
                "failed_resumes": []
            }
        
        # Process resumes in batches
        batch_size = 5  # Process 5 resumes at a time to avoid rate limits
        total_processed = 0
        embeddings_generated = 0
        failed_resumes = []
        
        for i in range(0, len(resumes_without_embeddings), batch_size):
            batch = resumes_without_embeddings[i:i + batch_size]
            
            for resume in batch:
                try:
                    # Generate semantic text representation
                    parsed_data = resume.get('parsed_data', {})
                    if isinstance(parsed_data, str):
                        try:
                            parsed_data = json.loads(parsed_data)
                        except:
                            continue
                    
                    if not isinstance(parsed_data, dict):
                        continue
                    
                    # Create structured text for embedding - ONLY SKILLS AND EXPERIENCE
                    skills = parsed_data.get('Skills', [])
                    experience = parsed_data.get('Experience', [])
                    total_experience = parsed_data.get('TotalExperience', '')
                    
                    # Build text representation with ONLY skills and experience
                    text_parts = []
                    
                    # Add skills with normalization
                    if skills:
                        skills_text = ", ".join(skills) if isinstance(skills, list) else str(skills)
                        # Normalize common skill variations for better matching
                        skills_text = _normalize_skills(skills_text)
                        text_parts.append(f"Skills: {skills_text}")
                    
                    # Add experience with normalization
                    if experience:
                        if isinstance(experience, list):
                            exp_text = "; ".join([str(exp) for exp in experience])
                        else:
                            exp_text = str(experience)
                        text_parts.append(f"Experience: {exp_text}")
                    
                    # Add total experience if available
                    if total_experience:
                        text_parts.append(f"TotalExperience: {total_experience}")
                    
                    # Combine all text
                    combined_text = "\n".join(text_parts)
                    
                    if not combined_text.strip():
                        logger.warning(f"Resume {resume['id']}: No meaningful text content found")
                        continue
                    
                    # Generate embedding
                    embedding = await openai_service.generate_embedding(combined_text)
                    
                    if embedding:
                        # Update resume with embedding in separate column
                        update_success = await database_service.update_resume_embedding_column(resume['id'], embedding)
                        
                        if update_success:
                            embeddings_generated += 1
                            candidate_name = resume.get('candidate_name', 'Unknown')
                            logger.info(f"Generated embedding for resume {resume['id']}: {candidate_name}")
                        else:
                            failed_resumes.append({
                                "resume_id": resume['id'],
                                "filename": resume.get('filename', 'Unknown'),
                                "error": "Failed to update database"
                            })
                            logger.error(f"Failed to update database for resume {resume['id']}")
                    else:
                        failed_resumes.append({
                            "resume_id": resume['id'],
                            "filename": resume.get('filename', 'Unknown'),
                            "error": "Failed to generate embedding"
                        })
                        logger.error(f"Failed to generate embedding for resume {resume['id']}")
                    
                    total_processed += 1
                    
                except Exception as e:
                    logger.error(f"Error processing resume {resume['id']}: {str(e)}")
                    failed_resumes.append({
                        "resume_id": resume['id'],
                        "filename": resume.get('filename', 'Unknown'),
                        "error": str(e)
                    })
                    total_processed += 1
                
                # Small delay to avoid rate limits
                import asyncio
                await asyncio.sleep(0.1)
            
            # Delay between batches
            await asyncio.sleep(1)
        
        return {
            "success": True,
            "message": f"Embedding generation completed! Processed {total_processed} resumes.",
            "total_processed": total_processed,
            "embeddings_generated": embeddings_generated,
            "failed_resumes": failed_resumes,
            "success_rate": round((embeddings_generated / total_processed * 100) if total_processed > 0 else 0, 2)
        }
        
    except Exception as e:
        logger.error(f"Error generating resume embeddings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate resume embeddings: {str(e)}"
        )

# Additional endpoints for resume management
@router.get("/resumes")
async def get_all_resumes(
    request: Request,
    company_id: int = Query(None, description="Company ID for data isolation"),
    dedupe_by: str = Query("email", description="Deduplication strategy: email | id | none")
):
    """
    Get unique resumes from database with embedding status only.
    Returns only unique resumes based on candidate email.
    Excludes full embedding data for better performance.
    
    Args:
        company_id: Company ID for data isolation (optional)
    
    Returns:
        Dict: List of unique resume records with embedding status
    """
    try:
        # Derive company_id from auth middleware when not provided
        if company_id is None:
            try:
                company_id = getattr(request.state, 'company_id', None)
            except Exception:
                company_id = None

        # Validate company_id; if still missing, return empty set gracefully
        if company_id is None:
            logger.warning("get_all_resumes called without company_id context; returning empty list")
            return {
                "resumes": [],
                "total_unique": 0,
                "message": "No company context provided"
            }

        # Ensure company_id is an int
        try:
            company_id = int(company_id)
        except Exception:
            logger.warning(f"Invalid company_id provided: {company_id}; returning empty list")
            return {
                "resumes": [],
                "total_unique": 0,
                "message": "Invalid company_id"
            }

        # Get all resumes first with company filtering
        all_resumes = await database_service.get_all_resumes(limit=1000, offset=0, company_id=company_id)  # Get more to filter unique
        
        # Debug logging
        logger.info(f"get_all_resumes returned {len(all_resumes)} resumes for company_id: {company_id}")
        if all_resumes:
            logger.info(f"Sample resume data: {all_resumes[0] if all_resumes else 'None'}")

        # Normalize dedupe_by parameter
        dedupe_by_normalized = (dedupe_by or "email").lower().strip()
        if dedupe_by_normalized not in ("email", "id", "none"):
            dedupe_by_normalized = "email"

        # Build unique set according to strategy
        unique_resumes: dict[str, dict] = {}
        dropped_without_key = 0
        for resume in all_resumes:
            if dedupe_by_normalized == "none":
                # Keep all
                key = f"row_{resume.get('id', uuid.uuid4().hex)}"
            elif dedupe_by_normalized == "id":
                key = str(resume.get('id') or "")
            else:
                # email strategy (default)
                key = (resume.get('candidate_email') or "").lower().strip()

            if not key:
                # Fallback to id if email missing
                key = str(resume.get('id') or "")
            if not key:
                # Still no key – count and skip from deduped result
                dropped_without_key += 1
                logger.warning(f"Dropping resume without key: {resume}")
                continue

            if key not in unique_resumes:
                unique_resumes[key] = resume

        # Convert to list
        unique_list = list(unique_resumes.values())
        
        # Debug logging
        logger.info(f"After deduplication: {len(unique_list)} unique resumes, dropped: {dropped_without_key}")
        
        # Format response with embedding status only
        formatted_resumes = []
        for resume in unique_list:
            # Check if embedding exists
            embedding = resume.get('embedding')
            has_embedding = False
            embedding_status = "failed"
            
            if embedding:
                if isinstance(embedding, str):
                    try:
                        import json
                        embedding = json.loads(embedding)
                    except json.JSONDecodeError:
                        embedding = None
                
                if embedding and isinstance(embedding, list) and len(embedding) > 0:
                    has_embedding = True
                    embedding_status = "completed"
            
            formatted_resumes.append({
                "id": resume.get('id'),
                "filename": resume.get('filename'),
                "candidate_name": resume.get('candidate_name', 'Unknown'),
                "candidate_email": resume.get('candidate_email', ''),
                "candidate_phone": resume.get('candidate_phone', ''),
                "total_experience": resume.get('total_experience', ''),
                "file_type": resume.get('file_type', ''),
                "file_size": resume.get('file_size', 0),
                "created_at": resume.get('created_at'),
                "embedding_status": embedding_status,
                "embedding_generated": has_embedding,
                # Exclude full embedding data for performance
                "parsed_data": resume.get('parsed_data', {})  # Keep parsed data for now
            })
        
        return {
            "resumes": formatted_resumes,
            "total": len(all_resumes),
            "total_unique": len(unique_list),
            "dropped_without_key": dropped_without_key,
            "dedupe_by": dedupe_by_normalized,
            "message": "Retrieved resumes with embedding status"
        }
    except Exception as e:
        # Return graceful empty result instead of 500 for better UX; log full details
        logger.error(f"Error getting unique resumes: {str(e)}", exc_info=True)
        return {
            "resumes": [],
            "total_unique": 0,
            "message": "Failed to get resumes",
            "error": str(e)
        }

@router.get("/resumes/{resume_id}")
async def get_resume_by_id(resume_id: int):
    """
    Get a specific resume by ID.
    
    Args:
        resume_id: Resume ID
        
    Returns:
        Dict: Resume data
    """
    try:
        resume = await database_service.get_resume_by_id(resume_id)
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found"
            )
        return resume
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting resume {resume_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get resume: {str(e)}"
        )

@router.delete("/resumes/{resume_id}")
async def delete_resume(resume_id: int):
    """
    Delete a resume by ID.
    
    Args:
        resume_id: Resume ID to delete
        
    Returns:
        Dict: Deletion confirmation
    """
    try:
        success = await database_service.delete_resume(resume_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found"
            )
        
        return {"message": f"Resume with ID {resume_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting resume {resume_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete resume: {str(e)}"
        )

@router.delete("/resumes")
async def delete_all_resumes():
    """
    Delete all resumes.
    
    Returns:
        Dict: Deletion confirmation
    """
    try:
        deleted_count = await database_service.delete_all_resumes()
        
        return {
            "message": f"Successfully deleted {deleted_count} resumes",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        logger.error(f"Error deleting all resumes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete all resumes: {str(e)}"
        )

@router.get("/resumes/{resume_id}/download")
async def download_resume(resume_id: int):
    """
    Download a resume file by ID.
    
    Args:
        resume_id: Resume ID to download
        
    Returns:
        FileResponse: Resume file
    """
    try:
        # Get resume data from database
        resume = await database_service.get_resume_by_id(resume_id)
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found"
            )
        
        # Get file path
        file_path = resume.get('file_path')
        if not file_path or not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume file not found on disk"
            )
        
        # Get filename for download
        filename = resume.get('filename', 'resume.pdf')
        
        # Return file
        from fastapi.responses import FileResponse
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='application/octet-stream'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading resume {resume_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download resume: {str(e)}"
        )


@router.post("/cancel-job/{job_id}")
async def cancel_job(job_id: str):
    """
    Cancel a specific processing job.
    
    Args:
        job_id: Job ID to cancel
        
    Returns:
        Dict: Cancellation confirmation
    """
    try:
        if job_id not in bulk_processing_jobs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        job = bulk_processing_jobs[job_id]
        
        if job.get("status") in ["completed", "failed", "cancelled"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job is already completed, failed, or cancelled"
            )
        
        # Cancel the job
        job["status"] = "cancelled"
        job["updated_at"] = time.time()
        
        logger.info(f"Cancelled job {job_id}")
        
        return {
            "message": f"Successfully cancelled job {job_id}",
            "job_id": job_id,
            "status": "cancelled"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling job {job_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel job: {str(e)}"
        )

@router.post("/re-upload-failed-resumes")
async def re_upload_failed_resumes(
    request: Request,
    failed_resume_ids: List[str] = Query(None, description="List of failed resume IDs to re-upload"),
    job_id: str = Query(None, description="Job ID for tracking"),
    company_id: int = Query(None, description="Company ID")
):
    """
    Re-upload failed resumes for enhanced processing.
    Supports both query parameters and JSON body for Node.js integration.
    """
    try:
        # Try to get data from JSON body first (Node.js integration)
        try:
            body = await request.json()
            failed_resume_ids = body.get("failed_resume_ids", failed_resume_ids)
            job_id = body.get("job_id", job_id)
            company_id = body.get("company_id", company_id)
            logger.info(f"Re-upload request received via JSON body - Job ID: {job_id}, Company ID: {company_id}, Resume IDs: {failed_resume_ids}")
        except:
            # Fallback to query parameters
            logger.info(f"Re-upload request received via query params - Job ID: {job_id}, Company ID: {company_id}, Resume IDs: {failed_resume_ids}")
        
        # Validate inputs
        if not failed_resume_ids or len(failed_resume_ids) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No failed resume IDs provided"
            )
        
        if not job_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job ID is required"
            )
        
        if not company_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company ID is required"
            )
        
        # Create job tracking entry
        job_data = {
            "job_id": job_id,
            "company_id": company_id,
            "status": "processing",
            "failed_resume_ids": failed_resume_ids,
            "created_at": time.time(),
            "updated_at": time.time(),
            "total_files": len(failed_resume_ids),
            "processed_files": 0,
            "successful_files": 0,
            "failed_files": 0,
            "results": []
        }
        
        # Store job in memory (in production, use Redis or database)
        bulk_processing_jobs[job_id] = job_data
        
        logger.info(f"Created re-upload job {job_id} with {len(failed_resume_ids)} files")
        
        # Process files in background
        asyncio.create_task(process_reupload_files(job_id, failed_resume_ids, company_id))
        
        return {
            "message": "Re-upload job created successfully",
            "job_id": job_id,
            "status": "processing",
            "total_files": len(failed_resume_ids)
        }
        
    except Exception as e:
        logger.error(f"Error creating re-upload job: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating re-upload job: {str(e)}"
        )

@router.get("/job-status/{job_id}")
async def get_job_status(job_id: str):
    """
    Get the status of a specific job (including re-upload jobs).
    """
    try:
        if job_id not in bulk_processing_jobs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        job = bulk_processing_jobs[job_id]
        
        return {
            "job_id": job_id,
            "status": job.get("status", "unknown"),
            "total_files": job.get("total_files", 0),
            "processed_files": job.get("processed_files", 0),
            "successful_files": job.get("successful_files", 0),
            "failed_files": job.get("failed_files", 0),
            "progress_percentage": job.get("progress_percentage", 0),
            "created_at": job.get("created_at", 0),
            "updated_at": job.get("updated_at", 0),
            "results": job.get("results", [])
        }
        
    except Exception as e:
        logger.error(f"Error getting job status for {job_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting job status: {str(e)}"
        )

@router.post("/cleanup-failed-resumes")
async def cleanup_failed_resumes(company_id: int = Query(..., description="Company ID for cleanup")):
    """
    Remove failed resumes that have been successfully re-parsed.
    This endpoint helps clean up duplicate records in the failed_resumes table.
    """
    try:
        logger.info(f"Starting cleanup of failed resumes for company {company_id}")
        
        # Perform cleanup
        cleanup_count = await database_service.cleanup_duplicate_failed_resumes(company_id)
        
        logger.info(f"Cleanup completed: {cleanup_count} duplicate failed resumes removed")
        
        return JSONResponse(content={
            "success": True,
            "message": f"Cleaned up {cleanup_count} duplicate failed resumes",
            "cleanup_count": cleanup_count,
            "company_id": company_id,
            "timestamp": time.time()
        })
        
    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during cleanup: {str(e)}"
        )

async def process_reupload_files(job_id: str, failed_resume_ids: List[str], company_id: int):
    """
    Process re-uploaded files in the background.
    """
    try:
        logger.info(f"Starting re-upload processing for job {job_id}")
        
        job = bulk_processing_jobs.get(job_id)
        if not job:
            logger.error(f"Job {job_id} not found in memory")
            return
        
        # Update job status
        job["status"] = "processing"
        job["updated_at"] = time.time()
        
        successful_count = 0
        failed_count = 0
        results = []
        
        # Filter out metadata files - only process actual resume files
        actual_resume_ids = [rid for rid in failed_resume_ids if not rid.endswith('.metadata')]
        logger.info(f"Processing {len(actual_resume_ids)} actual resume files (filtered out {len(failed_resume_ids) - len(actual_resume_ids)} metadata files)")
        
        for i, resume_id in enumerate(actual_resume_ids):
            try:
                logger.info(f"Processing re-upload file {i+1}/{len(actual_resume_ids)}: {resume_id}")
                
                # Try to find the failed resume in the database
                failed_resume = await database_service.get_failed_resume_by_id(resume_id, company_id)
                
                if not failed_resume:
                    logger.warning(f"Failed resume not found: {resume_id}")
                    result = {
                        "resume_id": resume_id,
                        "status": "failed",
                        "filename": f"resume_{resume_id}.pdf",
                        "error": "Failed resume not found in database"
                    }
                    results.append(result)
                    failed_count += 1
                else:
                    # Process the resume using enhanced processor
                    start_time = time.time()
                    
                    try:
                        # Import the enhanced processor
                        from app.services.enhanced_resume_processor import EnhancedResumeProcessor
                        processor = EnhancedResumeProcessor()
                        
                        # Get file content from database or file system
                        file_content = await database_service.get_failed_resume_file_content(resume_id, company_id)
                        
                        if not file_content:
                            # Try to get file path as fallback
                            file_path = failed_resume.get('file_path')
                            if file_path and os.path.exists(file_path):
                                with open(file_path, 'rb') as f:
                                    file_content = f.read()
                            else:
                                raise Exception("Could not retrieve file content")
                        
                        # Process the resume with actual file content
                        processing_result = await processor.process_resume(
                            file_content=file_content,
                            filename=failed_resume.get('filename', f"resume_{resume_id}.pdf"),
                            company_id=company_id
                        )
                        
                        processing_time = time.time() - start_time
                        
                        if processing_result.success and processing_result.parsed_data:
                            # Save the processed resume to main database
                            candidate_id = await database_service.save_processed_resume(
                                parsed_data=processing_result.parsed_data,
                                company_id=company_id,
                                user_id=1,
                                original_filename=failed_resume.get('filename', f"resume_{resume_id}.pdf")
                            )
                            
                            if candidate_id:
                                # Remove the failed resume record since it's now successfully processed
                                cleanup_success = await database_service.remove_failed_resume(resume_id, company_id)
                                
                                result = {
                                    "resume_id": resume_id,
                                    "status": "success",
                                    "filename": failed_resume.get('filename', f"resume_{resume_id}.pdf"),
                                    "processing_time": round(processing_time, 2),
                                    "parsed_data": processing_result.parsed_data,
                                    "candidate_id": candidate_id,
                                    "database_record": "created",
                                    "failed_record_cleaned": cleanup_success
                                }
                                successful_count += 1
                                logger.info(f"Successfully processed and saved re-upload file {resume_id} as candidate {candidate_id}, cleanup: {cleanup_success}")
                            else:
                                result = {
                                    "resume_id": resume_id,
                                    "status": "failed",
                                    "filename": failed_resume.get('filename', f"resume_{resume_id}.pdf"),
                                    "error": "Failed to save processed resume to database",
                                    "processing_time": round(processing_time, 2)
                                }
                                failed_count += 1
                                logger.error(f"Failed to save processed resume {resume_id} to database")
                        else:
                            error_message = str(processing_result.error) if processing_result.error else 'Unknown processing error'
                            result = {
                                "resume_id": resume_id,
                                "status": "failed",
                                "filename": failed_resume.get('filename', f"resume_{resume_id}.pdf"),
                                "error": error_message,
                                "processing_time": round(processing_time, 2)
                            }
                            failed_count += 1
                            logger.error(f"Failed to process re-upload file {resume_id}: {error_message}")
                        
                    except Exception as processing_error:
                        processing_time = time.time() - start_time
                        result = {
                            "resume_id": resume_id,
                            "status": "failed",
                            "filename": failed_resume.get('filename', f"resume_{resume_id}.pdf"),
                            "error": str(processing_error),
                            "processing_time": round(processing_time, 2)
                        }
                        failed_count += 1
                        logger.error(f"Error processing re-upload file {resume_id}: {str(processing_error)}")
                
                results.append(result)
                
                # Update job progress
                job["processed_files"] = i + 1
                job["successful_files"] = successful_count
                job["failed_files"] = failed_count
                job["progress_percentage"] = int(((i + 1) / len(actual_resume_ids)) * 100)
                job["updated_at"] = time.time()
                
            except Exception as e:
                logger.error(f"Error processing re-upload file {resume_id}: {str(e)}")
                
                result = {
                    "resume_id": resume_id,
                    "status": "failed",
                    "filename": f"resume_{resume_id}.pdf",
                    "error": str(e)
                }
                
                results.append(result)
                failed_count += 1
                
                # Update job progress
                job["processed_files"] = i + 1
                job["failed_files"] = failed_count
                job["progress_percentage"] = int(((i + 1) / len(actual_resume_ids)) * 100)
                job["updated_at"] = time.time()
        
        # Update final job status
        job["status"] = "completed" if failed_count == 0 else "completed_with_errors"
        job["results"] = results
        job["updated_at"] = time.time()
        
        logger.info(f"Completed re-upload processing for job {job_id}: {successful_count} successful, {failed_count} failed")
        
    except Exception as e:
        logger.error(f"Error in re-upload processing for job {job_id}: {str(e)}")
        
        # Update job status to failed
        if job_id in bulk_processing_jobs:
            bulk_processing_jobs[job_id]["status"] = "failed"
            bulk_processing_jobs[job_id]["error"] = str(e)
            bulk_processing_jobs[job_id]["updated_at"] = time.time()

def _validate_parsed_data(parsed_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate parsed resume data and determine quality classification.
    
    Args:
        parsed_data: Parsed resume data from AI
        
    Returns:
        Dict containing validation results, quality assessment, and warnings
    """
    if not isinstance(parsed_data, dict):
        return {
            "quality": "poor",
            "warnings": ["Invalid data format"],
            "validation_errors": ["Parsed data is not a dictionary"]
        }
    
    warnings = []
    validation_errors = []
    
    # Check for essential fields
    essential_fields = ["Name", "Email", "Phone"]
    missing_essential = []
    
    for field in essential_fields:
        value = parsed_data.get(field, "")
        if not value or not str(value).strip():
            missing_essential.append(field.lower())
    
    # Check for work experience
    experience = parsed_data.get("Experience", [])
    if not experience or not isinstance(experience, list) or len(experience) == 0:
        warnings.append("missing_experience")
    
    # Check for skills
    skills = parsed_data.get("Skills", [])
    if not skills or not isinstance(skills, list) or len(skills) == 0:
        warnings.append("missing_skills")
    
    # Check for education
    education = parsed_data.get("Education", [])
    if not education or not isinstance(education, list) or len(education) == 0:
        warnings.append("missing_education")
    
    # Determine quality level
    if len(missing_essential) >= 2:
        quality = "poor"
        validation_errors.extend([f"missing_{field}" for field in missing_essential])
    elif len(missing_essential) == 1 or len(warnings) >= 2:
        quality = "partial"
        warnings.extend([f"missing_{field}" for field in missing_essential])
    else:
        quality = "good"
    
    # Check for data completeness
    total_fields = len([k for k, v in parsed_data.items() if v and str(v).strip()])
    if total_fields < 5:
        quality = "poor"
        warnings.append("insufficient_data")
    
    return {
        "quality": quality,
        "warnings": warnings,
        "validation_errors": validation_errors,
        "completeness_score": total_fields,
        "missing_essential": missing_essential
    }
