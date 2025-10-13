"""
Retry mechanism service for resume processing.
Implements intelligent retry with different strategies.
"""

import asyncio
import logging
import time
from typing import Dict, List, Optional, Any, Callable, Tuple
from dataclasses import dataclass
from enum import Enum

from .contact_extractor import ContactExtractor
from .text_preprocessor import TextPreprocessor
from .error_handler import ResumeParsingError, ContactInfoMissingError, AIParsingError

logger = logging.getLogger(__name__)

class RetryStrategy(Enum):
    """Enumeration of retry strategies."""
    STANDARD = "standard"
    ENHANCED_PREPROCESSING = "enhanced_preprocessing"
    FALLBACK_EXTRACTION = "fallback_extraction"
    MANUAL_EXTRACTION = "manual_extraction"

@dataclass
class RetryAttempt:
    """Information about a retry attempt."""
    attempt_number: int
    strategy: RetryStrategy
    success: bool
    error: Optional[ResumeParsingError] = None
    processing_time: float = 0.0
    details: Dict[str, Any] = None

class RetryProcessor:
    """Intelligent retry processor for resume parsing."""
    
    def __init__(self, max_retries: int = 3, base_delay: float = 1.0):
        """
        Initialize the retry processor.
        
        Args:
            max_retries: Maximum number of retry attempts
            base_delay: Base delay between retries in seconds
        """
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.contact_extractor = ContactExtractor()
        self.text_preprocessor = TextPreprocessor()
        
        # Retry strategies for different error types
        self.strategy_map = {
            ContactInfoMissingError: [
                RetryStrategy.ENHANCED_PREPROCESSING,
                RetryStrategy.FALLBACK_EXTRACTION,
                RetryStrategy.MANUAL_EXTRACTION
            ],
            AIParsingError: [
                RetryStrategy.ENHANCED_PREPROCESSING,
                RetryStrategy.FALLBACK_EXTRACTION,
                RetryStrategy.STANDARD
            ]
        }
    
    async def process_with_retry(
        self,
        file_content: bytes,
        filename: str,
        processing_func: Callable,
        *args,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Process resume with intelligent retry mechanism.
        
        Args:
            file_content: File content as bytes
            filename: Name of the file
            processing_func: Function to call for processing
            *args: Additional arguments for processing function
            **kwargs: Additional keyword arguments for processing function
            
        Returns:
            Dictionary with processing result and retry information
        """
        attempts = []
        last_error = None
        
        for attempt_num in range(self.max_retries + 1):  # +1 for initial attempt
            start_time = time.time()
            
            try:
                # Determine strategy for this attempt
                strategy = self._get_strategy_for_attempt(attempt_num, last_error)
                
                # Process with the determined strategy
                result = await self._process_with_strategy(
                    file_content, filename, processing_func, strategy, *args, **kwargs
                )
                
                # Record successful attempt
                attempt = RetryAttempt(
                    attempt_number=attempt_num + 1,
                    strategy=strategy,
                    success=True,
                    processing_time=time.time() - start_time
                )
                attempts.append(attempt)
                
                logger.info(f"Successfully processed {filename} on attempt {attempt_num + 1} using {strategy.value} strategy")
                
                return {
                    'success': True,
                    'result': result,
                    'attempts': [attempt.__dict__ for attempt in attempts],
                    'total_attempts': len(attempts),
                    'total_time': sum(attempt.processing_time for attempt in attempts)
                }
                
            except ResumeParsingError as e:
                last_error = e
                processing_time = time.time() - start_time
                
                # Record failed attempt
                attempt = RetryAttempt(
                    attempt_number=attempt_num + 1,
                    strategy=strategy if 'strategy' in locals() else RetryStrategy.STANDARD,
                    success=False,
                    error=e,
                    processing_time=processing_time,
                    details={'error_type': type(e).__name__, 'error_message': str(e)}
                )
                attempts.append(attempt)
                
                logger.warning(f"Attempt {attempt_num + 1} failed for {filename}: {str(e)}")
                
                # If this was the last attempt, return failure
                if attempt_num >= self.max_retries:
                    logger.error(f"All retry attempts failed for {filename}")
                    return {
                        'success': False,
                        'error': e,
                        'attempts': [attempt.__dict__ for attempt in attempts],
                        'total_attempts': len(attempts),
                        'total_time': sum(attempt.processing_time for attempt in attempts)
                    }
                
                # Wait before next attempt
                await asyncio.sleep(self._calculate_delay(attempt_num))
                
            except Exception as e:
                # Unexpected error - don't retry
                logger.error(f"Unexpected error processing {filename}: {str(e)}")
                return {
                    'success': False,
                    'error': e,
                    'attempts': [attempt.__dict__ for attempt in attempts],
                    'total_attempts': len(attempts),
                    'total_time': sum(attempt.processing_time for attempt in attempts)
                }
    
    def _get_strategy_for_attempt(self, attempt_num: int, last_error: Optional[ResumeParsingError]) -> RetryStrategy:
        """Get the strategy for a specific attempt."""
        if attempt_num == 0:
            return RetryStrategy.STANDARD
        
        if last_error and type(last_error) in self.strategy_map:
            strategies = self.strategy_map[type(last_error)]
            if attempt_num - 1 < len(strategies):
                return strategies[attempt_num - 1]
        
        # Default fallback strategies
        fallback_strategies = [
            RetryStrategy.ENHANCED_PREPROCESSING,
            RetryStrategy.FALLBACK_EXTRACTION,
            RetryStrategy.MANUAL_EXTRACTION
        ]
        
        if attempt_num - 1 < len(fallback_strategies):
            return fallback_strategies[attempt_num - 1]
        
        return RetryStrategy.STANDARD
    
    async def _process_with_strategy(
        self,
        file_content: bytes,
        filename: str,
        processing_func: Callable,
        strategy: RetryStrategy,
        *args,
        **kwargs
    ) -> Any:
        """Process file with a specific strategy."""
        if strategy == RetryStrategy.STANDARD:
            return await processing_func(file_content, filename, *args, **kwargs)
        
        elif strategy == RetryStrategy.ENHANCED_PREPROCESSING:
            return await self._process_with_enhanced_preprocessing(
                file_content, filename, processing_func, *args, **kwargs
            )
        
        elif strategy == RetryStrategy.FALLBACK_EXTRACTION:
            return await self._process_with_fallback_extraction(
                file_content, filename, processing_func, *args, **kwargs
            )
        
        elif strategy == RetryStrategy.MANUAL_EXTRACTION:
            return await self._process_with_manual_extraction(
                file_content, filename, processing_func, *args, **kwargs
            )
        
        else:
            return await processing_func(file_content, filename, *args, **kwargs)
    
    async def _process_with_enhanced_preprocessing(
        self,
        file_content: bytes,
        filename: str,
        processing_func: Callable,
        *args,
        **kwargs
    ) -> Any:
        """Process with enhanced text preprocessing."""
        logger.info(f"Using enhanced preprocessing strategy for {filename}")
        
        # Extract text first
        from .file_processor import FileProcessor
        file_processor = FileProcessor()
        extracted_text = await file_processor.process_file(file_content, filename)
        
        # Apply enhanced preprocessing
        preprocessed_text = self.text_preprocessor.preprocess_text(extracted_text)
        
        # Validate preprocessed text
        is_valid, issues = self.text_preprocessor.validate_preprocessed_text(preprocessed_text)
        if not is_valid:
            logger.warning(f"Preprocessed text validation failed for {filename}: {issues}")
        
        # Create a modified file content with preprocessed text
        preprocessed_content = preprocessed_text.encode('utf-8')
        
        # Call processing function with preprocessed content
        return await processing_func(preprocessed_content, filename, *args, **kwargs)
    
    async def _process_with_fallback_extraction(
        self,
        file_content: bytes,
        filename: str,
        processing_func: Callable,
        *args,
        **kwargs
    ) -> Any:
        """Process with fallback contact extraction."""
        logger.info(f"Using fallback extraction strategy for {filename}")
        
        # Extract text first
        from .file_processor import FileProcessor
        file_processor = FileProcessor()
        extracted_text = await file_processor.process_file(file_content, filename)
        
        # Try to extract contact info using fallback methods
        contact_info = self.contact_extractor.extract_contact_info(extracted_text)
        
        if contact_info.email and contact_info.phone:
            logger.info(f"Fallback extraction found contact info for {filename}")
            # Create a modified text with contact info highlighted
            enhanced_text = self._enhance_text_with_contact_info(extracted_text, contact_info)
            enhanced_content = enhanced_text.encode('utf-8')
            return await processing_func(enhanced_content, filename, *args, **kwargs)
        else:
            # Fallback extraction didn't work, try standard processing
            return await processing_func(file_content, filename, *args, **kwargs)
    
    async def _process_with_manual_extraction(
        self,
        file_content: bytes,
        filename: str,
        processing_func: Callable,
        *args,
        **kwargs
    ) -> Any:
        """Process with manual extraction methods."""
        logger.info(f"Using manual extraction strategy for {filename}")
        
        # Extract text first
        from .file_processor import FileProcessor
        file_processor = FileProcessor()
        extracted_text = await file_processor.process_file(file_content, filename)
        
        # Extract contact sections
        contact_sections = self.text_preprocessor.extract_contact_sections(extracted_text)
        
        # Try to extract contact info from each section
        best_contact_info = None
        best_confidence = 0.0
        
        for section_name, section_text in contact_sections.items():
            if section_text.strip():
                contact_info = self.contact_extractor.extract_contact_info(section_text)
                if contact_info.confidence > best_confidence:
                    best_contact_info = contact_info
                    best_confidence = contact_info.confidence
        
        if best_contact_info and best_contact_info.confidence > 0.5:
            logger.info(f"Manual extraction found contact info for {filename} with confidence {best_contact_info.confidence}")
            # Create enhanced text
            enhanced_text = self._enhance_text_with_contact_info(extracted_text, best_contact_info)
            enhanced_content = enhanced_text.encode('utf-8')
            return await processing_func(enhanced_content, filename, *args, **kwargs)
        else:
            # Manual extraction didn't work, try standard processing
            return await processing_func(file_content, filename, *args, **kwargs)
    
    def _enhance_text_with_contact_info(self, text: str, contact_info) -> str:
        """Enhance text with extracted contact information."""
        enhanced_lines = []
        
        # Add contact information at the top if found
        if contact_info.email or contact_info.phone:
            contact_section = "CONTACT INFORMATION:\n"
            if contact_info.email:
                contact_section += f"Email: {contact_info.email}\n"
            if contact_info.phone:
                contact_section += f"Phone: {contact_info.phone}\n"
            contact_section += "\n"
            enhanced_lines.append(contact_section)
        
        # Add original text
        enhanced_lines.append(text)
        
        return '\n'.join(enhanced_lines)
    
    def _calculate_delay(self, attempt_num: int) -> float:
        """Calculate delay before next attempt."""
        # Exponential backoff with jitter
        delay = self.base_delay * (2 ** attempt_num)
        jitter = delay * 0.1 * (0.5 - 0.5)  # Random jitter between -10% and +10%
        return min(delay + jitter, 30.0)  # Cap at 30 seconds
    
    def get_retry_stats(self) -> Dict[str, Any]:
        """Get retry statistics."""
        return {
            'max_retries': self.max_retries,
            'base_delay': self.base_delay,
            'strategy_count': len(RetryStrategy),
            'supported_strategies': [strategy.value for strategy in RetryStrategy]
        }
