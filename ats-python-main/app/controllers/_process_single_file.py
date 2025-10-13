# Helper function for processing single file
import time
import logging

logger = logging.getLogger(__name__)

async def _process_single_file(file, file_content, file_size, file_extension, file_result, batch_data_to_save, results, company_id):
    """
    Process a single file and extract resume data.
    
    Args:
        file: UploadFile object
        file_content: File content as bytes
        file_size: Size of the file
        file_extension: File extension
        file_result: Result dictionary to update
        batch_data_to_save: List to store batch data
        results: List to store results
        successful_files: Counter for successful files
        failed_files: Counter for failed files
        company_id: Company ID for data isolation
    """
    from app.services.file_processor import FileProcessor
    from app.services.openai_service import openai_service
    from app.services.database_service import database_service
    
    file_start_time = time.time()
    
    try:
        logger.info(f"🔍 Processing file: {file.filename}")
        logger.info(f"🔍 File size: {file_size} bytes")
        logger.info(f"🔍 File extension: {file_extension}")
        logger.info(f"🔍 Company ID: {company_id}")
        
        # Initialize file processor
        file_processor = FileProcessor()
        
        # Extract text from file
        extracted_text = await file_processor.process_file(file_content, file.filename)
        
        if not extracted_text or len(extracted_text.strip()) < 10:
            error_msg = "No meaningful text content found in file"
            logger.error(f"❌ {error_msg}: {file.filename}")
            file_result.update({
                "status": "failed",
                "error": error_msg,
                "file_type": file_extension.lstrip('.'),
                "processing_time": time.time() - file_start_time
            })
            return
        
        logger.info(f"✅ Extracted {len(extracted_text)} characters from {file.filename}")
        
        # Parse resume using OpenAI
        parsed_data = await openai_service.parse_resume_text(extracted_text)
        
        if not parsed_data:
            error_msg = "Failed to parse resume with AI"
            logger.error(f"❌ {error_msg}: {file.filename}")
            file_result.update({
                "status": "failed",
                "error": error_msg,
                "file_type": file_extension.lstrip('.'),
                "processing_time": time.time() - file_start_time
            })
            return
        
        logger.info(f"✅ Successfully parsed resume: {file.filename}")
        
        # Generate embedding
        combined_text = f"{parsed_data.get('name', '')} {parsed_data.get('email', '')} {parsed_data.get('phone', '')} {extracted_text}"
        embedding = await openai_service.generate_embedding(combined_text)
        
        # Calculate processing time
        processing_time = time.time() - file_start_time
        
        # Get current timestamp for database
        from datetime import datetime
        current_time = datetime.now()
        
        # Prepare data for database (matching save_batch_resume_data expectations)
        resume_data = {
            "filename": file.filename,
            "file_path": f"uploads/{file.filename}",  # Add file path
            "file_type": file_extension.lstrip('.'),
            "file_size": file_size,
            "processing_time": processing_time,
            "parsed_data": parsed_data,  # This is the key field that save_batch_resume_data expects
            "embedding": embedding
        }
        
        # Add to batch data
        batch_data_to_save.append(resume_data)
        print(f"🔍 Debug - Added to batch_data_to_save: {len(batch_data_to_save)} items")
        print(f"🔍 Debug - Resume data keys: {list(resume_data.keys())}")
        
        # Update result
        file_result.update({
            "status": "success",
            "filename": file.filename,
            "file_type": file_extension.lstrip('.'),
            "file_size": file_size,
            "parsed_data": parsed_data,
            "processing_time": time.time() - file_start_time
        })
        
        logger.info(f"✅ Successfully processed: {file.filename}")
        
    except Exception as e:
        error_msg = f"Error processing file: {str(e)}"
        logger.error(f"❌ {error_msg}: {file.filename}")
        file_result.update({
            "status": "failed",
            "error": error_msg,
            "file_type": file_extension.lstrip('.'),
            "processing_time": time.time() - file_start_time
        })
