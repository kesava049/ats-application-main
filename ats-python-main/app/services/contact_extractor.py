"""
Enhanced contact information extraction service.
Provides multiple extraction methods: AI, Regex, and Context analysis.
"""

import re
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ContactInfo:
    email: Optional[str] = None
    phone: Optional[str] = None
    confidence: float = 0.0
    source: str = "unknown"

class ContactExtractor:
    """Enhanced contact information extractor with multiple extraction methods."""
    
    def __init__(self):
        """Initialize the contact extractor with regex patterns."""
        self.email_patterns = [
            # Standard email patterns
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            # Email with spaces (common in resumes)
            r'\b[A-Za-z0-9._%+-]+\s+at\s+[A-Za-z0-9.-]+\s+dot\s+[A-Z|a-z]{2,}\b',
            # Email with @ symbol variations
            r'\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z|a-z]{2,}\b',
            # Email in parentheses
            r'\([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\)',
            # Email with brackets
            r'\[[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\]',
        ]
        
        self.phone_patterns = [
            # US phone number patterns
            r'\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}',
            r'\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}',
            r'[0-9]{3}[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}',
            # International patterns
            r'\+[1-9]\d{1,14}',
            # Phone with extensions
            r'\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\s*(?:ext|ext\.|extension|x)\s*[0-9]+',
            # Phone with country code
            r'\+1[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}',
        ]
        
        # Context keywords for contact information
        self.contact_keywords = {
            'email': ['email', 'e-mail', 'mail', 'contact', 'reach me at', 'reach me'],
            'phone': ['phone', 'tel', 'telephone', 'mobile', 'cell', 'call me at', 'call me']
        }
    
    def extract_contact_info(self, text: str) -> ContactInfo:
        """
        Extract contact information using multiple methods.
        
        Args:
            text: Resume text content
            
        Returns:
            ContactInfo object with extracted email and phone
        """
        # Method 1: Regex extraction
        regex_result = self._extract_with_regex(text)
        
        # Method 2: Context-based extraction
        context_result = self._extract_with_context(text)
        
        # Method 3: Combine and validate results
        final_result = self._combine_results(regex_result, context_result)
        
        return final_result
    
    def _extract_with_regex(self, text: str) -> ContactInfo:
        """Extract contact info using regex patterns."""
        email = None
        phone = None
        
        # Extract email
        for pattern in self.email_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                email = self._normalize_email(matches[0])
                break
        
        # Extract phone
        for pattern in self.phone_patterns:
            matches = re.findall(pattern, text)
            if matches:
                phone = self._normalize_phone(matches[0])
                break
        
        confidence = 0.8 if email and phone else 0.6 if email or phone else 0.0
        
        return ContactInfo(
            email=email,
            phone=phone,
            confidence=confidence,
            source="regex"
        )
    
    def _extract_with_context(self, text: str) -> ContactInfo:
        """Extract contact info using context analysis."""
        email = None
        phone = None
        
        # Split text into lines for context analysis
        lines = text.split('\n')
        
        for line in lines:
            line_lower = line.lower().strip()
            
            # Check for email context
            if any(keyword in line_lower for keyword in self.contact_keywords['email']):
                for pattern in self.email_patterns:
                    matches = re.findall(pattern, line, re.IGNORECASE)
                    if matches:
                        email = self._normalize_email(matches[0])
                        break
            
            # Check for phone context
            if any(keyword in line_lower for keyword in self.contact_keywords['phone']):
                for pattern in self.phone_patterns:
                    matches = re.findall(pattern, line)
                    if matches:
                        phone = self._normalize_phone(matches[0])
                        break
        
        confidence = 0.9 if email and phone else 0.7 if email or phone else 0.0
        
        return ContactInfo(
            email=email,
            phone=phone,
            confidence=confidence,
            source="context"
        )
    
    def _combine_results(self, regex_result: ContactInfo, context_result: ContactInfo) -> ContactInfo:
        """Combine results from different extraction methods."""
        # Prefer context results as they're more reliable
        email = context_result.email or regex_result.email
        phone = context_result.phone or regex_result.phone
        
        # Calculate combined confidence
        confidence = max(regex_result.confidence, context_result.confidence)
        if context_result.email and regex_result.email and context_result.email == regex_result.email:
            confidence = min(confidence + 0.1, 1.0)
        if context_result.phone and regex_result.phone and context_result.phone == regex_result.phone:
            confidence = min(confidence + 0.1, 1.0)
        
        source = "combined"
        if context_result.email or context_result.phone:
            source = "context"
        elif regex_result.email or regex_result.phone:
            source = "regex"
        
        return ContactInfo(
            email=email,
            phone=phone,
            confidence=confidence,
            source=source
        )
    
    def _normalize_email(self, email: str) -> str:
        """Normalize email address."""
        # Remove extra spaces and convert to lowercase
        email = email.strip().lower()
        
        # Fix common OCR errors
        email = re.sub(r'\s+at\s+', '@', email)
        email = re.sub(r'\s+dot\s+', '.', email)
        email = re.sub(r'\s+', '', email)
        
        # Remove parentheses and brackets
        email = re.sub(r'[()\[\]]', '', email)
        
        return email
    
    def _normalize_phone(self, phone: str) -> str:
        """Normalize phone number."""
        # Remove all non-digit characters except +
        phone = re.sub(r'[^\d+]', '', phone)
        
        # Handle US phone numbers
        if len(phone) == 10:
            return f"({phone[:3]}) {phone[3:6]}-{phone[6:]}"
        elif len(phone) == 11 and phone.startswith('1'):
            return f"+1 ({phone[1:4]}) {phone[4:7]}-{phone[7:]}"
        elif phone.startswith('+'):
            return phone
        
        return phone
    
    def validate_contact_info(self, email: str, phone: str) -> Tuple[bool, List[str]]:
        """Validate extracted contact information."""
        errors = []
        
        # Validate email
        if email:
            email_pattern = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
            if not re.match(email_pattern, email):
                errors.append(f"Invalid email format: {email}")
        else:
            errors.append("Email is required")
        
        # Validate phone
        if phone:
            # Remove all non-digit characters for validation
            phone_digits = re.sub(r'[^\d]', '', phone)
            if len(phone_digits) < 10:
                errors.append(f"Invalid phone format: {phone}")
        else:
            errors.append("Phone is required")
        
        return len(errors) == 0, errors
