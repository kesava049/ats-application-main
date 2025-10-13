"""
File validation service for resume processing.
Validates file types, checks for corruption, and filters metadata files.
"""

import os
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class FileValidationResult:
    """Result of file validation."""
    is_valid: bool
    file_type: str
    is_metadata: bool
    is_corrupted: bool
    error_message: Optional[str] = None
    suggested_action: Optional[str] = None

class FileValidator:
    """File validator for resume processing."""
    
    def __init__(self):
        """Initialize the file validator."""
        self.supported_types = {
            '.pdf': self._validate_pdf,
            '.docx': self._validate_docx,
            '.doc': self._validate_doc,
            '.txt': self._validate_txt,
            '.rtf': self._validate_rtf
        }
        
        self.metadata_extensions = ['.json', '.metadata.json', '.meta']
        
        # Magic bytes for file type detection
        self.magic_bytes = {
            b'%PDF': '.pdf',
            b'PK\x03\x04': '.docx',  # ZIP-based format
            b'PK\x05\x06': '.docx',  # ZIP-based format
            b'PK\x07\x08': '.docx',  # ZIP-based format
            b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1': '.doc',  # OLE2 format
            b'{\\rtf': '.rtf',  # RTF format
        }
    
    def validate_file(self, file_content: bytes, filename: str) -> FileValidationResult:
        """
        Validate a file for resume processing.
        
        Args:
            file_content: File content as bytes
            filename: Name of the file
            
        Returns:
            FileValidationResult with validation details
        """
        try:
            # Get file extension
            file_extension = os.path.splitext(filename)[1].lower()
            
            # Check if it's a metadata file
            if self._is_metadata_file(filename):
                return FileValidationResult(
                    is_valid=False,
                    file_type=file_extension,
                    is_metadata=True,
                    is_corrupted=False,
                    error_message="This is a metadata file, not a resume",
                    suggested_action="Please upload the actual resume file (PDF or DOCX)"
                )
            
            # Check file size
            if len(file_content) == 0:
                return FileValidationResult(
                    is_valid=False,
                    file_type=file_extension,
                    is_metadata=False,
                    is_corrupted=True,
                    error_message="File is empty",
                    suggested_action="Please upload a non-empty file"
                )
            
            if len(file_content) > 50 * 1024 * 1024:  # 50MB limit
                return FileValidationResult(
                    is_valid=False,
                    file_type=file_extension,
                    is_metadata=False,
                    is_corrupted=False,
                    error_message="File is too large (max 50MB)",
                    suggested_action="Please compress the file or use a smaller version"
                )
            
            # Check if file type is supported
            if file_extension not in self.supported_types:
                return FileValidationResult(
                    is_valid=False,
                    file_type=file_extension,
                    is_metadata=False,
                    is_corrupted=False,
                    error_message=f"Unsupported file type: {file_extension}",
                    suggested_action=f"Please upload a supported file type: {', '.join(self.supported_types.keys())}"
                )
            
            # Validate file content using magic bytes
            detected_type = self._detect_file_type(file_content)
            if detected_type and detected_type != file_extension:
                logger.warning(f"File extension {file_extension} doesn't match content type {detected_type}")
            
            # Run specific validation for the file type
            validation_func = self.supported_types[file_extension]
            is_corrupted, error_msg = validation_func(file_content)
            
            if is_corrupted:
                return FileValidationResult(
                    is_valid=False,
                    file_type=file_extension,
                    is_metadata=False,
                    is_corrupted=True,
                    error_message=error_msg,
                    suggested_action="Please try uploading the file again or use a different file"
                )
            
            return FileValidationResult(
                is_valid=True,
                file_type=file_extension,
                is_metadata=False,
                is_corrupted=False
            )
            
        except Exception as e:
            logger.error(f"Error validating file {filename}: {str(e)}")
            return FileValidationResult(
                is_valid=False,
                file_type=os.path.splitext(filename)[1].lower(),
                is_metadata=False,
                is_corrupted=True,
                error_message=f"Validation error: {str(e)}",
                suggested_action="Please try uploading the file again"
            )
    
    def _is_metadata_file(self, filename: str) -> bool:
        """Check if file is a metadata file."""
        file_extension = os.path.splitext(filename)[1].lower()
        return file_extension in self.metadata_extensions or 'metadata' in filename.lower()
    
    def _detect_file_type(self, file_content: bytes) -> Optional[str]:
        """Detect file type using magic bytes."""
        for magic_bytes, file_type in self.magic_bytes.items():
            if file_content.startswith(magic_bytes):
                return file_type
        return None
    
    def _validate_pdf(self, file_content: bytes) -> Tuple[bool, Optional[str]]:
        """Validate PDF file."""
        try:
            # Check PDF header
            if not file_content.startswith(b'%PDF'):
                return True, "Invalid PDF header"
            
            # Check for PDF structure
            if b'%%EOF' not in file_content:
                return True, "PDF file appears to be incomplete"
            
            # Check for common PDF corruption indicators
            if b'\x00\x00\x00\x00' in file_content[:1000]:  # Too many null bytes
                return True, "PDF file appears to be corrupted"
            
            return False, None
            
        except Exception as e:
            return True, f"PDF validation error: {str(e)}"
    
    def _validate_docx(self, file_content: bytes) -> Tuple[bool, Optional[str]]:
        """Validate DOCX file."""
        try:
            # Check ZIP header (DOCX is ZIP-based)
            if not (file_content.startswith(b'PK\x03\x04') or 
                   file_content.startswith(b'PK\x05\x06') or 
                   file_content.startswith(b'PK\x07\x08')):
                return True, "Invalid DOCX file format"
            
            # Check for ZIP structure
            if b'[Content_Types].xml' not in file_content:
                return True, "DOCX file appears to be corrupted or incomplete"
            
            return False, None
            
        except Exception as e:
            return True, f"DOCX validation error: {str(e)}"
    
    def _validate_doc(self, file_content: bytes) -> Tuple[bool, Optional[str]]:
        """Validate DOC file."""
        try:
            # Check OLE2 header
            if not file_content.startswith(b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'):
                return True, "Invalid DOC file format"
            
            # Check for minimum file size
            if len(file_content) < 512:  # Minimum OLE2 file size
                return True, "DOC file appears to be too small or corrupted"
            
            return False, None
            
        except Exception as e:
            return True, f"DOC validation error: {str(e)}"
    
    def _validate_txt(self, file_content: bytes) -> Tuple[bool, Optional[str]]:
        """Validate TXT file."""
        try:
            # Try to decode as UTF-8
            try:
                file_content.decode('utf-8')
            except UnicodeDecodeError:
                # Try other encodings
                try:
                    file_content.decode('latin-1')
                except UnicodeDecodeError:
                    return True, "Text file contains invalid characters"
            
            # Check for minimum content
            if len(file_content.strip()) < 10:
                return True, "Text file appears to be empty or too short"
            
            return False, None
            
        except Exception as e:
            return True, f"TXT validation error: {str(e)}"
    
    def _validate_rtf(self, file_content: bytes) -> Tuple[bool, Optional[str]]:
        """Validate RTF file."""
        try:
            # Check RTF header
            if not file_content.startswith(b'{\\rtf'):
                return True, "Invalid RTF file format"
            
            # Check for RTF structure
            if b'}' not in file_content:
                return True, "RTF file appears to be incomplete"
            
            return False, None
            
        except Exception as e:
            return True, f"RTF validation error: {str(e)}"
    
    def get_supported_types(self) -> List[str]:
        """Get list of supported file types."""
        return list(self.supported_types.keys())
    
    def get_file_type_info(self, file_extension: str) -> Dict[str, str]:
        """Get information about a file type."""
        type_info = {
            '.pdf': {
                'name': 'PDF Document',
                'description': 'Portable Document Format - recommended for resumes',
                'max_size': '50MB'
            },
            '.docx': {
                'name': 'Word Document (DOCX)',
                'description': 'Microsoft Word document - good for resumes',
                'max_size': '50MB'
            },
            '.doc': {
                'name': 'Word Document (DOC)',
                'description': 'Legacy Microsoft Word document',
                'max_size': '50MB'
            },
            '.txt': {
                'name': 'Text File',
                'description': 'Plain text file - basic formatting only',
                'max_size': '10MB'
            },
            '.rtf': {
                'name': 'Rich Text Format',
                'description': 'Rich text format with basic formatting',
                'max_size': '10MB'
            }
        }
        
        return type_info.get(file_extension.lower(), {
            'name': 'Unknown',
            'description': 'Unsupported file type',
            'max_size': 'N/A'
        })
