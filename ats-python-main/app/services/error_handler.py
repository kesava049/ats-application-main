"""
Enhanced error handling system for resume parsing.
Provides specific error categories and detailed error logging.
"""

import logging
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)

class ErrorType(Enum):
    """Enumeration of error types for resume parsing."""
    MISSING_REQUIRED_FIELDS = "missing_required_fields"
    TEXT_EXTRACTION_FAILED = "text_extraction_failed"
    AI_PARSING_FAILED = "ai_parsing_failed"
    FILE_TYPE_UNSUPPORTED = "file_type_unsupported"
    FILE_CORRUPTED = "file_corrupted"
    CONTACT_EXTRACTION_FAILED = "contact_extraction_failed"
    UNKNOWN_ERROR = "unknown_error"

@dataclass
class ErrorContext:
    """Context information for error tracking."""
    filename: str
    file_size: int
    file_type: str
    timestamp: str
    processing_steps: List[str]
    error_details: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)

class ResumeParsingError(Exception):
    """Base exception for resume parsing errors."""
    
    def __init__(self, error_type: ErrorType, message: str, details: Dict[str, Any] = None):
        self.error_type = error_type
        self.message = message
        self.details = details or {}
        super().__init__(self.message)

class ContactInfoMissingError(ResumeParsingError):
    """Exception for missing contact information."""
    
    def __init__(self, missing_fields: List[str], extracted_data: Dict[str, Any] = None):
        super().__init__(
            error_type=ErrorType.MISSING_REQUIRED_FIELDS,
            message=f"Missing required fields: {', '.join(missing_fields)}",
            details={
                "missing_fields": missing_fields,
                "extracted_data": extracted_data or {}
            }
        )

class TextExtractionError(ResumeParsingError):
    """Exception for text extraction failures."""
    
    def __init__(self, file_type: str, reason: str, file_size: int = 0):
        super().__init__(
            error_type=ErrorType.TEXT_EXTRACTION_FAILED,
            message=f"Failed to extract text from {file_type}: {reason}",
            details={
                "file_type": file_type,
                "reason": reason,
                "file_size": file_size
            }
        )

class AIParsingError(ResumeParsingError):
    """Exception for AI parsing failures."""
    
    def __init__(self, reason: str, response: str = None, extracted_text: str = None):
        super().__init__(
            error_type=ErrorType.AI_PARSING_FAILED,
            message=f"AI parsing failed: {reason}",
            details={
                "reason": reason,
                "response": response,
                "extracted_text": extracted_text[:500] if extracted_text else None  # Truncate for logging
            }
        )

class FileTypeError(ResumeParsingError):
    """Exception for unsupported file types."""
    
    def __init__(self, file_type: str, supported_types: List[str] = None):
        super().__init__(
            error_type=ErrorType.FILE_TYPE_UNSUPPORTED,
            message=f"Unsupported file type: {file_type}",
            details={
                "file_type": file_type,
                "supported_types": supported_types or ["pdf", "docx", "doc", "txt"]
            }
        )

class FileCorruptedError(ResumeParsingError):
    """Exception for corrupted files."""
    
    def __init__(self, file_type: str, reason: str):
        super().__init__(
            error_type=ErrorType.FILE_CORRUPTED,
            message=f"File appears to be corrupted: {reason}",
            details={
                "file_type": file_type,
                "reason": reason
            }
        )

class ContactExtractionError(ResumeParsingError):
    """Exception for contact extraction failures."""
    
    def __init__(self, reason: str, extracted_text: str = None):
        super().__init__(
            error_type=ErrorType.CONTACT_EXTRACTION_FAILED,
            message=f"Contact extraction failed: {reason}",
            details={
                "reason": reason,
                "extracted_text": extracted_text[:200] if extracted_text else None
            }
        )

