"""
File processing service for handling different file formats.
Extracts text content from various file types including PDF, DOCX, images, etc.
"""

import io
import os
import tempfile
import subprocess
import shutil
import logging
from typing import Optional, List

# Import file processing libraries
import fitz  # PyMuPDF
import docx2txt
from PIL import Image
# import pytesseract  # Removed - requires external Tesseract installation
import easyocr
import numpy as np
from app.config.settings import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FileProcessor:
    """Service for processing different file formats and extracting text content."""
    
    def __init__(self):
        """Initialize the file processor with OCR configuration."""
        # Initialize EasyOCR reader with proper error handling
        self.easyocr_reader = None
        self.ocr_available = False
        
        if settings.OCR_ENABLED:
            try:
                logger.info("Initializing EasyOCR...")
                self.easyocr_reader = easyocr.Reader(
                    [settings.OCR_LANGUAGE], 
                    gpu=settings.USE_GPU
                )
                self.ocr_available = True
                logger.info("EasyOCR initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize EasyOCR: {e}")
                logger.warning("PDF OCR will be disabled - text extraction only")
                self.ocr_available = False
        else:
            logger.info("OCR disabled by configuration")
            self.ocr_available = False
    
    async def process_file(self, file_content: bytes, filename: str) -> str:
        """
        Process a file and extract text content.
        
        Args:
            file_content (bytes): File content as bytes
            filename (str): Name of the file
            
        Returns:
            str: Extracted text content
            
        Raises:
            ValueError: If file format is not supported
            Exception: If file processing fails
        """
        try:
            logger.info(f"Processing file: {filename} ({len(file_content)} bytes)")
            
            # Get file extension
            file_extension = os.path.splitext(filename)[1].lower()
            logger.debug(f"File extension: {file_extension}")
            
            # Process based on file type
            if file_extension == '.pdf':
                logger.info("Processing as PDF file")
                return await self._process_pdf(file_content)
            elif file_extension == '.docx':
                logger.info("Processing as DOCX file")
                return await self._process_docx(file_content)
            elif file_extension == '.doc':
                logger.info("Processing as DOC file")
                return await self._process_doc(file_content)
            elif file_extension in ['.txt', '.rtf']:
                logger.info("Processing as text file")
                return await self._process_text(file_content)
            elif file_extension in ['.png', '.jpg', '.jpeg', '.webp']:
                logger.info("Processing as image file")
                return await self._process_image(file_content)
            else:
                error_msg = f"Unsupported file format: {file_extension}"
                logger.error(error_msg)
                raise ValueError(error_msg)
                
        except Exception as e:
            logger.error(f"Error processing file {filename}: {str(e)}")
            logger.error(f"File size: {len(file_content)} bytes")
            logger.error(f"File extension: {os.path.splitext(filename)[1].lower()}")
            raise
    
    async def _process_pdf(self, file_content: bytes) -> str:
        """
        Extract text from PDF file using PyMuPDF with enhanced content processing.
        
        Args:
            file_content (bytes): PDF file content
            
        Returns:
            str: Extracted text content
        """
        try:
            logger.info(f"Processing PDF file: {len(file_content)} bytes")
            
            # Open PDF with PyMuPDF from bytes
            with fitz.open(stream=file_content, filetype="pdf") as pdf_document:
                logger.info(f"PDF opened successfully: {len(pdf_document)} pages")
                
                # Extract text from all pages
                text_content = []
                for page_num in range(len(pdf_document)):
                    try:
                        page = pdf_document.load_page(page_num)
                        page_text = page.get_text()
                        
                        if page_text.strip():
                            cleaned_text = self._clean_and_normalize_text(page_text)
                            if cleaned_text:
                                text_content.append(cleaned_text)
                                logger.debug(f"Page {page_num + 1}: {len(cleaned_text)} characters")
                    except Exception as e:
                        logger.warning(f"Error processing page {page_num + 1}: {str(e)}")
                        continue
                
                # Join all page content
                full_text = "\n".join(text_content)
                logger.info(f"Initial text extraction: {len(full_text)} characters")
                
                # If text is too sparse, try OCR on first few pages
                if len(full_text.strip()) < settings.MIN_TEXT_LENGTH_FOR_OCR:
                    logger.warning(f"PDF text too sparse ({len(full_text)} chars), attempting OCR on first pages")
                    if self.ocr_available:
                        ocr_text = await self._process_pdf_with_ocr(file_content, pdf_document)
                        if ocr_text and len(ocr_text.strip()) > len(full_text.strip()):
                            full_text = ocr_text
                            logger.info(f"OCR improved text extraction: {len(full_text)} characters")
                        else:
                            logger.warning("OCR did not improve text extraction")
                    else:
                        logger.warning("OCR not available, returning sparse text")
                
                # Final cleanup and deduplication
                final_text = self._finalize_text_content(full_text)
                logger.info(f"Successfully processed PDF: {len(final_text)} characters")
                return final_text
                
        except Exception as e:
            logger.error(f"Error processing PDF: {str(e)}")
            raise Exception(f"Failed to process PDF file: {str(e)}")
    
    async def _process_docx(self, file_content: bytes) -> str:
        """
        Extract text from DOCX file using docx2txt with enhanced content processing.
        
        Args:
            file_content (bytes): DOCX file content
            
        Returns:
            str: Extracted text content
        """
        try:
            # Create a temporary file-like object
            file_stream = io.BytesIO(file_content)
            
            # Extract text using docx2txt
            text_content = docx2txt.process(file_stream)
            
            if not text_content or not text_content.strip():
                raise Exception("No text content found in the document")
            
            # Clean and normalize the extracted text
            cleaned_text = self._clean_and_normalize_text(text_content)
            
            # Final cleanup and deduplication
            final_text = self._finalize_text_content(cleaned_text)
            
            logger.info(f"Successfully extracted text from DOCX: {len(final_text)} characters")
            return final_text
            
        except Exception as e:
            logger.error(f"Error processing DOCX: {str(e)}")
            raise Exception(f"Failed to process DOCX file: {str(e)}")
    
    async def _process_doc(self, file_content: bytes) -> str:
        """
        Extract text from legacy DOC file using external conversion with fallbacks.
        
        Strategy:
        Preferred order minimizes bloat to avoid LLM context overflows:
        1) Try antiword DOC->TXT (cleanest plain text for legacy .doc).
        2) Try LibreOffice (soffice) DOC->DOCX and read via docx2txt.
        3) Try Pandoc DOC->TXT.
        4) Try DOC->PDF then extract via PyMuPDF; if empty and OCR enabled, OCR first pages.
        4) As a very last resort, attempt byte decode cleanup.
        """
        try:
            def _which(names: List[str]) -> Optional[str]:
                for n in names:
                    p = shutil.which(n)
                    if p:
                        return p
                return None

            with tempfile.TemporaryDirectory() as tmpdir:
                input_doc = os.path.join(tmpdir, "input.doc")
                with open(input_doc, "wb") as f:
                    f.write(file_content)

                # 1) antiword -> TXT (if enabled)
                antiword = _which(["antiword"]) if settings.DOC_ENABLE_ANTIWORD else None
                if antiword:
                    try:
                        out_txt = os.path.join(tmpdir, "antiword.txt")
                        with open(out_txt, "w", encoding="utf-8", errors="ignore") as tf:
                            pass
                        proc = subprocess.run([antiword, "-m", "UTF-8.txt", input_doc], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
                        if proc.returncode == 0 and proc.stdout:
                            text = proc.stdout.decode("utf-8", errors="ignore").strip()
                            if len(text) >= 10:
                                logger.info("DOC processed via antiword -> TXT")
                                return text
                    except Exception as e:
                        logger.warning(f"antiword conversion error: {e}")

                # 2) LibreOffice -> DOCX
                soffice = _which(["soffice", "libreoffice"])
                if soffice:
                    try:
                        proc = subprocess.run([soffice, "--headless", "--convert-to", "docx", "--outdir", tmpdir, input_doc], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
                        out_docx = os.path.join(tmpdir, "input.docx")
                        if proc.returncode == 0 and os.path.exists(out_docx):
                            text = docx2txt.process(out_docx) or ""
                            text = text.strip()
                            if len(text) >= 10:
                                logger.info("DOC processed via LibreOffice -> DOCX")
                                return text
                    except Exception as e:
                        logger.warning(f"LibreOffice conversion error: {e}")

                # 3) Pandoc -> TXT
                pandoc = _which(["pandoc"])
                if pandoc:
                    try:
                        out_txt = os.path.join(tmpdir, "output.txt")
                        proc = subprocess.run([pandoc, input_doc, "-t", "plain", "-o", out_txt], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
                        if proc.returncode == 0 and os.path.exists(out_txt):
                            with open(out_txt, "r", encoding="utf-8", errors="ignore") as tf:
                                text = tf.read().strip()
                            if len(text) >= 10:
                                logger.info("DOC processed via Pandoc -> TXT")
                                return text
                    except Exception as e:
                        logger.warning(f"Pandoc conversion error: {e}")

                # 4) Convert to PDF then extract
                pdf_path = os.path.join(tmpdir, "output.pdf")
                pdf_ok = False
                if soffice:
                    try:
                        proc = subprocess.run([soffice, "--headless", "--convert-to", "pdf", "--outdir", tmpdir, input_doc], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
                        potential = os.path.join(tmpdir, "input.pdf")
                        if proc.returncode == 0 and os.path.exists(potential):
                            os.rename(potential, pdf_path)
                            pdf_ok = True
                    except Exception as e:
                        logger.warning(f"LibreOffice DOC->PDF error: {e}")
                if not pdf_ok and pandoc:
                    try:
                        proc = subprocess.run([pandoc, input_doc, "-o", pdf_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
                        pdf_ok = (proc.returncode == 0 and os.path.exists(pdf_path))
                    except Exception as e:
                        logger.warning(f"Pandoc DOC->PDF error: {e}")

                if pdf_ok:
                    try:
                        with open(pdf_path, "rb") as pf:
                            pdf_bytes = pf.read()
                        text = await self._process_pdf(pdf_bytes)
                        text = (text or "").strip()
                        if len(text) >= 10:
                            logger.info("DOC processed via PDF text extraction")
                            return text
                    except Exception as e:
                        logger.warning(f"PDF text extraction error: {e}")

                    # OCR fallback on first pages (guarded by flag)
                    if settings.DOC_ENABLE_OCR:
                        try:
                            doc = fitz.open(pdf_path)
                            chunks = []
                            for i in range(min(5, len(doc))):
                                page = doc.load_page(i)
                                pix = page.get_pixmap(dpi=200)
                                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                                ocr_lines = self.easyocr_reader.readtext(np.array(img), detail=0)
                                if ocr_lines:
                                    chunks.append("\n".join(ocr_lines))
                            doc.close()
                            text = ("\n".join(chunks)).strip()
                            if len(text) >= 10:
                                logger.info("DOC processed via OCR fallback")
                                return text
                        except Exception as e:
                            logger.warning(f"OCR fallback error: {e}")

                # 4) Byte decode last resort
                try:
                    text = file_content.decode('utf-8', errors='ignore')
                    import re
                    text = re.sub(r'[^\x20-\x7E\n\r\t]', ' ', text)
                    text = re.sub(r'\s+', ' ', text)
                    if text.strip():
                        logger.info("DOC processed via byte decode fallback")
                        return text.strip()
                except Exception:
                    pass

            raise Exception("No usable text extracted from DOC. Install LibreOffice or Pandoc for best results.")

        except Exception as e:
            logger.error(f"Error processing DOC: {str(e)}")
            raise Exception(f"Failed to process DOC file: {str(e)}")
    
    async def _process_text(self, file_content: bytes) -> str:
        """
        Extract text from plain text files.
        
        Args:
            file_content (bytes): Text file content
            
        Returns:
            str: Extracted text content
        """
        try:
            # Decode text content
            text_content = file_content.decode('utf-8')
            
            if not text_content or not text_content.strip():
                raise Exception("No text content found in the file")
            
            logger.info(f"Successfully extracted text from text file: {len(text_content)} characters")
            return text_content.strip()
            
        except UnicodeDecodeError:
            # Try with different encoding
            try:
                text_content = file_content.decode('latin-1')
                logger.info(f"Successfully extracted text from text file: {len(text_content)} characters")
                return text_content.strip()
            except Exception as e:
                logger.error(f"Error processing text file: {str(e)}")
                raise Exception(f"Failed to process text file: {str(e)}")
        except Exception as e:
            logger.error(f"Error processing text file: {str(e)}")
            raise Exception(f"Failed to process text file: {str(e)}")
    
    async def _process_image(self, file_content: bytes) -> str:
        """
        Extract text from image files using EasyOCR.
        
        Args:
            file_content (bytes): Image file content
            
        Returns:
            str: Extracted text content
        """
        try:
            # Check if EasyOCR is available
            if not self.easyocr_reader:
                raise Exception("EasyOCR is not available. Please check installation.")
            
            # Open image from bytes
            image = Image.open(io.BytesIO(file_content))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert PIL image to numpy array
            image_array = np.array(image)
            
            # Extract text using EasyOCR
            results = self.easyocr_reader.readtext(image_array)
            
            # Extract text from results
            text_content = []
            for (bbox, text, prob) in results:
                if prob > 0.5:  # Only include text with confidence > 50%
                    text_content.append(text)
            
            extracted_text = " ".join(text_content)
            
            if not extracted_text.strip():
                raise Exception("No text content could be extracted from the image")
            
            logger.info(f"Successfully extracted text from image using EasyOCR: {len(extracted_text)} characters")
            return extracted_text.strip()
            
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            raise Exception(f"Failed to process image file: {str(e)}")
    
    def _clean_and_normalize_text(self, text: str) -> str:
        """
        Clean and normalize extracted text content.
        
        Args:
            text (str): Raw extracted text
            
        Returns:
            str: Cleaned and normalized text
        """
        if not text:
            return ""
        
        # Remove excessive whitespace and normalize line breaks
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Strip whitespace and skip empty lines
            cleaned_line = line.strip()
            if cleaned_line:
                cleaned_lines.append(cleaned_line)
        
        # Join lines with single newlines
        normalized_text = '\n'.join(cleaned_lines)
        
        # Remove common PDF artifacts
        normalized_text = self._remove_pdf_artifacts(normalized_text)
        
        # Remove excessive repeated characters
        normalized_text = self._remove_repeated_chars(normalized_text)
        
        return normalized_text
    
    def _remove_pdf_artifacts(self, text: str) -> str:
        """Remove common PDF extraction artifacts."""
        # Remove page numbers (standalone numbers at start/end of lines)
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Skip lines that are just page numbers
            if line.strip().isdigit() and len(line.strip()) <= 3:
                continue
            # Skip lines that are just repeated characters
            if len(set(line.strip())) <= 2 and len(line.strip()) > 5:
                continue
            cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
    
    def _remove_repeated_chars(self, text: str) -> str:
        """Remove excessive repeated characters."""
        import re
        # Remove sequences of 3+ repeated characters
        text = re.sub(r'(.)\1{2,}', r'\1\1', text)
        return text
    
    def _finalize_text_content(self, text: str) -> str:
        """
        Final cleanup and deduplication of text content.
        
        Args:
            text (str): Text to finalize
            
        Returns:
            str: Finalized text content
        """
        if not text:
            return ""
        
        # Remove duplicate lines while preserving order
        lines = text.split('\n')
        seen_lines = set()
        unique_lines = []
        
        for line in lines:
            # Normalize line for comparison (lowercase, strip)
            normalized_line = line.strip().lower()
            if normalized_line and normalized_line not in seen_lines:
                seen_lines.add(normalized_line)
                unique_lines.append(line)
        
        # Join unique lines
        final_text = '\n'.join(unique_lines)
        
        # Remove excessive whitespace
        final_text = ' '.join(final_text.split())
        
        # Ensure reasonable length
        if len(final_text) > settings.MAX_INPUT_CHARS:
            final_text = final_text[:settings.MAX_INPUT_CHARS]
            logger.warning(f"Text truncated to {settings.MAX_INPUT_CHARS} characters")
        
        return final_text
    
    async def _process_pdf_with_ocr(self, file_content: bytes, pdf_document) -> str:
        """
        Process PDF with OCR when text extraction is sparse.
        
        Args:
            file_content (bytes): PDF file content
            pdf_document: Open PDF document
            
        Returns:
            str: OCR extracted text
        """
        try:
            if not self.ocr_available or not self.easyocr_reader:
                logger.warning("OCR not available, returning empty text")
                return ""
            
            text_content = []
            # Process limited number of pages with OCR
            max_pages = min(settings.OCR_MAX_PAGES, len(pdf_document))
            logger.info(f"Processing {max_pages} pages with OCR")
            
            for page_num in range(max_pages):
                try:
                    page = pdf_document.load_page(page_num)
                    logger.debug(f"Processing page {page_num + 1} with OCR")
                    
                    # Convert page to image with optimized zoom
                    mat = fitz.Matrix(settings.OCR_IMAGE_ZOOM, settings.OCR_IMAGE_ZOOM)
                    pix = page.get_pixmap(matrix=mat)
                    img_data = pix.tobytes("png")
                    
                    # Convert to PIL Image
                    image = Image.open(io.BytesIO(img_data))
                    img_array = np.array(image)
                    
                    # Perform OCR with confidence threshold
                    ocr_results = self.easyocr_reader.readtext(img_array)
                    
                    # Extract text from OCR results with confidence filtering
                    page_text = " ".join([
                        result[1] for result in ocr_results 
                        if result[2] > settings.OCR_CONFIDENCE_THRESHOLD
                    ])
                    
                    if page_text.strip():
                        cleaned_text = self._clean_and_normalize_text(page_text)
                        if cleaned_text:
                            text_content.append(cleaned_text)
                            logger.debug(f"Page {page_num + 1} OCR: {len(cleaned_text)} characters")
                    
                    # Clean up memory
                    del img_array, image, img_data, pix
                    
                except Exception as e:
                    logger.warning(f"OCR failed on page {page_num + 1}: {str(e)}")
                    continue
            
            result_text = '\n'.join(text_content)
            logger.info(f"OCR processing completed: {len(result_text)} characters")
            return result_text
            
        except Exception as e:
            logger.error(f"OCR processing failed: {str(e)}")
            return ""
