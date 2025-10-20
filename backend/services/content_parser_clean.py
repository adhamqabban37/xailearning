import re
import json
import PyPDF2
import pdfplumber
from io import BytesIO
from typing import Dict, List, Any, Optional, Tuple
from pydantic import ValidationError

class ParseError(Exception):
    """Custom exception for parsing errors"""
    def __init__(self, message: str, error_type: str = "parse_error"):
        self.message = message
        self.error_type = error_type
        super().__init__(self.message)

class ContentParser:
    """Advanced content parser for AI-generated learning roadmaps"""
    
    def __init__(self):
        self.json_patterns = {
            'resource_pack': [
                r'Resource Pack \(JSON\)[:\s]*\n```json\s*(\{.*?\})\s*```',
                r'3️⃣ Resource Pack \(JSON\)[:\s]*\n```json\s*(\{.*?\})\s*```',
                r'RESOURCE_PACK[:\s]*\n```json\s*(\{.*?\})\s*```',
                r'resources[\"\':\s]*(\{.*?\})',
            ],
            'daily_plan': [
                r'Daily Action Plan \(JSON\)[:\s]*\n```json\s*(\{.*?\})\s*```',
                r'4️⃣ Daily Action Plan \(JSON\)[:\s]*\n```json\s*(\{.*?\})\s*```',
                r'DAILY_PLAN[:\s]*\n```json\s*(\{.*?\})\s*```',
                r'daily_plan[\"\':\s]*(\{.*?\})',
            ],
            'quiz': [
                r'Quiz & Assessment \(JSON\)[:\s]*\n```json\s*(\{.*?\})\s*```',
                r'5️⃣ Quiz & Assessment \(JSON\)[:\s]*\n```json\s*(\{.*?\})\s*```',
                r'QUIZ[:\s]*\n```json\s*(\{.*?\})\s*```',
                r'quiz[\"\':\s]*(\{.*?\})',
            ],
            'timeline': [
                r'Timeline \(JSON\)[:\s]*\n```json\s*(\{.*?\})\s*```',
                r'6️⃣ Timeline \(JSON\)[:\s]*\n```json\s*(\{.*?\})\s*```',
                r'TIMELINE[:\s]*\n```json\s*(\{.*?\})\s*```',
                r'timeline[\"\':\s]*(\{.*?\})',
            ]
        }
        
        self.section_patterns = {
            'overview': r'=== OVERVIEW ===(.*?)(?==== |$)',
            'modules': r'=== MODULES ===(.*?)(?==== |$)',
            'resource_library': r'=== RESOURCE_LIBRARY ===(.*?)(?==== |$)',
            'daily_plans': r'=== DAILY_PLANS ===(.*?)(?==== |$)',
            'quizzes': r'=== QUIZZES ===(.*?)(?==== |$)',
            'timeline': r'=== TIMELINE ===(.*?)(?==== |$)',
        }
        
        # Enhanced module detection patterns (ordered by specificity)
        self.module_patterns = [
            {
                'name': 'module',
                'pattern': r'Module\s+(\d+)[:\s]*([^\n]+)',
                'priority': 1
            },
            {
                'name': 'week',
                'pattern': r'Week\s+(\d+)[:\s]*([^\n]+)',
                'priority': 2
            },
            {
                'name': 'chapter',
                'pattern': r'Chapter\s+(\d+)[:\s]*([^\n]+)',
                'priority': 3
            },
            {
                'name': 'lesson',
                'pattern': r'Lesson\s+(\d+)[:\s]*([^\n]+)',
                'priority': 4
            },
            {
                'name': 'day',
                'pattern': r'Day\s+(\d+)[:\s]*([^\n]+)',
                'priority': 5
            },
            {
                'name': 'part',
                'pattern': r'Part\s+(\d+)[:\s]*([^\n]+)',
                'priority': 6
            },
            {
                'name': 'section',
                'pattern': r'Section\s+(\d+)[:\s]*([^\n]+)',
                'priority': 7
            },
            {
                'name': 'numbered_dot',
                'pattern': r'^(\d+)\.\s*([^\n]+)',
                'priority': 8
            },
            {
                'name': 'numbered_paren',
                'pattern': r'^(\d+)\)\s*([^\n]+)',
                'priority': 9
            },
            {
                'name': 'numbered_dash',
                'pattern': r'^(\d+)\s*[-–]\s*([^\n]+)',
                'priority': 10
            }
        ]

    def _detect_module_patterns(self, text: str) -> List[re.Match]:
        """
        Enhanced module detection supporting multiple common formats.
        Returns list of regex matches with the best pattern found.
        """
        valid_pattern_results = []
        
        # Try each pattern and collect valid results
        for pattern_info in self.module_patterns:
            pattern = pattern_info['pattern']
            flags = re.IGNORECASE | re.MULTILINE if pattern.startswith('^') else re.IGNORECASE
            
            matches = list(re.finditer(pattern, text, flags))
            
            # Skip if no matches
            if len(matches) < 1:
                continue
                
            # Quality checks to avoid false positives
            if self._validate_module_matches(matches, text, pattern_info['name']):
                valid_pattern_results.append({
                    'name': pattern_info['name'],
                    'matches': matches,
                    'priority': pattern_info['priority'],
                    'count': len(matches)
                })
        
        # Choose best pattern: prioritize by match count, then by priority
        if not valid_pattern_results:
            self._last_pattern_used = 'default'
            return []
        
        # Sort by: 1) match count (descending), 2) priority (ascending)  
        best_result = sorted(valid_pattern_results, key=lambda x: (-x['count'], x['priority']))[0]
        
        self._last_pattern_used = best_result['name']
        return best_result['matches']
    
    def _validate_module_matches(self, matches: List[re.Match], text: str, pattern_name: str) -> bool:
        """
        Validate that matches are likely real module headers, not false positives.
        """
        if len(matches) == 0:
            return False
            
        # For numbered patterns, check if they start from 1 and are sequential
        if pattern_name.startswith('numbered'):
            numbers = []
            for match in matches:
                try:
                    num = int(match.group(1))
                    numbers.append(num)
                except (ValueError, IndexError):
                    continue
            
            if numbers:
                numbers.sort()
                # Should start from 1 and be mostly sequential
                if numbers[0] != 1:
                    return False
                
                # Allow some gaps but not too many
                gaps = sum(1 for i in range(1, len(numbers)) if numbers[i] != numbers[i-1] + 1)
                if gaps > len(numbers) // 2:  # More than 1/2 gaps (was too strict at 1/3)
                    return False
        
        # Check that matches have reasonable spacing (relaxed from 50 to 20 characters)
        positions = [match.start() for match in matches]
        if len(positions) > 1:
            min_distance = min(positions[i+1] - positions[i] for i in range(len(positions)-1))
            if min_distance < 20:  # Reduced from 50 to 20
                return False
        
        # Check that titles are reasonable length (relaxed requirements)
        valid_titles = 0
        for match in matches:
            title = match.group(2).strip() if len(match.groups()) >= 2 else ""
            if len(title) >= 3 and len(title) <= 150:  # Increased max from 100 to 150
                valid_titles += 1
        
        # At least 50% of titles should be valid (was requiring all)
        return valid_titles >= len(matches) * 0.5

    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """Extract text from PDF with OCR fallback for scanned documents"""
        text = ""
        
        try:
            # First attempt: PyPDF2
            pdf_file = BytesIO(pdf_bytes)
            reader = PyPDF2.PdfReader(pdf_file)
            
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text and page_text.strip():
                    text += page_text + "\n"
            
            if text.strip() and len(text.strip()) > 100:
                return text
                
        except Exception as e:
            print(f"PyPDF2 failed: {e}")
        
        try:
            # Fallback: pdfplumber
            pdf_file = BytesIO(pdf_bytes)
            with pdfplumber.open(pdf_file) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text and page_text.strip():
                        text += page_text + "\n"
            
            if text.strip() and len(text.strip()) > 100:
                return text
                
        except Exception as e:
            print(f"pdfplumber failed: {e}")
        
        # If text extraction yielded minimal content, try OCR fallback
        if len(text.strip()) < 100:
            print("Minimal text extracted. Attempting OCR fallback...")
            try:
                ocr_text = self._extract_text_with_ocr(pdf_bytes)
                if len(ocr_text.strip()) > len(text.strip()):
                    return ocr_text
            except Exception as e:
                print(f"OCR fallback failed: {e}")
        
        # If we have some text, return it even if minimal
        if text.strip():
            return text
            
        # Complete failure
        raise ParseError(
            "No text could be extracted from PDF. Try converting to a text-based PDF or ensure the document contains readable text.",
            "pdf_extraction_failed"
        )
    
    def _extract_text_with_ocr(self, pdf_bytes: bytes) -> str:
        """
        Extract text using OCR for scanned PDFs.
        Requires: pip install pytesseract PyMuPDF Pillow
        Also requires Tesseract OCR engine to be installed on the system.
        """
        try:
            import fitz  # PyMuPDF
            import pytesseract
            from PIL import Image
            import io
        except ImportError as e:
            missing_lib = str(e).split("'")[1] if "'" in str(e) else "unknown"
            raise ParseError(
                f"OCR dependencies not installed. Run: pip install pytesseract PyMuPDF Pillow. Missing: {missing_lib}",
                "ocr_dependencies_missing"
            )
        
        ocr_text = ""
        
        try:
            # Open PDF with PyMuPDF
            pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            
            for page_num in range(len(pdf_doc)):
                page = pdf_doc[page_num]
                
                # Check if page has selectable text first
                page_text = page.get_text()
                if page_text and len(page_text.strip()) > 50:
                    ocr_text += page_text + "\n"
                    continue
                
                # If no/minimal text, extract images and run OCR
                image_list = page.get_images()
                
                if image_list:
                    # Process images on this page
                    for img_index, img in enumerate(image_list):
                        try:
                            xref = img[0]
                            pix = fitz.Pixmap(pdf_doc, xref)
                            
                            # Skip CMYK images (not supported by PIL directly)
                            if pix.n - pix.alpha < 4:  # GRAY or RGB
                                img_data = pix.tobytes("png")
                                img_pil = Image.open(io.BytesIO(img_data))
                                
                                # Run OCR on the image
                                img_text = pytesseract.image_to_string(img_pil, config='--psm 6')
                                if img_text.strip():
                                    ocr_text += img_text + "\n"
                            
                            pix = None  # Free memory
                            
                        except Exception as e:
                            print(f"OCR failed for image {img_index} on page {page_num}: {e}")
                            continue
                else:
                    # No images found, try rendering the entire page as an image
                    try:
                        mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better OCR
                        pix = page.get_pixmap(matrix=mat)
                        img_data = pix.tobytes("png")
                        img_pil = Image.open(io.BytesIO(img_data))
                        
                        # Run OCR on the rendered page
                        page_text = pytesseract.image_to_string(img_pil, config='--psm 6')
                        if page_text.strip():
                            ocr_text += page_text + "\n"
                        
                        pix = None  # Free memory
                        
                    except Exception as e:
                        print(f"OCR failed for rendered page {page_num}: {e}")
                        continue
            
            pdf_doc.close()
            
        except Exception as e:
            raise ParseError(f"OCR processing failed: {e}", "ocr_failed")
        
        if not ocr_text.strip():
            raise ParseError("OCR completed but no text was extracted", "ocr_no_text")
            
        return ocr_text

    def detect_json_blocks(self, text: str) -> Dict[str, Any]:
        """Detect and extract JSON blocks from text"""
        extracted_json = {}
        
        for block_type, patterns in self.json_patterns.items():
            for pattern in patterns:
                matches = re.finditer(pattern, text, re.DOTALL | re.IGNORECASE)
                for match in matches:
                    try:
                        json_str = match.group(1)
                        # Clean up the JSON string
                        json_str = self._clean_json_string(json_str)
                        parsed_json = json.loads(json_str)
                        extracted_json[block_type] = parsed_json
                        break  # Use first successful match
                    except json.JSONDecodeError as e:
                        continue
                        
                if block_type in extracted_json:
                    break  # Found valid JSON for this block type
        
        return extracted_json

    def _clean_json_string(self, json_str: str) -> str:
        """Clean up JSON string for parsing"""
        # Remove markdown formatting
        json_str = re.sub(r'```json\s*', '', json_str)
        json_str = re.sub(r'```\s*$', '', json_str)
        
        # Remove extra whitespace
        json_str = json_str.strip()
        
        # Fix common JSON issues
        json_str = re.sub(r',\s*}', '}', json_str)  # Remove trailing commas
        json_str = re.sub(r',\s*]', ']', json_str)  # Remove trailing commas in arrays
        
        return json_str

    def parse_sections_fallback(self, text: str) -> Dict[str, str]:
        """Parse sections using === markers as fallback"""
        sections = {}
        
        for section_name, pattern in self.section_patterns.items():
            matches = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            if matches:
                sections[section_name] = matches.group(1).strip()
        
        return sections

    def parse_pdf_with_ocr(self, file_bytes: bytes, filename: str = "document.pdf") -> Dict[str, Any]:
        """
        Complete PDF processing pipeline with OCR fallback.
        Handles both normal and scanned PDFs seamlessly.
        
        Args:
            file_bytes: PDF file content as bytes
            filename: Original filename for reference
            
        Returns:
            Dict containing parsed course structure
            
        Raises:
            ParseError: If PDF processing fails completely
        """
        try:
            # Step 1: Extract text with OCR fallback
            text = self.extract_text_from_pdf(file_bytes)
            
            # Step 2: Parse the extracted text into course structure
            result = self.parse_course_content(text, filename)
            
            # Add processing metadata
            result['processing_info'] = {
                'filename': filename,
                'text_length': len(text),
                'extraction_method': 'OCR' if hasattr(self, '_used_ocr') else 'Standard',
                'pattern_used': getattr(self, '_last_pattern_used', 'default'),
                'modules_detected': len(result.get('modules', []))
            }
            
            return result
            
        except ParseError:
            raise  # Re-raise ParseError as-is
        except Exception as e:
            raise ParseError(f"Unexpected error processing PDF: {e}", "processing_failed")

    def parse_course_content(self, parsed_course_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enrich parsed course data with educational content, resources, and learning metadata.
        Takes output from parse_roadmap_structure() and adds AI-enhanced content.
        
        Args:
            parsed_course_data: Structured course data from parse_roadmap_structure()
            
        Returns:
            Enriched course JSON with resources, skill tags, and enhanced metadata
        """
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            logger.info("Starting content enrichment process...")
            logger.debug(f"Input data: {json.dumps(parsed_course_data, indent=2)}")
            
            # Validate input structure
            if not parsed_course_data or not isinstance(parsed_course_data, dict):
                raise ValueError("Invalid input: parsed_course_data must be a valid dictionary")
            
            # Extract basic course information
            course_title = parsed_course_data.get("course_title", "Learning Course")
            course_description = parsed_course_data.get("course_description", "")
            lessons_data = parsed_course_data.get("lessons", [])
            
            logger.info(f"Processing course: {course_title}")
            logger.info(f"Found {len(lessons_data)} lessons to enrich")
            
            # Enrich each lesson with AI-enhanced content
            enriched_lessons = []
            for lesson in lessons_data:
                try:
                    enriched_lesson = self._enrich_lesson_content(lesson, course_title)
                    enriched_lessons.append(enriched_lesson)
                    logger.debug(f"Enriched lesson {lesson.get('lesson_number', 'unknown')}: {enriched_lesson['title']}")
                except Exception as e:
                    logger.warning(f"Failed to enrich lesson {lesson.get('lesson_number', 'unknown')}: {e}")
                    # Add fallback enriched lesson
                    fallback_lesson = self._create_fallback_lesson(lesson)
                    enriched_lessons.append(fallback_lesson)
            
            # Ensure we have at least one lesson
            if not enriched_lessons:
                logger.warning("No lessons found, creating default lesson")
                enriched_lessons = [self._create_default_enriched_lesson(course_title)]
            
            # Build final enriched structure
            enriched_course = {
                "course_title": course_title,
                "course_description": self._enhance_course_description(course_description, course_title),
                "lessons": enriched_lessons,
                "meta": {
                    "total_lessons": len(enriched_lessons),
                    "estimated_hours": sum(self._parse_duration_to_hours(lesson.get("duration", "1 hour")) for lesson in enriched_lessons),
                    "skill_categories": self._extract_skill_categories(enriched_lessons),
                    "difficulty_level": self._assess_difficulty_level(enriched_lessons),
                    "enrichment_timestamp": self._get_timestamp()
                }
            }
            
            logger.info(f"Successfully enriched course with {len(enriched_lessons)} lessons")
            logger.debug(f"Final enriched data: {json.dumps(enriched_course, indent=2)}")
            
            return enriched_course
            
        except Exception as e:
            logger.error(f"Content enrichment failed: {e}")
            # Return safe fallback structure
            return self._create_fallback_course_structure(parsed_course_data)

    def _extract_course_meta(self, text: str, filename: str, structured: bool) -> Dict[str, Any]:
        """Extract course metadata"""
        # Extract title
        title_patterns = [
            r'TOPIC:\s*([^\n]+)',
            r'# ([^\n]+)',
            r'## ([^\n]+)',
            r'Title:\s*([^\n]+)',
        ]
        
        title = "AI Learning Roadmap"
        for pattern in title_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                title = match.group(1).strip()
                break
        
        # Extract level
        level_match = re.search(r'Level:\s*([^\n]+)', text, re.IGNORECASE)
        level = level_match.group(1).strip() if level_match else None
        
        # Extract duration
        duration_patterns = [
            r'Duration:\s*([^\n]+)',
            r'Time Commitment:\s*([^\n]+)',
            r'([0-9]+\s*weeks?)',
            r'([0-9]+\s*months?)',
        ]
        
        duration = "Self-paced"
        for pattern in duration_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                duration = match.group(1).strip()
                break
        
        # Extract milestones
        milestones = []
        milestone_pattern = r'milestone[s]?[:\s]*([^\n]+)'
        for match in re.finditer(milestone_pattern, text, re.IGNORECASE):
            milestones.append(match.group(1).strip())
        
        # Extract final competency
        competency_patterns = [
            r'Final competency[:\s]*([^\n]+)',
            r'Goal[:\s]*([^\n]+)',
            r'By the end[^\n]*you will[^\n]*([^\n]+)',
        ]
        
        final_competency = None
        for pattern in competency_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                final_competency = match.group(1).strip()
                break
        
        return {
            "title": title,
            "level": level,
            "duration": duration,
            "milestones": milestones if milestones else None,
            "final_competency": final_competency,
            "source_filename": filename,
            "structured": structured
        }

    def _parse_modules_from_json(self, text: str, json_blocks: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse modules when JSON blocks are available"""
        modules = []
        
        # Enhanced module detection with multiple patterns
        module_matches = self._detect_module_patterns(text)
        pattern_used = getattr(self, '_last_pattern_used', 'default')
        
        for i, match in enumerate(module_matches, 1):
            module_title = match.group(2).strip()
            
            # Extract module content
            module_content = self._extract_module_content(text, i, module_title)
            
            # Build module with JSON data
            module = {
                "index": i,
                "title": module_title,
                "start_date": module_content.get("start_date"),
                "end_date": module_content.get("end_date"),
                "objectives": module_content.get("objectives", []),
                "summary_notes": module_content.get("summary_notes", []),
                "pitfalls": module_content.get("pitfalls"),
                "resources": self._build_resource_pack(json_blocks.get("resource_pack", {})),
                "daily_plan": self._build_daily_plan(json_blocks.get("daily_plan", {})),
                "quiz": self._build_quiz_block(json_blocks.get("quiz", {})),
                "assignment": module_content.get("assignment")
            }
            
            modules.append(module)
        
        if not modules:
            # Create a single default module
            modules = [{
                "index": 1,
                "title": "Complete Learning Roadmap",
                "objectives": ["Complete all learning objectives"],
                "summary_notes": ["Follow the structured learning plan"],
                "resources": self._build_resource_pack(json_blocks.get("resource_pack", {})),
                "daily_plan": self._build_daily_plan(json_blocks.get("daily_plan", {})),
                "quiz": self._build_quiz_block(json_blocks.get("quiz", {}))
            }]
        
        return modules

    def _parse_modules_from_sections(self, text: str, sections: Dict[str, str]) -> List[Dict[str, Any]]:
        """Parse modules when no JSON blocks available - fallback method"""
        modules = []
        
        # Enhanced module detection with multiple patterns
        module_matches = self._detect_module_patterns(text)
        pattern_used = getattr(self, '_last_pattern_used', 'default')
        
        if module_matches:
            for i, match in enumerate(module_matches, 1):
                module_title = match.group(2).strip()
                objectives = self._extract_module_objectives(text, i, module_title)
                
                module = {
                    "index": i,
                    "title": module_title,
                    "objectives": objectives,
                    "summary_notes": [f"Focus on {module_title.lower()}", "Practice the concepts regularly"],
                    "resources": self._build_default_resources(),
                    "daily_plan": self._build_default_daily_plan(),
                    "quiz": self._create_default_quiz()
                }
                modules.append(module)
        else:
            # Create a single comprehensive module
            modules = [{
                "index": 1,
                "title": "Complete Learning Roadmap",
                "objectives": [
                    "Master the core concepts",
                    "Complete practical exercises",
                    "Apply knowledge in real scenarios"
                ],
                "summary_notes": [
                    "Follow the structured learning approach",
                    "Practice regularly for best results",
                    "Review and reinforce key concepts"
                ],
                "resources": self._build_default_resources(),
                "daily_plan": self._build_default_daily_plan(),
                "quiz": self._create_default_quiz()
            }]
        
        return modules

    def _extract_module_content(self, text: str, module_index: int, module_title: str) -> Dict[str, Any]:
        """Extract content for a specific module"""
        objectives = self._extract_module_objectives(text, module_index, module_title)
        
        summary_notes = [
            f"Focus on {module_title.lower()}",
            "Practice the concepts regularly",
            "Complete all exercises and assignments"
        ]
        
        return {
            "objectives": objectives,
            "summary_notes": summary_notes
        }

    def _extract_module_objectives(self, text: str, module_index: int, module_title: str) -> List[str]:
        """Extract objectives for a specific module"""
        objectives = []
        
        # Look for objectives in the module section
        obj_pattern = rf'Module\s+{module_index}[\s\S]*?(?:objectives?|goals?)[:\s]*([^\n]+(?:\n[-•*]\s*[^\n]+)*)'
        obj_match = re.search(obj_pattern, text, re.IGNORECASE)
        
        if obj_match:
            obj_text = obj_match.group(1)
            objectives = [obj.strip('•*- ') for obj in obj_text.split('\n') if obj.strip()]
        
        # Look for bullet points after module title
        if not objectives:
            module_section = rf'Module\s+{module_index}[:\s]*{re.escape(module_title)}(.*?)(?=Module\s+\d+|$)'
            section_match = re.search(module_section, text, re.IGNORECASE | re.DOTALL)
            if section_match:
                section_text = section_match.group(1)
                bullet_pattern = r'[-•*]\s*([^\n]+)'
                bullets = re.findall(bullet_pattern, section_text)
                if bullets:
                    objectives = bullets[:3]  # Take first 3 bullets
        
        if not objectives:
            objectives = [f"Complete {module_title} successfully"]
        
        return objectives

    def _build_resource_pack(self, resource_data: Dict[str, Any]) -> Dict[str, Any]:
        """Build a structured resource pack"""
        return {
            "youtube": resource_data.get("youtube", []),
            "courses": resource_data.get("courses", []),
            "pdfs_docs": resource_data.get("pdfs_docs", []),
            "websites": resource_data.get("websites", []),
            "practice_platforms": resource_data.get("practice_platforms", [])
        }

    def _build_default_resources(self) -> Dict[str, Any]:
        """Build default empty resource pack"""
        return {
            "youtube": [],
            "courses": [],
            "pdfs_docs": [],
            "websites": [],
            "practice_platforms": []
        }

    def _build_daily_plan(self, plan_data: Dict[str, Any]) -> Dict[str, Any]:
        """Build a structured daily plan"""
        if not plan_data:
            return self._build_default_daily_plan()
        return plan_data

    def _build_default_daily_plan(self) -> Dict[str, Any]:
        """Build default daily plan"""
        return {
            "day_1": [
                {"action": "read", "time": "30 minutes", "task": "Review course materials"},
                {"action": "practice", "time": "30 minutes", "task": "Complete exercises"}
            ]
        }

    def _build_quiz_block(self, quiz_data: Dict[str, Any]) -> Dict[str, Any]:
        """Build a structured quiz block"""
        if not quiz_data or "questions" not in quiz_data:
            return self._create_default_quiz()
        return quiz_data

    def _create_default_quiz(self) -> Dict[str, Any]:
        """Create a default quiz structure"""
        return {
            "questions": [
                {
                    "id": "q1",
                    "type": "multiple_choice",
                    "question": "What is the most important aspect of this learning module?",
                    "options": [
                        "Understanding the core concepts",
                        "Memorizing all details",
                        "Completing assignments quickly",
                        "Reading all materials"
                    ],
                    "answer": "Understanding the core concepts",
                    "explanation": "Understanding core concepts provides the foundation for applying knowledge effectively."
                },
                {
                    "id": "q2",
                    "type": "short_answer",
                    "question": "Describe how you would apply what you've learned in a real-world scenario.",
                    "key_points": [
                        "Practical application",
                        "Real-world context",
                        "Problem-solving approach"
                    ]
                }
            ]
        }

    def _extract_timeline(self, json_blocks: Dict[str, Any], text: str) -> Optional[Dict[str, Any]]:
        """Extract timeline information"""
        if "timeline" in json_blocks:
            return json_blocks["timeline"]
        
        # Try to extract dates from text
        start_date_match = re.search(r'start[_\s]*date[:\s]*([0-9-]+)', text, re.IGNORECASE)
        end_date_match = re.search(r'end[_\s]*date[:\s]*([0-9-]+)', text, re.IGNORECASE)
        
        if start_date_match or end_date_match:
            return {
                "start_date": start_date_match.group(1) if start_date_match else None,
                "end_date": end_date_match.group(1) if end_date_match else None,
                "milestones": []
            }
        
        return None

    def _enrich_lesson_content(self, lesson: Dict[str, Any], course_title: str) -> Dict[str, Any]:
        """Enrich individual lesson with AI-enhanced content"""
        lesson_number = lesson.get("lesson_number", 1)
        title = lesson.get("title", f"Lesson {lesson_number}").strip()
        
        # Ensure title is not empty
        if not title:
            title = f"Lesson {lesson_number}"
            
        topics = lesson.get("topics", [])
        duration = lesson.get("duration", "1 hour").strip()
        
        # Ensure duration is not empty
        if not duration:
            duration = "1 hour"
            
        content = lesson.get("content", "").strip()
        
        # Ensure content is not empty
        if not content:
            content = f"Learn about {title.lower()}."
        
        # Generate skill tags from lesson content
        skill_tags = self._extract_skill_tags(title, topics, content)
        
        # Generate relevant resources
        resources = self._generate_lesson_resources(title, topics, course_title)
        
        # Enhance lesson content with learning objectives
        enhanced_content = self._enhance_lesson_content_text(content, title, topics)
        
        # Generate daily plan for this lesson
        daily_plan = self._generate_daily_plan(title, duration, topics)
        
        # Create practice exercises
        practice_exercises = self._generate_practice_exercises(title, topics)
        
        return {
            "lesson_number": lesson_number,
            "title": title,
            "topics": topics if topics else [f"Core concepts of {title}"],
            "duration": duration,
            "content": enhanced_content,
            "resources": resources,
            "skill_tags": skill_tags,
            "daily_plan": daily_plan,
            "practice_exercises": practice_exercises,
            "learning_objectives": self._generate_learning_objectives(title, topics),
            "key_takeaways": self._generate_key_takeaways(title, topics, content)
        }
    
    def _extract_skill_tags(self, title: str, topics: List[str], content: str) -> List[str]:
        """Extract actionable skill tags from lesson content"""
        skill_keywords = {
            'learn', 'understand', 'master', 'create', 'build', 'implement', 'develop',
            'analyze', 'design', 'configure', 'optimize', 'troubleshoot', 'deploy',
            'practice', 'apply', 'execute', 'manage', 'evaluate', 'synthesize'
        }
        
        # Combine all text sources
        all_text = f"{title} {' '.join(topics)} {content}".lower()
        
        # Extract skill verbs that appear in the content
        found_skills = []
        for skill in skill_keywords:
            if skill in all_text:
                found_skills.append(skill)
        
        # Add domain-specific skills based on content
        if any(term in all_text for term in ['python', 'programming', 'code']):
            found_skills.extend(['code', 'debug', 'program'])
        if any(term in all_text for term in ['machine learning', 'ai', 'model']):
            found_skills.extend(['train', 'predict', 'model'])
        if any(term in all_text for term in ['data', 'analysis', 'visualization']):
            found_skills.extend(['analyze', 'visualize', 'interpret'])
        if any(term in all_text for term in ['web', 'html', 'css', 'javascript']):
            found_skills.extend(['design', 'style', 'interact'])
        
        # Remove duplicates and limit to 6 skills
        return list(set(found_skills))[:6] if found_skills else ['learn', 'practice', 'apply']
    
    def _generate_lesson_resources(self, title: str, topics: List[str], course_title: str) -> List[str]:
        """Generate relevant learning resources for the lesson"""
        resources = []
        
        # Generate resource URLs based on lesson content
        title_keywords = title.lower().replace(' ', '+')
        course_keywords = course_title.lower().replace(' ', '+')
        
        # Educational video resources
        resources.append(f"https://www.youtube.com/results?search_query={title_keywords}+tutorial")
        
        # Documentation resources based on topics
        for topic in topics[:2]:  # Limit to first 2 topics
            topic_clean = topic.lower().replace(' ', '+').replace(',', '')
            if len(topic_clean) > 3:
                resources.append(f"https://www.google.com/search?q={topic_clean}+documentation")
        
        # Course-specific resources
        if any(term in course_title.lower() for term in ['python', 'programming']):
            resources.append("https://docs.python.org/3/tutorial/")
            resources.append("https://realpython.com")
        elif any(term in course_title.lower() for term in ['machine learning', 'ai']):
            resources.append("https://scikit-learn.org/stable/user_guide.html")
            resources.append("https://kaggle.com/learn")
        elif any(term in course_title.lower() for term in ['web', 'javascript', 'react']):
            resources.append("https://developer.mozilla.org/en-US/docs/Web")
            resources.append("https://reactjs.org/tutorial/tutorial.html")
        elif any(term in course_title.lower() for term in ['data', 'analytics']):
            resources.append("https://pandas.pydata.org/docs/user_guide/")
            resources.append("https://matplotlib.org/tutorials/")
        
        # Generic learning resources
        resources.append(f"https://www.coursera.org/search?query={course_keywords}")
        
        return resources[:5]  # Limit to 5 resources
    
    def _enhance_lesson_content_text(self, content: str, title: str, topics: List[str]) -> str:
        """Enhance lesson content with learning context"""
        if not content or len(content.strip()) < 20:
            content = f"This lesson covers {title.lower()}."
        
        # Add learning context
        enhanced_content = f"**Learning Focus: {title}**\n\n"
        enhanced_content += content
        
        # Add topic breakdown if topics exist
        if topics:
            enhanced_content += f"\n\n**Key Topics Covered:**\n"
            for topic in topics[:5]:  # Limit to 5 topics
                enhanced_content += f"• {topic}\n"
        
        # Add practical application note
        enhanced_content += f"\n\n**Practical Application:**\n"
        enhanced_content += f"Apply the concepts from {title.lower()} through hands-on exercises and real-world examples."
        
        return enhanced_content
    
    def _generate_daily_plan(self, title: str, duration: str, topics: List[str]) -> Dict[str, List[Dict[str, str]]]:
        """Generate a daily learning plan for the lesson"""
        duration_hours = self._parse_duration_to_hours(duration)
        
        if duration_hours <= 1:
            # Single session plan
            return {
                "day_1": [
                    {"action": "read", "time": "20 minutes", "task": f"Review {title} concepts"},
                    {"action": "practice", "time": "25 minutes", "task": "Complete hands-on exercises"},
                    {"action": "review", "time": "15 minutes", "task": "Summarize key learnings"}
                ]
            }
        elif duration_hours <= 3:
            # Two session plan
            return {
                "day_1": [
                    {"action": "read", "time": "45 minutes", "task": f"Study {title} fundamentals"},
                    {"action": "practice", "time": "30 minutes", "task": "Work through examples"}
                ],
                "day_2": [
                    {"action": "practice", "time": "45 minutes", "task": "Complete practical exercises"},
                    {"action": "review", "time": "30 minutes", "task": "Review and reinforce concepts"}
                ]
            }
        else:
            # Extended plan
            return {
                "day_1": [
                    {"action": "read", "time": "60 minutes", "task": f"Introduction to {title}"},
                    {"action": "practice", "time": "30 minutes", "task": "Basic exercises"}
                ],
                "day_2": [
                    {"action": "practice", "time": "60 minutes", "task": "Intermediate exercises"},
                    {"action": "project", "time": "30 minutes", "task": "Start mini-project"}
                ],
                "day_3": [
                    {"action": "project", "time": "60 minutes", "task": "Complete mini-project"},
                    {"action": "review", "time": "30 minutes", "task": "Final review and assessment"}
                ]
            }
    
    def _generate_practice_exercises(self, title: str, topics: List[str]) -> List[Dict[str, str]]:
        """Generate practice exercises for the lesson"""
        exercises = []
        
        # Create exercises based on topics
        for i, topic in enumerate(topics[:3], 1):  # Limit to 3 exercises
            exercises.append({
                "exercise_number": i,
                "title": f"Practice {topic}",
                "description": f"Apply your knowledge of {topic.lower()} through practical implementation.",
                "difficulty": "beginner" if i == 1 else "intermediate" if i == 2 else "advanced",
                "estimated_time": "15-30 minutes"
            })
        
        # If no topics, create a general exercise
        if not exercises:
            exercises.append({
                "exercise_number": 1,
                "title": f"Practice {title}",
                "description": f"Complete hands-on exercises related to {title.lower()}.",
                "difficulty": "beginner",
                "estimated_time": "20-30 minutes"
            })
        
        return exercises
    
    def _generate_learning_objectives(self, title: str, topics: List[str]) -> List[str]:
        """Generate specific learning objectives for the lesson"""
        objectives = []
        
        # Create objectives based on topics
        for topic in topics[:4]:  # Limit to 4 objectives
            objectives.append(f"Understand and apply {topic.lower()}")
        
        # Add general objectives if no topics or need more
        if len(objectives) < 2:
            objectives.extend([
                f"Master the core concepts of {title.lower()}",
                f"Apply {title.lower()} in practical scenarios"
            ])
        
        # Add a synthesis objective
        objectives.append(f"Integrate {title.lower()} knowledge with previous lessons")
        
        return objectives[:4]  # Limit to 4 objectives
    
    def _generate_key_takeaways(self, title: str, topics: List[str], content: str) -> List[str]:
        """Generate key takeaways from the lesson"""
        takeaways = []
        
        # Extract key points from topics
        for topic in topics[:3]:
            takeaways.append(f"{topic} is essential for {title.lower()}")
        
        # Add general takeaways
        takeaways.extend([
            f"Consistent practice of {title.lower()} improves proficiency",
            f"Real-world application reinforces {title.lower()} concepts"
        ])
        
        return takeaways[:4]  # Limit to 4 takeaways
    
    def _parse_duration_to_hours(self, duration: str) -> float:
        """Parse duration string to hours as float"""
        if not duration:
            return 1.0
        
        duration_lower = duration.lower()
        
        # Extract numbers
        import re
        numbers = re.findall(r'\d+', duration_lower)
        if not numbers:
            return 1.0
        
        time_value = float(numbers[0])
        
        # Convert to hours
        if 'minute' in duration_lower:
            return time_value / 60
        elif 'hour' in duration_lower:
            return time_value
        elif 'day' in duration_lower:
            return time_value * 8  # 8 hours per day
        else:
            return time_value  # Assume hours
    
    def _enhance_course_description(self, description: str, course_title: str) -> str:
        """Enhance course description with additional context"""
        if not description or description == "A comprehensive learning course extracted from PDF content.":
            description = f"A comprehensive {course_title.lower()} course designed to build practical skills through hands-on learning."
        
        # Add enhancement
        enhanced = f"{description}\n\nThis course combines theoretical knowledge with practical application, "
        enhanced += "featuring interactive lessons, real-world projects, and comprehensive resources to ensure effective learning."
        
        return enhanced
    
    def _extract_skill_categories(self, lessons: List[Dict[str, Any]]) -> List[str]:
        """Extract unique skill categories from all lessons"""
        categories = set()
        for lesson in lessons:
            skill_tags = lesson.get("skill_tags", [])
            categories.update(skill_tags)
        return list(categories)[:10]  # Limit to 10 categories
    
    def _assess_difficulty_level(self, lessons: List[Dict[str, Any]]) -> str:
        """Assess overall course difficulty based on lessons"""
        total_duration = sum(self._parse_duration_to_hours(lesson.get("duration", "1 hour")) for lesson in lessons)
        total_topics = sum(len(lesson.get("topics", [])) for lesson in lessons)
        
        if total_duration <= 5 and total_topics <= 10:
            return "Beginner"
        elif total_duration <= 20 and total_topics <= 30:
            return "Intermediate"
        else:
            return "Advanced"
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def _create_fallback_lesson(self, lesson: Dict[str, Any]) -> Dict[str, Any]:
        """Create a fallback enriched lesson when enrichment fails"""
        lesson_number = lesson.get("lesson_number", 1)
        title = lesson.get("title", f"Lesson {lesson_number}")
        
        return {
            "lesson_number": lesson_number,
            "title": title,
            "topics": lesson.get("topics", [f"Core concepts of {title}"]),
            "duration": lesson.get("duration", "1 hour"),
            "content": lesson.get("content", f"Learn about {title.lower()}."),
            "resources": [f"https://www.google.com/search?q={title.replace(' ', '+')}+tutorial"],
            "skill_tags": ["learn", "practice", "apply"],
            "daily_plan": {
                "day_1": [
                    {"action": "read", "time": "30 minutes", "task": f"Study {title}"},
                    {"action": "practice", "time": "30 minutes", "task": "Complete exercises"}
                ]
            },
            "practice_exercises": [{
                "exercise_number": 1,
                "title": f"Practice {title}",
                "description": f"Apply {title.lower()} concepts.",
                "difficulty": "beginner",
                "estimated_time": "20 minutes"
            }],
            "learning_objectives": [f"Understand {title.lower()}"],
            "key_takeaways": [f"{title} is important for overall learning progress"]
        }
    
    def _create_default_enriched_lesson(self, course_title: str) -> Dict[str, Any]:
        """Create a default enriched lesson when no lessons are found"""
        return {
            "lesson_number": 1,
            "title": "Introduction to Course",
            "topics": [f"Overview of {course_title}", "Learning objectives", "Course structure"],
            "duration": "1 hour",
            "content": f"This introductory lesson provides an overview of the {course_title} course and sets expectations for learning.",
            "resources": [
                f"https://www.google.com/search?q={course_title.replace(' ', '+')}+introduction",
                "https://www.coursera.org",
                "https://www.edx.org"
            ],
            "skill_tags": ["learn", "understand", "overview"],
            "daily_plan": {
                "day_1": [
                    {"action": "read", "time": "30 minutes", "task": "Course overview"},
                    {"action": "plan", "time": "30 minutes", "task": "Set learning goals"}
                ]
            },
            "practice_exercises": [{
                "exercise_number": 1,
                "title": "Course Planning",
                "description": "Create a personal learning plan for the course.",
                "difficulty": "beginner",
                "estimated_time": "15 minutes"
            }],
            "learning_objectives": [
                f"Understand the scope of {course_title}",
                "Set personal learning goals",
                "Familiarize with course structure"
            ],
            "key_takeaways": [
                f"{course_title} requires structured learning approach",
                "Setting clear goals improves learning outcomes"
            ]
        }
    
    def _create_fallback_course_structure(self, original_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a safe fallback course structure when enrichment fails completely"""
        course_title = original_data.get("course_title", "Learning Course")
        
        return {
            "course_title": course_title,
            "course_description": f"A structured learning course for {course_title.lower()}.",
            "lessons": [self._create_default_enriched_lesson(course_title)],
            "meta": {
                "total_lessons": 1,
                "estimated_hours": 1.0,
                "skill_categories": ["learn", "practice"],
                "difficulty_level": "Beginner",
                "enrichment_timestamp": self._get_timestamp(),
                "fallback_used": True
            }
        }