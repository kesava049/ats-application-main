"""
Text preprocessing service for resume parsing.
Cleans and normalizes resume text before AI processing.
"""

import re
import logging
from typing import List, Dict, Tuple

logger = logging.getLogger(__name__)

class TextPreprocessor:
    """Text preprocessor for resume content."""
    
    def __init__(self):
        """Initialize the text preprocessor."""
        # Common OCR error patterns
        self.ocr_replacements = {
            # Common character substitutions
            '0': 'O',  # Zero to O
            '1': 'I',  # One to I
            '5': 'S',  # Five to S
            '8': 'B',  # Eight to B
            '6': 'G',  # Six to G
            '9': 'g',  # Nine to g
            '|': 'I',  # Pipe to I
            'l': 'I',  # Lowercase l to I
            'rn': 'm',  # rn to m
            'cl': 'd',  # cl to d
        }
        
        # Contact information patterns to normalize
        self.contact_patterns = {
            'email': [
                (r'\s+at\s+', '@'),
                (r'\s+dot\s+', '.'),
                (r'\s+@\s+', '@'),
                (r'\s+\.\s+', '.'),
            ],
            'phone': [
                (r'[^\d+]', ''),  # Remove all non-digit characters except +
                (r'^(\d{10})$', r'(\1)'),  # Format 10-digit numbers
                (r'^1(\d{10})$', r'+1 (\1)'),  # Format 11-digit numbers starting with 1
            ]
        }
        
        # Common resume section headers
        self.section_headers = [
            'experience', 'work experience', 'employment', 'career',
            'education', 'academic', 'qualifications',
            'skills', 'technical skills', 'competencies',
            'contact', 'contact information', 'personal information',
            'summary', 'objective', 'profile', 'about',
            'projects', 'achievements', 'accomplishments',
            'certifications', 'licenses', 'awards',
            'languages', 'interests', 'hobbies'
        ]
    
    def preprocess_text(self, text: str) -> str:
        """
        Preprocess resume text for better AI parsing.
        
        Args:
            text: Raw resume text
            
        Returns:
            Preprocessed text
        """
        try:
            # Step 1: Basic cleaning
            cleaned_text = self._basic_cleaning(text)
            
            # Step 2: Fix OCR errors
            cleaned_text = self._fix_ocr_errors(cleaned_text)
            
            # Step 3: Normalize contact information
            cleaned_text = self._normalize_contact_info(cleaned_text)
            
            # Step 4: Improve structure
            cleaned_text = self._improve_structure(cleaned_text)
            
            # Step 5: Final cleanup
            cleaned_text = self._final_cleanup(cleaned_text)
            
            logger.info(f"Text preprocessing completed: {len(text)} -> {len(cleaned_text)} characters")
            return cleaned_text
            
        except Exception as e:
            logger.error(f"Error preprocessing text: {str(e)}")
            return text  # Return original text if preprocessing fails
    
    def _basic_cleaning(self, text: str) -> str:
        """Basic text cleaning."""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters that might confuse AI
        text = re.sub(r'[^\w\s@.-]', ' ', text)
        
        # Remove multiple newlines
        text = re.sub(r'\n+', '\n', text)
        
        # Remove leading/trailing whitespace
        text = text.strip()
        
        return text
    
    def _fix_ocr_errors(self, text: str) -> str:
        """Fix common OCR errors."""
        # Apply OCR replacements in context
        for old, new in self.ocr_replacements.items():
            # Only replace in specific contexts to avoid false positives
            if old == '0':
                # Replace 0 with O only in words (not in numbers)
                text = re.sub(r'\b' + old + r'\b', new, text)
            elif old == '1':
                # Replace 1 with I only in words
                text = re.sub(r'\b' + old + r'\b', new, text)
            else:
                text = text.replace(old, new)
        
        return text
    
    def _normalize_contact_info(self, text: str) -> str:
        """Normalize contact information patterns."""
        # Normalize email patterns
        for pattern, replacement in self.contact_patterns['email']:
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        
        # Normalize phone patterns
        for pattern, replacement in self.contact_patterns['phone']:
            text = re.sub(pattern, replacement, text)
        
        return text
    
    def _improve_structure(self, text: str) -> str:
        """Improve text structure for better parsing."""
        lines = text.split('\n')
        improved_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Add spacing around section headers
            if self._is_section_header(line):
                if improved_lines and improved_lines[-1].strip():
                    improved_lines.append('')  # Add blank line before header
                improved_lines.append(line)
                improved_lines.append('')  # Add blank line after header
            else:
                improved_lines.append(line)
        
        return '\n'.join(improved_lines)
    
    def _is_section_header(self, line: str) -> bool:
        """Check if a line is a section header."""
        line_lower = line.lower().strip()
        
        # Check for common header patterns
        for header in self.section_headers:
            if header in line_lower:
                return True
        
        # Check for all-caps headers
        if line.isupper() and len(line) > 3:
            return True
        
        # Check for headers with colons
        if ':' in line and len(line.split(':')[0]) < 30:
            return True
        
        return False
    
    def _final_cleanup(self, text: str) -> str:
        """Final cleanup of the text."""
        # Remove excessive blank lines
        text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)
        
        # Ensure proper spacing around punctuation
        text = re.sub(r'([.!?])([A-Z])', r'\1 \2', text)
        
        # Remove trailing whitespace from lines
        lines = [line.rstrip() for line in text.split('\n')]
        text = '\n'.join(lines)
        
        return text.strip()
    
    def extract_contact_sections(self, text: str) -> Dict[str, str]:
        """Extract contact information sections from text."""
        contact_sections = {
            'header': '',
            'footer': '',
            'contact_section': ''
        }
        
        lines = text.split('\n')
        
        # Extract header (first 10 lines)
        contact_sections['header'] = '\n'.join(lines[:10])
        
        # Extract footer (last 10 lines)
        contact_sections['footer'] = '\n'.join(lines[-10:])
        
        # Extract contact section
        contact_section_lines = []
        in_contact_section = False
        
        for line in lines:
            line_lower = line.lower().strip()
            
            # Check if we're entering a contact section
            if any(keyword in line_lower for keyword in ['contact', 'personal information', 'reach me']):
                in_contact_section = True
                contact_section_lines.append(line)
                continue
            
            # Check if we're leaving a contact section
            if in_contact_section and any(keyword in line_lower for keyword in ['experience', 'education', 'skills']):
                break
            
            # Add lines to contact section
            if in_contact_section:
                contact_section_lines.append(line)
        
        contact_sections['contact_section'] = '\n'.join(contact_section_lines)
        
        return contact_sections
    
    def validate_preprocessed_text(self, text: str) -> Tuple[bool, List[str]]:
        """Validate preprocessed text quality."""
        issues = []
        
        # Check minimum length
        if len(text.strip()) < 50:
            issues.append("Text is too short (less than 50 characters)")
        
        # Check for excessive whitespace
        if re.search(r'\s{5,}', text):
            issues.append("Text contains excessive whitespace")
        
        # Check for common issues
        if 'undefined' in text.lower():
            issues.append("Text contains 'undefined' - possible parsing error")
        
        if text.count('\n') > len(text) / 10:  # Too many line breaks
            issues.append("Text has too many line breaks - possible formatting issue")
        
        return len(issues) == 0, issues
    
    def get_preprocessing_stats(self, original_text: str, preprocessed_text: str) -> Dict[str, any]:
        """Get statistics about text preprocessing."""
        return {
            'original_length': len(original_text),
            'preprocessed_length': len(preprocessed_text),
            'length_change': len(preprocessed_text) - len(original_text),
            'length_change_percent': ((len(preprocessed_text) - len(original_text)) / len(original_text)) * 100,
            'line_count_original': len(original_text.split('\n')),
            'line_count_preprocessed': len(preprocessed_text.split('\n')),
            'word_count_original': len(original_text.split()),
            'word_count_preprocessed': len(preprocessed_text.split())
        }
