"""
Configuration settings for the Resume Parser application.
Simplified version with only essential settings.
"""

import os
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    """Application settings and configuration management."""
    
    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # JWT Configuration (SAME as Node.js backend)
    JWT_SECRET: str = os.getenv("JWT_SECRET", "ats-super-secure-jwt-secret-2024-production-ready")
    
    # Node.js Backend Configuration
    NODE_API_URL: str = os.getenv("NODE_API_URL", "http://localhost:5000/api")
    
    # OpenAI API Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    OPENAI_MAX_TOKENS: int = int(os.getenv("OPENAI_MAX_TOKENS", "2000"))
    OPENAI_TEMPERATURE: float = float(os.getenv("OPENAI_TEMPERATURE", "0.1"))
    # Input size management for OpenAI
    MAX_INPUT_CHARS: int = int(os.getenv("MAX_INPUT_CHARS", "40000"))
    CHARS_PER_TOKEN_ESTIMATE: int = int(os.getenv("CHARS_PER_TOKEN_ESTIMATE", "4"))
    
    # File Processing Configuration
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB default
    MAX_BATCH_SIZE: int = int(os.getenv("MAX_BATCH_SIZE", "1"))  # its only for candaite job applications Maximum files per batch (single resume only)
    MAX_TOTAL_BATCH_SIZE: int = int(os.getenv("MAX_TOTAL_BATCH_SIZE", "104857600"))  # 100MB total batch size (increased from 50MB)
    ALLOWED_EXTENSIONS: List[str] = [
        ".pdf", ".docx", ".doc", ".txt", ".rtf",
        ".png", ".jpg", ".jpeg", ".webp"
    ]
    # DOC processing feature flags
    DOC_ENABLE_ANTIWORD: bool = os.getenv("DOC_ENABLE_ANTIWORD", "True").lower() == "true"
    DOC_ENABLE_OCR: bool = os.getenv("DOC_ENABLE_OCR", "True").lower() == "true"
    
    # OCR Configuration
    MIN_TEXT_LENGTH_FOR_OCR: int = int(os.getenv("MIN_TEXT_LENGTH_FOR_OCR", "100"))
    OCR_ENABLED: bool = os.getenv("OCR_ENABLED", "True").lower() == "true"
    OCR_CONFIDENCE_THRESHOLD: float = float(os.getenv("OCR_CONFIDENCE_THRESHOLD", "0.5"))
    OCR_MAX_PAGES: int = int(os.getenv("OCR_MAX_PAGES", "3"))
    OCR_IMAGE_ZOOM: float = float(os.getenv("OCR_IMAGE_ZOOM", "1.5"))
    
    # Performance Optimization Settings
    PARALLEL_PROCESSING: bool = os.getenv("PARALLEL_PROCESSING", "True").lower() == "true"
    MAX_WORKERS: int = int(os.getenv("MAX_WORKERS", "4"))
    BATCH_SIZE: int = int(os.getenv("BATCH_SIZE", "50"))
    ENABLE_SMART_OCR: bool = os.getenv("ENABLE_SMART_OCR", "True").lower() == "true"
    OCR_TEXT_THRESHOLD: int = int(os.getenv("OCR_TEXT_THRESHOLD", "200"))
    ENABLE_FILE_PRIORITIZATION: bool = os.getenv("ENABLE_FILE_PRIORITIZATION", "True").lower() == "true"
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
    
    # Application Configuration
    APP_NAME: str = "Resume Parser API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "AI-powered resume parsing API with multi-format support"
    OCR_LANGUAGE: str = os.getenv("OCR_LANGUAGE", "en")
    USE_GPU: bool = os.getenv("USE_GPU", "False").lower() == "true"
    
    # API Configuration
    PORT: int = int(os.getenv("PORT", "8000"))
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # File Upload Configuration
    UPLOAD_FOLDER: str = os.getenv("UPLOAD_FOLDER", "uploads")
    
    # Ultra-Fast Processing Configuration (Optimized for 8GB RAM)
    MAX_CONCURRENT_FILES: int = int(os.getenv("MAX_CONCURRENT_FILES", "10"))  # Reduced for 8GB RAM
    MAX_CONCURRENT_API_CALLS: int = int(os.getenv("MAX_CONCURRENT_API_CALLS", "5"))  # Reduced for stability
    ULTRA_FAST_BATCH_SIZE: int = int(os.getenv("ULTRA_FAST_BATCH_SIZE", "50"))  # Smaller batches
    MEMORY_LIMIT_MB: int = int(os.getenv("MEMORY_LIMIT_MB", "2048"))  # 2GB limit for 8GB system
    ENABLE_ULTRA_FAST_PROCESSING: bool = os.getenv("ENABLE_ULTRA_FAST_PROCESSING", "True").lower() == "true"
    
    @classmethod
    def validate_settings(cls) -> bool:
        """
        Validate that all required settings are properly configured.
        
        Returns:
            bool: True if all required settings are valid
        """
        if not cls.OPENAI_API_KEY:
            print("⚠️  Warning: OPENAI_API_KEY not set. Some features may not work.")
            # Don't raise error, just warn
        
        # DATABASE_URL is optional since database service has hardcoded values
        if not cls.DATABASE_URL:
            print("ℹ️  Info: DATABASE_URL not set. Using hardcoded database connection.")
        
        return True

# Create settings instance
settings = Settings()

# Validate settings on import
try:
    settings.validate_settings()
except ValueError as e:
    print(f"Configuration Error: {e}")
    print("Please check your .env file and ensure all required variables are set.")
