"""
Ultra-fast single file processing for high-volume resume parsing.
Optimized for processing 20,000+ files in minutes.
"""

import time
import logging
import asyncio
import os
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

async def _process_single_file_ultra_fast(file_data: Dict, company_id: int) -> Dict:
    """Ultra-optimized single file processing."""
    try:
        # 1. FAST text extraction (no logging overhead)
        from app.services.file_processor import FileProcessor
        file_processor = FileProcessor()
        extracted_text = await file_processor.process_file(file_data["content"], file_data["filename"])
        
        if not extracted_text or len(extracted_text.strip()) < 10:
            return {"status": "failed", "error": "No text content"}
        
        # 2. OPTIMIZED OpenAI calls (parallel)
        from app.services.openai_service import openai_service
        
        # Parse and generate embedding simultaneously
        parse_task = openai_service.parse_resume_text(extracted_text)
        embedding_task = openai_service.generate_embedding(extracted_text[:1000])  # Truncate for speed
        
        # Wait for both to complete
        parsed_data, embedding = await asyncio.gather(parse_task, embedding_task)
        
        if not parsed_data:
            return {"status": "failed", "error": "Failed to parse"}
        
        # 3. MINIMAL data preparation
        resume_data = {
            "filename": file_data["filename"],
            "file_path": f"uploads/{file_data['filename']}",
            "file_type": file_data["extension"].lstrip('.'),
            "file_size": file_data["size"],
            "processing_time": 0.0,
            "parsed_data": parsed_data,
            "embedding": embedding
        }
        
        return {"status": "success", "data": resume_data}
        
    except Exception as e:
        return {"status": "failed", "error": str(e)}

async def _stream_files_ultra_fast(files) -> List[Dict]:
    """Stream files efficiently for ultra-fast processing."""
    all_files = []
    
    for file in files:
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        if file_extension == '.zip':
            # Extract zip files
            from app.controllers.resume_controller import _extract_resume_files_from_zip
            extracted_files = await _extract_resume_files_from_zip(file)
            for extracted_file in extracted_files:
                all_files.append({
                    "filename": extracted_file["filename"],
                    "content": extracted_file["content"],
                    "size": extracted_file["size"],
                    "extension": extracted_file["extension"],
                    "is_from_zip": True
                })
        else:
            # Read file content
            content = await file.read()
            all_files.append({
                "filename": file.filename,
                "content": content,
                "size": len(content),
                "extension": file_extension,
                "is_from_zip": False
            })
    
    return all_files

