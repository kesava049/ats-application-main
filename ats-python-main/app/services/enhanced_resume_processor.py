"""
Enhanced resume processor that integrates all new services.
Provides comprehensive resume parsing with error handling, retry, and validation.
"""

import asyncio
import logging
import time
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass

from .file_validator import FileValidator, FileValidationResult
from .text_preprocessor import TextPreprocessor
from .contact_extractor import ContactExtractor, ContactInfo
from .error_handler import (
    ErrorHandler, ResumeParsingError, ContactInfoMissingError, 
    TextExtractionError, AIParsingError, FileTypeError, FileCorruptedError
)
from .retry_processor import RetryProcessor
from .openai_service import OpenAIService
from .file_processor import FileProcessor

logger = logging.getLogger(__name__)

@dataclass
class ProcessingResult:
    """Result of resume processing."""
    success: bool
    parsed_data: Optional[Dict[str, Any]] = None
    error: Optional[ResumeParsingError] = None
    processing_time: float = 0.0
    attempts: List[Dict[str, Any]] = None
    validation_result: Optional[FileValidationResult] = None
    contact_info: Optional[ContactInfo] = None
    preprocessing_stats: Optional[Dict[str, Any]] = None

class EnhancedResumeProcessor:
    """Enhanced resume processor with comprehensive error handling and retry logic."""
    
    def __init__(self):
        """Initialize the enhanced resume processor."""
        self.file_validator = FileValidator()
        self.text_preprocessor = TextPreprocessor()
        self.contact_extractor = ContactExtractor()
        self.error_handler = ErrorHandler()
        self.retry_processor = RetryProcessor(max_retries=3)
        self.openai_service = OpenAIService()
        self.file_processor = FileProcessor()
        
        # Processing metrics
        self.metrics = {
            'total_processed': 0,
            'successful_parses': 0,
            'failed_parses': 0,
            'error_breakdown': {},
            'average_processing_time': 0.0,
            'retry_success_rate': 0.0
        }
    
    async def process_resume(
        self, 
        file_content: bytes, 
        filename: str, 
        company_id: Optional[int] = None
    ) -> ProcessingResult:
        """
        Process a resume with comprehensive error handling and retry logic.
        
        Args:
            file_content: File content as bytes
            filename: Name of the file
            company_id: Optional company ID for data isolation
            
        Returns:
            ProcessingResult with processing details
        """
        start_time = time.time()
        
        try:
            # Step 1: File validation
            validation_result = self.file_validator.validate_file(file_content, filename)
            if not validation_result.is_valid:
                error = self._create_validation_error(validation_result)
                return ProcessingResult(
                    success=False,
                    error=error,
                    processing_time=time.time() - start_time,
                    validation_result=validation_result
                )
            
            # Step 2: Process with retry mechanism
            retry_result = await self.retry_processor.process_with_retry(
                file_content, filename, self._process_resume_core, company_id
            )
            
            # Step 3: Update metrics
            self._update_metrics(retry_result['success'], time.time() - start_time)
            
            # Step 4: Create result
            if retry_result['success']:
                return ProcessingResult(
                    success=True,
                    parsed_data=retry_result['result'],
                    processing_time=time.time() - start_time,
                    attempts=retry_result['attempts'],
                    validation_result=validation_result
                )
            else:
                return ProcessingResult(
                    success=False,
                    error=retry_result['error'],
                    processing_time=time.time() - start_time,
                    attempts=retry_result['attempts'],
                    validation_result=validation_result
                )
                
        except Exception as e:
            logger.error(f"Unexpected error processing {filename}: {str(e)}")
            return ProcessingResult(
                success=False,
                error=ResumeParsingError(
                    error_type="unknown_error",
                    message=f"Unexpected error: {str(e)}",
                    details={'filename': filename, 'error': str(e)}
                ),
                processing_time=time.time() - start_time
            )
    
    async def _process_resume_core(
        self, 
        file_content: bytes, 
        filename: str, 
        company_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Core resume processing logic.
        
        Args:
            file_content: File content as bytes
            filename: Name of the file
            company_id: Optional company ID
            
        Returns:
            Parsed resume data
            
        Raises:
            ResumeParsingError: If processing fails
        """
        # Create error context
        error_context = self.error_handler.create_error_context(
            filename, len(file_content), 
            self.file_validator._detect_file_type(file_content) or 'unknown'
        )
        
        try:
            # Step 1: Text extraction
            self.error_handler.add_processing_step(error_context, "text_extraction")
            extracted_text = await self.file_processor.process_file(file_content, filename)
            
            if not extracted_text or len(extracted_text.strip()) < 10:
                raise TextExtractionError(
                    file_type=error_context.file_type,
                    reason="No meaningful text content found",
                    file_size=len(file_content)
                )
            
            # Step 2: Text preprocessing
            self.error_handler.add_processing_step(error_context, "text_preprocessing")
            preprocessed_text = self.text_preprocessor.preprocess_text(extracted_text)
            
            # Validate preprocessed text
            is_valid, issues = self.text_preprocessor.validate_preprocessed_text(preprocessed_text)
            if not is_valid:
                logger.warning(f"Text preprocessing validation failed for {filename}: {issues}")
            
            # Step 3: Contact information extraction
            self.error_handler.add_processing_step(error_context, "contact_extraction")
            contact_info = self.contact_extractor.extract_contact_info(preprocessed_text)
            
            # Step 4: AI parsing
            self.error_handler.add_processing_step(error_context, "ai_parsing")
            parsed_data = await self.openai_service.parse_resume_text(preprocessed_text)
            
            if not parsed_data:
                raise AIParsingError(
                    reason="AI returned empty response",
                    extracted_text=preprocessed_text[:500]
                )
            
            # Step 5: Validate required fields
            self.error_handler.add_processing_step(error_context, "field_validation")
            missing_fields = self._validate_required_fields(parsed_data)
            if missing_fields:
                # Try to fill missing fields with contact extraction
                if contact_info.email and not parsed_data.get('Email'):
                    parsed_data['Email'] = contact_info.email
                if contact_info.phone and not parsed_data.get('Phone'):
                    parsed_data['Phone'] = contact_info.phone
                
                # Re-validate after filling
                missing_fields = self._validate_required_fields(parsed_data)
                if missing_fields:
                    raise ContactInfoMissingError(
                        missing_fields=missing_fields,
                        extracted_data=parsed_data
                    )
            
            # Step 6: Enhance parsed data with contact info
            if contact_info.email and not parsed_data.get('Email'):
                parsed_data['Email'] = contact_info.email
            if contact_info.phone and not parsed_data.get('Phone'):
                parsed_data['Phone'] = contact_info.phone
            
            # Add processing metadata
            parsed_data['_processing_metadata'] = {
                'contact_extraction_confidence': contact_info.confidence,
                'contact_extraction_source': contact_info.source,
                'preprocessing_applied': True,
                'file_type': error_context.file_type,
                'processing_time': time.time()
            }
            
            return parsed_data
            
        except ResumeParsingError as e:
            # Handle known parsing errors
            self.error_handler.handle_error(e, error_context)
            raise
            
        except Exception as e:
            # Handle unexpected errors
            logger.error(f"Unexpected error in core processing for {filename}: {str(e)}")
            raise AIParsingError(
                reason=f"Unexpected processing error: {str(e)}",
                extracted_text=extracted_text[:500] if 'extracted_text' in locals() else None
            )
    
    def _create_validation_error(self, validation_result: FileValidationResult) -> ResumeParsingError:
        """Create appropriate error from validation result."""
        if validation_result.is_metadata:
            return ResumeParsingError(
                error_type="file_type_unsupported",
                message="This is a metadata file, not a resume",
                details={'file_type': validation_result.file_type}
            )
        elif validation_result.is_corrupted:
            return ResumeParsingError(
                error_type="file_corrupted",
                message=validation_result.error_message or "File appears to be corrupted",
                details={'file_type': validation_result.file_type}
            )
        else:
            return ResumeParsingError(
                error_type="file_type_unsupported",
                message=validation_result.error_message or "Unsupported file type",
                details={'file_type': validation_result.file_type}
            )
    
    def _validate_required_fields(self, parsed_data: Dict[str, Any]) -> List[str]:
        """Validate that required fields are present."""
        required_fields = ['Name', 'Email', 'Phone']
        missing_fields = []
        
        for field in required_fields:
            value = parsed_data.get(field, '').strip()
            if not value or value.lower() in ['unknown', 'n/a', 'none', '']:
                missing_fields.append(field)
        
        return missing_fields
    
    def _update_metrics(self, success: bool, processing_time: float):
        """Update processing metrics."""
        self.metrics['total_processed'] += 1
        
        if success:
            self.metrics['successful_parses'] += 1
        else:
            self.metrics['failed_parses'] += 1
        
        # Update average processing time
        total_time = self.metrics['average_processing_time'] * (self.metrics['total_processed'] - 1)
        self.metrics['average_processing_time'] = (total_time + processing_time) / self.metrics['total_processed']
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get processing metrics."""
        success_rate = 0.0
        if self.metrics['total_processed'] > 0:
            success_rate = self.metrics['successful_parses'] / self.metrics['total_processed']
        
        return {
            **self.metrics,
            'success_rate': success_rate,
            'error_handler_metrics': self.error_handler.get_error_metrics(),
            'retry_stats': self.retry_processor.get_retry_stats()
        }
    
    def get_error_breakdown(self) -> Dict[str, int]:
        """Get error breakdown by type."""
        return self.error_handler.get_error_breakdown()
    
    def get_recent_errors(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent errors for debugging."""
        return self.error_handler.get_recent_errors(limit)
    
    def reset_metrics(self):
        """Reset processing metrics."""
        self.metrics = {
            'total_processed': 0,
            'successful_parses': 0,
            'failed_parses': 0,
            'error_breakdown': {},
            'average_processing_time': 0.0,
            'retry_success_rate': 0.0
        }
        self.error_handler = ErrorHandler()  # Reset error handler

# Global instance
enhanced_resume_processor = EnhancedResumeProcessor()
