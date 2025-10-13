"""
OpenAI service for AI-powered resume parsing.
Uses OpenAI API to extract structured information from resume text.
"""

import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import openai
from app.config.settings import settings

# Configure logging
logger = logging.getLogger(__name__)

class OpenAIService:
    """Service for OpenAI API integration and resume parsing."""
    
    def __init__(self):
        """Initialize OpenAI service with API configuration."""
        # Configure OpenAI client
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Validate API key
        if not settings.OPENAI_API_KEY:
            raise ValueError("OpenAI API key is required")
        
        logger.info("OpenAI service initialized successfully")
    
    async def parse_resume_text(self, resume_text: str) -> Dict[str, Any]:
        """
        Parse resume text using OpenAI API and extract structured information.
        
        Args:
            resume_text (str): Raw text content from resume
            
        Returns:
            Dict[str, Any]: Structured resume data
            
        Raises:
            Exception: If OpenAI API call fails
        """
        try:
            # Trim input aggressively to respect context limits
            resume_text = self._compact_and_truncate(resume_text)

            # Create the prompt for resume parsing
            prompt = self._create_resume_parsing_prompt(resume_text)
            
            # Call OpenAI API (with compact-and-retry on context overflow)
            try:
                response = self._call_openai_api(prompt)
            except Exception as e:
                msg = str(e).lower()
                if "context_length_exceeded" in msg or "maximum context length" in msg or "too long" in msg:
                    logger.warning("OpenAI context limit hit; compacting further and retrying once")
                    # Further shrink input and retry once
                    reduced_text = resume_text[: max(10000, int(len(resume_text) * 0.5))]
                    reduced_prompt = self._create_resume_parsing_prompt(reduced_text)
                    response = self._call_openai_api(reduced_prompt)
                else:
                    raise
            
            # Parse the response
            parsed_data = self._parse_openai_response(response)
            
            logger.info(f"Successfully parsed resume with {len(parsed_data)} fields")
            return parsed_data
            
        except Exception as e:
            logger.error(f"Error parsing resume with OpenAI: {str(e)}")
            raise Exception(f"Failed to parse resume with AI: {str(e)}")

    def _estimate_tokens(self, text: str) -> int:
        # Rough heuristic; configurable via settings
        return max(1, len(text) // max(1, settings.CHARS_PER_TOKEN_ESTIMATE))

    def _compact_and_truncate(self, text: str) -> str:
        # Basic compaction to reduce noisy bloat from .doc conversions
        import re
        cleaned = text.replace('\r', '')
        cleaned = re.sub(r'[\t\x0b\x0c]+', ' ', cleaned)
        # Remove repeated header/footer lines appearing across many pages
        lines = [l.strip() for l in cleaned.split('\n')]
        freq = {}
        for l in lines:
            if len(l) <= 2:
                continue
            freq[l] = freq.get(l, 0) + 1
        repeated = {l for l, c in freq.items() if c >= 5 and len(l) <= 80}
        pruned = [l for l in lines if l not in repeated]
        compact = re.sub(r'\s{2,}', ' ', '\n'.join(pruned)).strip()
        # Hard character cap
        cap = settings.MAX_INPUT_CHARS
        if len(compact) > cap:
            compact = compact[:cap]
        # Ensure token estimate under model budget
        est_tokens = self._estimate_tokens(compact)
        max_allowed = max(1000, (settings.OPENAI_MAX_TOKENS * 3))
        # Keep a generous margin so prompt + response fits
        while est_tokens > max_allowed and len(compact) > 10000:
            compact = compact[: int(len(compact) * 0.8)]
            est_tokens = self._estimate_tokens(compact)
        logger.info(f"Parse input length after compaction: chars={len(compact)}, est_tokens={est_tokens}")
        return compact
    
    def _create_resume_parsing_prompt(self, resume_text: str) -> str:
        """
        Create the prompt for OpenAI API to parse resume.
        
        Args:
            resume_text (str): Raw resume text
            
        Returns:
            str: Formatted prompt for OpenAI API
        """
        prompt = f"""
Parse the following resume and return a JSON with field names as keys and their corresponding values. 
Only include fields that are actually present in the resume (e.g., skip hobbies if not found).

Important guidelines:
1. Extract all relevant information including name, contact details, experience, education, skills, etc.
2. Use clear, descriptive field names
3. For lists (like skills, experience items), use arrays
4. For dates, use consistent format (YYYY-MM-DD or MM/YYYY)
5. Return ONLY valid JSON, no additional text or explanations
6. If a field has multiple values, use arrays
7. Use "Unknown" for missing information rather than omitting fields
8. Leave TotalExperience field empty - we will calculate it automatically from the Experience data
9. IMPORTANT: Extract GitHub, LinkedIn, portfolio, and other social media/profile links if present in the resume

Resume text:
{resume_text}

Return the parsed data in this exact JSON format:
{{
  "Name": "Full Name",
  "Email": "email@example.com",
  "Phone": "phone number",
  "Location": "city, state/country or full location if available",
  "Address": "full address if available",
  "GitHub": "GitHub profile URL if found",
  "LinkedIn": "LinkedIn profile URL if found",
  "Portfolio": "Portfolio website URL if found",
  "Summary": "professional summary or objective",
  "TotalExperience": "leave this field empty - we will calculate it automatically",
  "Experience": [
    {{
      "Company": "company name",
      "Position": "job title",
      "Duration": "time period (e.g., 'Sep 2024 - Present', '2024-09 - Present', '1 year 3 months')",
      "Description": "job description and achievements"
    }}
  ],
  "Education": [
    {{
      "Institution": "school/university name",
      "Degree": "degree type",
      "Field": "field of study",
      "Year": "graduation year"
    }}
  ],
  "Skills": ["skill1", "skill2", "skill3"],
  "Certifications": ["cert1", "cert2"],
  "Languages": ["language1", "language2"],
  "Projects": [
    {{
      "Name": "project name",
      "Description": "project description",
      "Technologies": ["tech1", "tech2"]
    }}
  ]
}}
"""
        return prompt.strip()
    
    def _call_openai_api(self, prompt: str) -> str:
        """
        Make API call to OpenAI.
        
        Args:
            prompt (str): The prompt to send to OpenAI
            
        Returns:
            str: OpenAI API response
            
        Raises:
            Exception: If API call fails
        """
        try:
            # Make the API call
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional resume parser. Extract structured information from resumes and return only valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=settings.OPENAI_MAX_TOKENS,
                temperature=settings.OPENAI_TEMPERATURE,
                top_p=1,
                frequency_penalty=0,
                presence_penalty=0
            )
            
            # Extract the response content
            response_content = response.choices[0].message.content.strip()
            
            logger.info(f"OpenAI API call successful, response length: {len(response_content)}")
            return response_content
            
        except openai.AuthenticationError:
            raise Exception("OpenAI API authentication failed. Please check your API key.")
        except openai.RateLimitError:
            raise Exception("OpenAI API rate limit exceeded. Please try again later.")
        except openai.APIError as e:
            raise Exception(f"OpenAI API error: {str(e)}")
        except Exception as e:
            raise Exception(f"Unexpected error calling OpenAI API: {str(e)}")
    
    def _parse_openai_response(self, response: str) -> Dict[str, Any]:
        """
        Parse the OpenAI API response and extract JSON data.
        
        Args:
            response (str): Raw response from OpenAI API
            
        Returns:
            Dict[str, Any]: Parsed resume data
            
        Raises:
            Exception: If response parsing fails
        """
        try:
            # Clean the response (remove markdown code blocks if present)
            cleaned_response = self._clean_openai_response(response)
            
            # Log the cleaned response for debugging
            logger.info(f"Cleaned AI response: {cleaned_response}")
            
            # Parse JSON
            parsed_data = json.loads(cleaned_response)
            
            # Validate that we got a dictionary
            if not isinstance(parsed_data, dict):
                raise ValueError("OpenAI response is not a valid JSON object")
            
            # Remove any None values and clean up the data
            cleaned_data = self._clean_parsed_data(parsed_data)
            
            # Calculate total experience if not provided or if AI returned generic response
            if ("TotalExperience" not in cleaned_data or 
                not cleaned_data["TotalExperience"] or 
                cleaned_data["TotalExperience"].lower() in ["unknown", "n/a", "none", "less than a year"]):
                
                # Log the experience data for debugging
                experience_data = cleaned_data.get("Experience", [])
                logger.info(f"Experience data from AI: {experience_data}")
                
                calculated_experience = self._calculate_total_experience(experience_data)
                logger.info(f"Calculated experience: {calculated_experience}")
                
                # If still 0 months, try to extract from resume text as fallback
                if calculated_experience == "0 months" and experience_data:
                    logger.info("Attempting fallback experience extraction from resume text")
                    # This could be enhanced to parse the original resume text for experience
                
                cleaned_data["TotalExperience"] = calculated_experience
            
            return cleaned_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse OpenAI response as JSON: {str(e)}")
            logger.error(f"Raw response: {response}")
            raise Exception("Failed to parse AI response as valid JSON")
        except Exception as e:
            logger.error(f"Error parsing OpenAI response: {str(e)}")
            raise Exception(f"Failed to parse AI response: {str(e)}")
    
    def _clean_openai_response(self, response: str) -> str:
        """
        Clean the OpenAI response to extract valid JSON.
        
        Args:
            response (str): Raw OpenAI response
            
        Returns:
            str: Cleaned JSON string
        """
        # Remove markdown code blocks if present
        if response.startswith("```json"):
            response = response[7:]
        if response.startswith("```"):
            response = response[3:]
        if response.endswith("```"):
            response = response[:-3]
        
        # Remove any leading/trailing whitespace
        response = response.strip()
        
        # Try to find JSON object boundaries
        start_idx = response.find('{')
        end_idx = response.rfind('}')
        
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            response = response[start_idx:end_idx + 1]
        
        # Remove any extra text before or after JSON
        lines = response.split('\n')
        json_lines = []
        in_json = False
        
        for line in lines:
            line = line.strip()
            if line.startswith('{') or in_json:
                in_json = True
                json_lines.append(line)
                if line.endswith('}') and line.count('{') == line.count('}'):
                    break
        
        if json_lines:
            response = '\n'.join(json_lines)
        
        return response
    
    def _clean_parsed_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Clean and validate parsed resume data.
        
        Args:
            data (Dict[str, Any]): Raw parsed data
            
        Returns:
            Dict[str, Any]: Cleaned and validated data
        """
        cleaned_data = {}
        
        for key, value in data.items():
            # Skip None values
            if value is None:
                continue
            
            # Clean string values
            if isinstance(value, str):
                cleaned_value = value.strip()
                if cleaned_value and cleaned_value.lower() not in ['unknown', 'n/a', 'none']:
                    cleaned_data[key] = cleaned_value
            
            # Clean list values
            elif isinstance(value, list):
                cleaned_list = []
                for item in value:
                    if isinstance(item, str):
                        cleaned_item = item.strip()
                        if cleaned_item and cleaned_item.lower() not in ['unknown', 'n/a', 'none']:
                            cleaned_list.append(cleaned_item)
                    elif isinstance(item, dict):
                        cleaned_item = self._clean_parsed_data(item)
                        if cleaned_item:  # Only add non-empty dictionaries
                            cleaned_list.append(cleaned_item)
                    else:
                        cleaned_list.append(item)
                
                if cleaned_list:
                    cleaned_data[key] = cleaned_list
            
            # Clean dictionary values
            elif isinstance(value, dict):
                cleaned_dict = self._clean_parsed_data(value)
                if cleaned_dict:  # Only add non-empty dictionaries
                    cleaned_data[key] = cleaned_dict
            
            # Keep other types as is
            else:
                cleaned_data[key] = value
        
        # Override TotalExperience with our calculated value if Experience is present
        if "Experience" in cleaned_data and isinstance(cleaned_data["Experience"], list):
            calculated_experience = self._calculate_total_experience(cleaned_data["Experience"])
            cleaned_data["TotalExperience"] = calculated_experience
            logger.info(f"Overriding AI TotalExperience with calculated value: {calculated_experience}")
        
        return cleaned_data
    
    async def validate_resume_content(self, resume_text: str) -> Dict[str, Any]:
        """
        Validate resume content and provide quality assessment.
        
        Args:
            resume_text (str): Resume text content
            
        Returns:
            Dict[str, Any]: Validation results and quality metrics
        """
        try:
            # Simple validation metrics
            word_count = len(resume_text.split())
            char_count = len(resume_text)
            
            # Check for common resume sections
            sections_found = {
                "contact_info": any(keyword in resume_text.lower() for keyword in ["email", "phone", "address"]),
                "experience": any(keyword in resume_text.lower() for keyword in ["experience", "work", "employment"]),
                "education": any(keyword in resume_text.lower() for keyword in ["education", "degree", "university"]),
                "skills": any(keyword in resume_text.lower() for keyword in ["skills", "technologies", "tools"]),
            }
            
            return {
                "word_count": word_count,
                "character_count": char_count,
                "sections_found": sections_found,
                "quality_score": self._calculate_quality_score(word_count, sections_found),
                "is_valid": word_count > 10  # Basic validity check
            }
            
        except Exception as e:
            logger.error(f"Error validating resume content: {str(e)}")
            return {
                "error": str(e),
                "is_valid": False
            }
    
    def _calculate_quality_score(self, word_count: int, sections_found: Dict[str, bool]) -> float:
        """
        Calculate a quality score for the resume content.
        
        Args:
            word_count (int): Number of words in resume
            sections_found (Dict[str, bool]): Sections found in resume
            
        Returns:
            float: Quality score (0-100)
        """
        score = 0
        
        # Base score from word count
        if word_count > 100:
            score += 30
        elif word_count > 50:
            score += 20
        elif word_count > 20:
            score += 10
        
        # Score from sections found
        sections_score = sum(sections_found.values()) * 15
        score += sections_score
        
        return min(score, 100)  # Cap at 100
    
    def _calculate_total_experience(self, experience_list: list) -> str:
        """
        Calculate total experience from experience array.
        
        Args:
            experience_list (list): List of experience dictionaries
            
        Returns:
            str: Total experience in years and months
        """
        try:
            if not experience_list:
                return "0 months"
            
            total_months = 0
            
            for exp in experience_list:
                if isinstance(exp, dict):
                    # Try multiple possible duration fields
                    duration = None
                    for field in ["Duration", "duration", "Time", "time", "Period", "period"]:
                        if field in exp:
                            duration = exp[field]
                            break
                    
                    if duration and isinstance(duration, str):
                        logger.info(f"Processing duration: '{duration}'")
                        
                        # Handle date range formats (e.g., "2025-05 - Present", "2024-08 - 2025-03")
                        if "-" in duration or "–" in duration:
                            months = self._calculate_months_from_date_range(duration)
                            total_months += months
                            logger.info(f"Date range '{duration}' calculated as {months} months")
                        else:
                            # Handle explicit duration strings
                            duration_lower = duration.lower()
                            
                            # Extract years
                            if "year" in duration_lower:
                                year_parts = duration_lower.split("year")
                                if year_parts[0].strip():
                                    try:
                                        years = float(year_parts[0].strip())
                                        total_months += int(years * 12)
                                        logger.info(f"Extracted {years} years from '{duration}'")
                                    except ValueError:
                                        pass
                            
                            # Extract months
                            if "month" in duration_lower:
                                month_parts = duration_lower.split("month")
                                if month_parts[0].strip():
                                    try:
                                        months = float(month_parts[0].strip())
                                        total_months += int(months)
                                        logger.info(f"Extracted {months} months from '{duration}'")
                                    except ValueError:
                                        pass
            
            # Format the result
            if total_months == 0:
                return "0 months"
            elif total_months < 12:
                return f"{total_months} months"
            else:
                years = total_months // 12
                remaining_months = total_months % 12
                if remaining_months == 0:
                    return f"{years} years"
                else:
                    return f"{years} years {remaining_months} months"
                
        except Exception as e:
            logger.warning(f"Error calculating total experience: {str(e)}")
            return "Unknown"
    
    def _calculate_months_from_date_range(self, date_range: str) -> int:
        """
        Calculate months from date range string.
        
        Args:
            date_range (str): Date range like "2025-05 - Present" or "2024-08 - 2025-03"
            
        Returns:
            int: Total months
        """
        try:
            from datetime import datetime
            
            # Clean the date range
            date_range = date_range.strip()
            
            # Split by common separators (look for space-dash-space pattern)
            if " - " in date_range:
                parts = date_range.split(" - ")
            elif "–" in date_range:
                parts = date_range.split("–")
            elif "-" in date_range:
                # Handle case where there's no space around dash
                parts = date_range.split("-")
                if len(parts) > 2:
                    # Reconstruct properly
                    start_part = parts[0] + "-" + parts[1]
                    end_part = "-".join(parts[2:])
                    parts = [start_part, end_part]
            else:
                return 0
            
            if len(parts) != 2:
                return 0
            
            start_date_str = parts[0].strip()
            end_date_str = parts[1].strip()
            
            # Parse start date (try both formats: "2025-05" or "Sep 2024")
            start_date = self._parse_date_format(start_date_str)
            if not start_date:
                start_date = self._parse_date(start_date_str)
            if not start_date:
                return 0
            
            # Parse end date
            if end_date_str.lower() in ["present", "current", "now"]:
                end_date = datetime.now()
            else:
                end_date = self._parse_date_format(end_date_str)
                if not end_date:
                    end_date = self._parse_date(end_date_str)
                if not end_date:
                    return 0
            
            # Calculate months difference
            months = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
            
            return max(0, months)
            
        except Exception as e:
            logger.warning(f"Error parsing date range '{date_range}': {str(e)}")
            return 0
    
    def _parse_date(self, date_str: str) -> datetime:
        """
        Parse date string to datetime object.
        
        Args:
            date_str (str): Date string like "May 2025" or "March 2025"
            
        Returns:
            datetime: Parsed datetime object
        """
        try:
            from datetime import datetime
            
            # Remove extra spaces and clean
            date_str = date_str.strip()
            
            # Handle month names (including all common abbreviations)
            month_names = {
                "january": 1, "jan": 1,
                "february": 2, "feb": 2,
                "march": 3, "mar": 3,
                "april": 4, "apr": 4,
                "may": 5,
                "june": 6, "jun": 6,
                "july": 7, "jul": 7,
                "august": 8, "aug": 8,
                "september": 9, "sep": 9, "sept": 9,
                "october": 10, "oct": 10,
                "november": 11, "nov": 11,
                "december": 12, "dec": 12
            }
            
            # Extract month and year
            parts = date_str.lower().split()
            
            if len(parts) >= 2:
                month_name = parts[0]
                year_str = parts[1]
                
                if month_name in month_names and year_str.isdigit():
                    month = month_names[month_name]
                    year = int(year_str)
                    return datetime(year, month, 1)
            
            return None
            
        except Exception as e:
            logger.warning(f"Error parsing date '{date_str}': {str(e)}")
            return None
    
    def _parse_date_format(self, date_str: str) -> datetime:
        """
        Parse date string in YYYY-MM format to datetime object.
        
        Args:
            date_str (str): Date string like "2025-05" or "2024-08"
            
        Returns:
            datetime: Parsed datetime object
        """
        try:
            from datetime import datetime
            
            # Remove extra spaces and clean
            date_str = date_str.strip()
            
            # Check if it's in YYYY-MM format
            if "-" in date_str and len(date_str.split("-")) == 2:
                year_str, month_str = date_str.split("-")
                
                if year_str.isdigit() and month_str.isdigit():
                    year = int(year_str)
                    month = int(month_str)
                    
                    # Validate month
                    if 1 <= month <= 12:
                        return datetime(year, month, 1)
            
            return None
            
        except Exception as e:
            logger.warning(f"Error parsing date format '{date_str}': {str(e)}")
            return None

    async def generate_embedding(self, text: str) -> Optional[List[float]]:
        """
        Generate embedding for text using OpenAI's text-embedding-3-small model.
        
        Args:
            text (str): Text to generate embedding for
            
        Returns:
            Optional[List[float]]: Embedding vector or None if failed
        """
        try:
            if not text or not text.strip():
                logger.warning("Empty text provided for embedding generation")
                return None
            
            # Clean and truncate text if too long (OpenAI has limits)
            cleaned_text = text.strip()
            if len(cleaned_text) > 8191:  # OpenAI's limit for text-embedding-3-small
                cleaned_text = cleaned_text[:8191]
                logger.info("Text truncated to 8191 characters for embedding generation")
            
            # Generate embedding using OpenAI API
            response = self.client.embeddings.create(
                model="text-embedding-3-small",
                input=cleaned_text
            )
            
            # Extract embedding vector
            embedding = response.data[0].embedding
            
            logger.info(f"Successfully generated embedding with {len(embedding)} dimensions")
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            return None

    async def parse_resume_text_parallel(self, texts: List[str]) -> List[Dict]:
        """Parse multiple resumes in parallel for ultra-fast processing."""
        import asyncio
        semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_API_CALLS)
        
        async def parse_single(text):
            async with semaphore:
                return await self.parse_resume_text(text)
        
        tasks = [parse_single(text) for text in texts]
        return await asyncio.gather(*tasks, return_exceptions=True)

    async def generate_embeddings_parallel(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts in parallel."""
        import asyncio
        semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_API_CALLS)
        
        async def embed_single(text):
            async with semaphore:
                return await self.generate_embedding(text)
        
        tasks = [embed_single(text) for text in texts]
        return await asyncio.gather(*tasks, return_exceptions=True)

    async def process_resume_batch_ultra_fast(self, file_contents: List[bytes], filenames: List[str]) -> List[Dict]:
        """Process a batch of resumes with parallel API calls."""
        import asyncio
        from app.services.file_processor import FileProcessor
        
        # Extract text from all files
        file_processor = FileProcessor()
        texts = []
        
        for content, filename in zip(file_contents, filenames):
            try:
                text = await file_processor.process_file(content, filename)
                texts.append(text if text and len(text.strip()) > 10 else "")
            except Exception as e:
                logger.error(f"Error extracting text from {filename}: {str(e)}")
                texts.append("")
        
        # Parse and generate embeddings in parallel
        parse_tasks = [self.parse_resume_text(text) for text in texts]
        embedding_tasks = [self.generate_embedding(text[:1000]) for text in texts]  # Truncate for speed
        
        parsed_results, embedding_results = await asyncio.gather(
            asyncio.gather(*parse_tasks, return_exceptions=True),
            asyncio.gather(*embedding_tasks, return_exceptions=True)
        )
        
        # Combine results
        results = []
        for i, (parsed, embedding) in enumerate(zip(parsed_results, embedding_results)):
            if isinstance(parsed, dict) and parsed and isinstance(embedding, list):
                results.append({
                    "parsed_data": parsed,
                    "embedding": embedding,
                    "status": "success"
                })
            else:
                results.append({
                    "parsed_data": None,
                    "embedding": None,
                    "status": "failed",
                    "error": "Failed to parse or generate embedding"
                })
        
        return results

# Create service instance
openai_service = OpenAIService()