class ErrorHandler:
    """Enhanced error handler for resume parsing."""
    
    def __init__(self):
        """Initialize the error handler."""
        self.error_metrics = {
            "total_errors": 0,
            "error_breakdown": {},
            "recent_errors": []
        }
    
    def create_error_context(self, filename: str, file_size: int, file_type: str) -> ErrorContext:
        """Create error context for tracking."""
        return ErrorContext(
            filename=filename,
            file_size=file_size,
            file_type=file_type,
            timestamp=datetime.now().isoformat(),
            processing_steps=[],
            error_details={}
        )
    
    def add_processing_step(self, context: ErrorContext, step: str, details: Dict[str, Any] = None):
        """Add a processing step to the error context."""
        context.processing_steps.append(step)
        if details:
            context.error_details[step] = details
    
    def handle_error(self, error: ResumeParsingError, context: ErrorContext) -> Dict[str, Any]:
        """Handle and log an error with full context."""
        # Update metrics
        self.error_metrics["total_errors"] += 1
        error_type = error.error_type.value
        self.error_metrics["error_breakdown"][error_type] = self.error_metrics["error_breakdown"].get(error_type, 0) + 1
        
        # Add to recent errors (keep last 100)
        self.error_metrics["recent_errors"].append({
            "timestamp": context.timestamp,
            "filename": context.filename,
            "error_type": error_type,
            "message": error.message
        })
        if len(self.error_metrics["recent_errors"]) > 100:
            self.error_metrics["recent_errors"].pop(0)
        
        # Log detailed error information
        logger.error(f"Resume parsing error: {error_type}")
        logger.error(f"Message: {error.message}")
        logger.error(f"Filename: {context.filename}")
        logger.error(f"File type: {context.file_type}")
        logger.error(f"File size: {context.file_size}")
        logger.error(f"Processing steps: {context.processing_steps}")
        logger.error(f"Error details: {error.details}")
        logger.error(f"Context details: {context.error_details}")
        
        # Return error information for API response
        return {
            "error_type": error_type,
            "message": error.message,
            "details": error.details,
            "context": context.to_dict(),
            "user_friendly_message": self.get_user_friendly_message(error_type, error.details)
        }
    
    def get_user_friendly_message(self, error_type: str, details: Dict[str, Any]) -> str:
        """Convert technical errors to user-friendly messages."""
        error_messages = {
            ErrorType.MISSING_REQUIRED_FIELDS.value: self._get_missing_fields_message(details),
            ErrorType.TEXT_EXTRACTION_FAILED.value: "Could not read the file content. Please try uploading a different file format (PDF or DOCX) or ensure the file is not corrupted.",
            ErrorType.AI_PARSING_FAILED.value: "The resume content could not be processed by our AI system. Please check if the file is readable and try again.",
            ErrorType.FILE_TYPE_UNSUPPORTED.value: f"This file type is not supported. Please upload a PDF or DOCX file. Supported formats: {', '.join(details.get('supported_types', []))}",
            ErrorType.FILE_CORRUPTED.value: "The file appears to be corrupted or damaged. Please try uploading the file again or use a different file.",
            ErrorType.CONTACT_EXTRACTION_FAILED.value: "Could not find contact information in the resume. Please ensure your resume contains a clear email address and phone number.",
            ErrorType.UNKNOWN_ERROR.value: "An unexpected error occurred while processing your resume. Please try again or contact support if the problem persists."
        }
        
        return error_messages.get(error_type, "An unexpected error occurred. Please try again.")
    
    def _get_missing_fields_message(self, details: Dict[str, Any]) -> str:
        """Generate specific message for missing fields."""
        missing_fields = details.get("missing_fields", [])
        if not missing_fields:
            return "Could not find required contact information in the resume."
        
        field_names = {
            "Email": "email address",
            "Phone": "phone number",
            "Name": "name",
            "Skills": "skills"
        }
        
        friendly_fields = [field_names.get(field, field.lower()) for field in missing_fields]
        
        if len(friendly_fields) == 1:
            return f"Could not find {friendly_fields[0]} in the resume. Please ensure your resume contains this information clearly."
        else:
            return f"Could not find {', '.join(friendly_fields[:-1])} and {friendly_fields[-1]} in the resume. Please ensure your resume contains this information clearly."
    
    def get_error_metrics(self) -> Dict[str, Any]:
        """Get error metrics for monitoring."""
        return self.error_metrics.copy()
    
    def get_error_breakdown(self) -> Dict[str, int]:
        """Get error breakdown by type."""
        return self.error_metrics["error_breakdown"].copy()
    
    def get_recent_errors(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent errors for debugging."""
        return self.error_metrics["recent_errors"][-limit:]

# Global error handler instance
error_handler = ErrorHandler()
