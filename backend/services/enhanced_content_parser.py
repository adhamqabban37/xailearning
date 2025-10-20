#!/usr/bin/env python3
"""
Enhanced Content Parser Implementation
Complete solution for real-world PDF processing with OCR fallback

This implementation addresses:
1. Expanded module detection patterns (Week, Chapter, Day, Lesson, numbered lists)
2. OCR fallback for scanned PDFs
3. Comprehensive testing and validation
4. Production-ready error handling and monitoring
"""

import re
import json
import PyPDF2
import pdfplumber
from io import BytesIO
from typing import Dict, List, Any, Optional, Tuple
from pydantic import ValidationError
import logging

# Set up logging for monitoring
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ParseError(Exception):
    """Custom exception for parsing errors with detailed context"""
    def __init__(self, message: str, error_type: str = "parse_error", context: Dict = None):
        self.message = message
        self.error_type = error_type
        self.context = context or {}
        super().__init__(self.message)

class EnhancedContentParser:
    """
    Production-ready content parser with enhanced module detection and OCR fallback.
    
    Features:
    - 10+ module detection patterns (Week, Chapter, Day, Lesson, numbered lists)
    - OCR fallback for scanned PDFs
    - Intelligent pattern validation
    - Comprehensive error handling and logging
    - Processing quality metrics
    """
    
    def __init__(self):
        # Enhanced module detection patterns (ordered by specificity and reliability)
        self.module_patterns = [
            {
                'name': 'module',
                'pattern': r'Module\s+(\d+)[:\s]*([^\n]+)',
                'priority': 1,
                'description': 'Standard module format: Module 1: Title'
            },
            {
                'name': 'week',
                'pattern': r'Week\s+(\d+)[:\s]*([^\n]+)',
                'priority': 2,
                'description': 'Weekly format: Week 1: Title'
            },
            {
                'name': 'chapter',
                'pattern': r'Chapter\s+(\d+)[:\s]*([^\n]+)',
                'priority': 3,
                'description': 'Chapter format: Chapter 1: Title'
            },
            {
                'name': 'lesson',
                'pattern': r'Lesson\s+(\d+)[:\s]*([^\n]+)',
                'priority': 4,
                'description': 'Lesson format: Lesson 1: Title'
            },
            {
                'name': 'day',
                'pattern': r'Day\s+(\d+)[:\s]*([^\n]+)',
                'priority': 5,
                'description': 'Daily format: Day 1: Title'
            },
            {
                'name': 'part',
                'pattern': r'Part\s+(\d+)[:\s]*([^\n]+)',
                'priority': 6,
                'description': 'Part format: Part 1: Title'
            },
            {
                'name': 'section',
                'pattern': r'Section\s+(\d+)[:\s]*([^\n]+)',
                'priority': 7,
                'description': 'Section format: Section 1: Title'
            },
            {
                'name': 'unit',
                'pattern': r'Unit\s+(\d+)[:\s]*([^\n]+)',
                'priority': 8,
                'description': 'Unit format: Unit 1: Title'
            },
            {
                'name': 'numbered_dot',
                'pattern': r'^(\d+)\.\s*([^\n]+)',
                'priority': 9,
                'description': 'Numbered list with dots: 1. Title'
            },
            {
                'name': 'numbered_paren',
                'pattern': r'^(\d+)\)\s*([^\n]+)',
                'priority': 10,
                'description': 'Numbered list with parentheses: 1) Title'
            },
            {
                'name': 'numbered_dash',
                'pattern': r'^(\d+)\s*[-–]\s*([^\n]+)',
                'priority': 11,
                'description': 'Numbered list with dashes: 1 - Title'
            }
        ]
        
        # JSON detection patterns for structured content
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
            ]
        }
        
        # Processing metrics
        self.processing_stats = {
            'total_processed': 0,
            'successful_parses': 0,
            'ocr_fallbacks': 0,
            'pattern_usage': {},
            'common_errors': {}
        }
    
    def extract_text_from_pdf_with_ocr(self, pdf_bytes: bytes, use_ocr_threshold: int = 100) -> Tuple[str, Dict]:
        """
        Enhanced PDF text extraction with intelligent OCR fallback.
        
        Args:
            pdf_bytes: PDF file content as bytes
            use_ocr_threshold: Minimum characters before considering OCR (default: 100)
            
        Returns:
            Tuple of (extracted_text, processing_info)
            
        Raises:
            ParseError: If all extraction methods fail
        """
        processing_info = {
            'method_used': 'unknown',
            'text_length': 0,
            'pages_processed': 0,
            'ocr_used': False,
            'warnings': []
        }
        
        text = ""
        
        try:
            # Method 1: Try PyPDF2 for standard PDFs
            logger.info("Attempting text extraction with PyPDF2...")
            pdf_file = BytesIO(pdf_bytes)
            reader = PyPDF2.PdfReader(pdf_file)
            processing_info['pages_processed'] = len(reader.pages)
            
            for page_num, page in enumerate(reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text and page_text.strip():
                        text += page_text + "\n"
                except Exception as e:
                    logger.warning(f"PyPDF2 failed on page {page_num}: {e}")
                    processing_info['warnings'].append(f"Page {page_num} extraction failed")
            
            if text.strip() and len(text.strip()) >= use_ocr_threshold:
                processing_info['method_used'] = 'PyPDF2'
                processing_info['text_length'] = len(text)
                logger.info(f"PyPDF2 successful: {len(text)} characters extracted")
                return text, processing_info
                
        except Exception as e:
            logger.warning(f"PyPDF2 completely failed: {e}")
            processing_info['warnings'].append(f"PyPDF2 failed: {e}")
        
        try:
            # Method 2: Try pdfplumber for better text extraction
            logger.info("Attempting text extraction with pdfplumber...")
            pdf_file = BytesIO(pdf_bytes)
            with pdfplumber.open(pdf_file) as pdf:
                processing_info['pages_processed'] = len(pdf.pages)
                
                for page_num, page in enumerate(pdf.pages):
                    try:
                        page_text = page.extract_text()
                        if page_text and page_text.strip():
                            text += page_text + "\n"
                    except Exception as e:
                        logger.warning(f"pdfplumber failed on page {page_num}: {e}")
                        processing_info['warnings'].append(f"Page {page_num} pdfplumber failed")
            
            if text.strip() and len(text.strip()) >= use_ocr_threshold:
                processing_info['method_used'] = 'pdfplumber'
                processing_info['text_length'] = len(text)
                logger.info(f"pdfplumber successful: {len(text)} characters extracted")
                return text, processing_info
                
        except Exception as e:
            logger.warning(f"pdfplumber completely failed: {e}")
            processing_info['warnings'].append(f"pdfplumber failed: {e}")
        
        # Method 3: OCR fallback for scanned PDFs
        if len(text.strip()) < use_ocr_threshold:
            logger.info("Minimal text extracted. Attempting OCR fallback...")
            try:
                ocr_text, ocr_info = self._extract_text_with_ocr(pdf_bytes)
                if len(ocr_text.strip()) > len(text.strip()):
                    processing_info.update(ocr_info)
                    processing_info['ocr_used'] = True
                    processing_info['method_used'] = 'OCR'
                    self.processing_stats['ocr_fallbacks'] += 1
                    logger.info(f"OCR successful: {len(ocr_text)} characters extracted")
                    return ocr_text, processing_info
            except Exception as e:
                logger.error(f"OCR fallback failed: {e}")
                processing_info['warnings'].append(f"OCR failed: {e}")
        
        # Final attempt: return what we have or fail
        if text.strip():
            processing_info['method_used'] = 'partial'
            processing_info['text_length'] = len(text)
            processing_info['warnings'].append("Limited text extracted - results may be incomplete")
            logger.warning(f"Only {len(text)} characters extracted - proceeding with limited content")
            return text, processing_info
            
        # Complete failure
        error_context = {
            'file_size': len(pdf_bytes),
            'processing_info': processing_info
        }
        raise ParseError(
            "No text could be extracted from PDF. The document may be:",
            "pdf_extraction_failed",
            error_context
        )
    
    def _extract_text_with_ocr(self, pdf_bytes: bytes) -> Tuple[str, Dict]:
        """
        Extract text using OCR for scanned PDFs.
        
        Dependencies required:
        - pip install pytesseract PyMuPDF Pillow
        - System: Tesseract OCR engine
        
        Returns:
            Tuple of (ocr_text, ocr_processing_info)
        """
        try:
            import fitz  # PyMuPDF
            import pytesseract
            from PIL import Image
            import io
            
            # Configure tesseract path for Windows
            import platform
            if platform.system() == 'Windows':
                import os
                tesseract_paths = [
                    r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                    r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe'
                ]
                for path in tesseract_paths:
                    if os.path.exists(path):
                        pytesseract.pytesseract.tesseract_cmd = path
                        break
                        
        except ImportError as e:
            missing_lib = str(e).split("'")[1] if "'" in str(e) else "unknown"
            dependencies = {
                'fitz': 'PyMuPDF',
                'pytesseract': 'pytesseract', 
                'PIL': 'Pillow'
            }
            lib_name = dependencies.get(missing_lib, missing_lib)
            raise ParseError(
                f"OCR dependencies not installed. Run: pip install {lib_name}",
                "ocr_dependencies_missing",
                {'missing_library': lib_name}
            )
        
        ocr_info = {
            'pages_processed': 0,
            'images_processed': 0,
            'ocr_confidence_avg': 0,
            'processing_time': 0
        }
        
        ocr_text = ""
        
        try:
            import time
            start_time = time.time()
            
            # Open PDF with PyMuPDF
            pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            ocr_info['pages_processed'] = len(pdf_doc)
            
            for page_num in range(len(pdf_doc)):
                page = pdf_doc[page_num]
                
                # Check for selectable text first (hybrid documents)
                page_text = page.get_text()
                if page_text and len(page_text.strip()) > 50:
                    ocr_text += page_text + "\n"
                    continue
                
                # Extract and process images
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
                                
                                # Enhance image for better OCR
                                img_pil = self._enhance_image_for_ocr(img_pil)
                                
                                # Run OCR with configuration
                                ocr_config = '--psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,;:!?-'
                                img_text = pytesseract.image_to_string(img_pil, config=ocr_config)
                                
                                if img_text.strip():
                                    ocr_text += img_text + "\n"
                                    ocr_info['images_processed'] += 1
                            
                            pix = None  # Free memory
                            
                        except Exception as e:
                            logger.warning(f"OCR failed for image {img_index} on page {page_num}: {e}")
                            continue
                else:
                    # No images found, render entire page as image
                    try:
                        mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better OCR
                        pix = page.get_pixmap(matrix=mat)
                        img_data = pix.tobytes("png")
                        img_pil = Image.open(io.BytesIO(img_data))
                        
                        # Enhance and run OCR
                        img_pil = self._enhance_image_for_ocr(img_pil)
                        page_text = pytesseract.image_to_string(img_pil, config='--psm 6')
                        
                        if page_text.strip():
                            ocr_text += page_text + "\n"
                            ocr_info['images_processed'] += 1
                        
                        pix = None  # Free memory
                        
                    except Exception as e:
                        logger.warning(f"OCR failed for rendered page {page_num}: {e}")
                        continue
            
            pdf_doc.close()
            ocr_info['processing_time'] = time.time() - start_time
            
        except Exception as e:
            raise ParseError(f"OCR processing failed: {e}", "ocr_failed")
        
        if not ocr_text.strip():
            raise ParseError("OCR completed but no text was extracted", "ocr_no_text")
            
        return ocr_text, ocr_info
    
    def _enhance_image_for_ocr(self, image):
        """Enhance image quality for better OCR results"""
        try:
            from PIL import ImageEnhance, ImageFilter
            
            # Convert to grayscale if needed
            if image.mode != 'L':
                image = image.convert('L')
            
            # Enhance contrast
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.5)
            
            # Enhance sharpness
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(2.0)
            
            # Apply slight blur to reduce noise
            image = image.filter(ImageFilter.MedianFilter())
            
            return image
        except Exception:
            # If enhancement fails, return original
            return image
    
    def detect_module_patterns(self, text: str) -> Tuple[List[re.Match], str, Dict]:
        """
        Enhanced module detection with comprehensive pattern matching.
        
        Returns:
            Tuple of (matches, pattern_name, detection_info)
        """
        detection_info = {
            'patterns_tested': 0,
            'valid_patterns_found': 0,
            'pattern_scores': {},
            'validation_details': {}
        }
        
        valid_pattern_results = []
        
        # Test each pattern and collect valid results
        for pattern_info in self.module_patterns:
            detection_info['patterns_tested'] += 1
            pattern = pattern_info['pattern']
            pattern_name = pattern_info['name']
            
            # Choose appropriate regex flags
            flags = re.IGNORECASE | re.MULTILINE if pattern.startswith('^') else re.IGNORECASE
            
            matches = list(re.finditer(pattern, text, flags))
            
            if len(matches) < 1:
                continue
            
            # Validate matches with detailed scoring
            validation_result = self._validate_module_matches(matches, text, pattern_name)
            detection_info['validation_details'][pattern_name] = validation_result
            
            if validation_result['is_valid']:
                score = validation_result['score']
                valid_pattern_results.append({
                    'name': pattern_name,
                    'matches': matches,
                    'priority': pattern_info['priority'],
                    'count': len(matches),
                    'score': score,
                    'description': pattern_info['description']
                })
                detection_info['pattern_scores'][pattern_name] = score
                detection_info['valid_patterns_found'] += 1
        
        # Choose best pattern using sophisticated scoring
        if not valid_pattern_results:
            return [], 'default', detection_info
        
        # Sort by: 1) score (descending), 2) match count (descending), 3) priority (ascending)
        best_result = sorted(
            valid_pattern_results, 
            key=lambda x: (-x['score'], -x['count'], x['priority'])
        )[0]
        
        # Update usage statistics
        pattern_name = best_result['name']
        if pattern_name in self.processing_stats['pattern_usage']:
            self.processing_stats['pattern_usage'][pattern_name] += 1
        else:
            self.processing_stats['pattern_usage'][pattern_name] = 1
        
        logger.info(f"Selected pattern '{pattern_name}' with {best_result['count']} matches (score: {best_result['score']:.2f})")
        
        return best_result['matches'], pattern_name, detection_info
    
    def _validate_module_matches(self, matches: List[re.Match], text: str, pattern_name: str) -> Dict:
        """
        Comprehensive validation of module matches with detailed scoring.
        
        Returns:
            Dict with validation results and scoring details
        """
        validation_result = {
            'is_valid': False,
            'score': 0.0,
            'issues': [],
            'strengths': [],
            'match_quality': {}
        }
        
        if len(matches) == 0:
            validation_result['issues'].append("No matches found")
            return validation_result
        
        score = 0.0
        max_score = 100.0
        
        # Test 1: Sequence validation for numbered patterns (30 points)
        if pattern_name.startswith('numbered'):
            sequence_score, sequence_issues = self._validate_number_sequence(matches)
            score += sequence_score * 0.3
            if sequence_issues:
                validation_result['issues'].extend(sequence_issues)
            else:
                validation_result['strengths'].append("Sequential numbering")
        else:
            score += 30  # Non-numbered patterns get full score for this test
            validation_result['strengths'].append("Named pattern (not dependent on sequence)")
        
        # Test 2: Spacing validation (25 points)
        spacing_score, spacing_issues = self._validate_match_spacing(matches)
        score += spacing_score * 0.25
        if spacing_issues:
            validation_result['issues'].extend(spacing_issues)
        else:
            validation_result['strengths'].append("Appropriate spacing between matches")
        
        # Test 3: Title quality validation (25 points)
        title_score, title_issues = self._validate_title_quality(matches)
        score += title_score * 0.25
        if title_issues:
            validation_result['issues'].extend(title_issues)
        else:
            validation_result['strengths'].append("High-quality titles")
        
        # Test 4: Content density validation (20 points)
        density_score, density_issues = self._validate_content_density(matches, text)
        score += density_score * 0.20
        if density_issues:
            validation_result['issues'].extend(density_issues)
        else:
            validation_result['strengths'].append("Appropriate content density")
        
        validation_result['score'] = score
        validation_result['is_valid'] = score >= 60.0  # Threshold for validity
        
        return validation_result
    
    def _validate_number_sequence(self, matches: List[re.Match]) -> Tuple[float, List[str]]:
        """Validate number sequences for numbered patterns"""
        issues = []
        
        try:
            numbers = []
            for match in matches:
                num = int(match.group(1))
                numbers.append(num)
            
            numbers.sort()
            
            # Should start from 1
            if numbers[0] != 1:
                issues.append(f"Sequence starts from {numbers[0]}, not 1")
                return 0.0, issues
            
            # Check for gaps
            gaps = sum(1 for i in range(1, len(numbers)) if numbers[i] != numbers[i-1] + 1)
            gap_ratio = gaps / len(numbers)
            
            if gap_ratio > 0.3:  # More than 30% gaps
                issues.append(f"Too many gaps in sequence ({gap_ratio:.1%})")
                return max(0.0, 100 - gap_ratio * 200), issues
            
            return 100.0, []
            
        except (ValueError, IndexError):
            issues.append("Invalid number format in sequence")
            return 0.0, issues
    
    def _validate_match_spacing(self, matches: List[re.Match]) -> Tuple[float, List[str]]:
        """Validate spacing between matches"""
        issues = []
        
        if len(matches) < 2:
            return 100.0, []  # Single match always valid
        
        positions = [match.start() for match in matches]
        distances = [positions[i+1] - positions[i] for i in range(len(positions)-1)]
        
        min_distance = min(distances)
        avg_distance = sum(distances) / len(distances)
        
        # Minimum spacing threshold
        if min_distance < 30:
            issues.append(f"Matches too close together (min: {min_distance} chars)")
            return max(0.0, min_distance * 2), issues
        
        # Check for reasonable distribution
        if max(distances) > avg_distance * 5:
            issues.append("Uneven distribution of matches")
            return 70.0, issues
        
        return 100.0, []
    
    def _validate_title_quality(self, matches: List[re.Match]) -> Tuple[float, List[str]]:
        """Validate quality of extracted titles"""
        issues = []
        valid_titles = 0
        
        for match in matches:
            title = match.group(2).strip() if len(match.groups()) >= 2 else ""
            
            # Check title length
            if 3 <= len(title) <= 150:
                valid_titles += 1
            elif len(title) < 3:
                issues.append(f"Title too short: '{title}'")
            elif len(title) > 150:
                issues.append(f"Title too long: '{title[:50]}...'")
        
        validity_ratio = valid_titles / len(matches)
        
        if validity_ratio < 0.5:
            issues.append(f"Only {validity_ratio:.1%} of titles are valid length")
        
        return validity_ratio * 100, issues
    
    def _validate_content_density(self, matches: List[re.Match], text: str) -> Tuple[float, List[str]]:
        """Validate content density around matches"""
        issues = []
        
        if len(matches) < 2:
            return 100.0, []
        
        # Calculate average content between matches
        content_lengths = []
        for i in range(len(matches) - 1):
            start = matches[i].end()
            end = matches[i + 1].start()
            content = text[start:end].strip()
            content_lengths.append(len(content))
        
        if not content_lengths:
            return 100.0, []
        
        avg_content_length = sum(content_lengths) / len(content_lengths)
        
        # Expect reasonable content between modules
        if avg_content_length < 50:
            issues.append(f"Very little content between matches (avg: {avg_content_length} chars)")
            return max(20.0, avg_content_length), issues
        
        if avg_content_length > 5000:
            issues.append(f"Excessive content between matches (avg: {avg_content_length} chars)")
            return 80.0, issues
        
        return 100.0, []
    
    def parse_pdf_with_ocr(self, file_bytes: bytes, filename: str = "document.pdf") -> Dict[str, Any]:
        """
        Complete PDF processing pipeline with enhanced parsing and OCR fallback.
        
        This is the main entry point for processing PDFs with all enhancements.
        
        Args:
            file_bytes: PDF file content as bytes
            filename: Original filename for reference
            
        Returns:
            Dict containing parsed course structure and processing metadata
            
        Raises:
            ParseError: If PDF processing fails completely
        """
        self.processing_stats['total_processed'] += 1
        
        try:
            # Step 1: Extract text with OCR fallback
            logger.info(f"Processing PDF: {filename}")
            text, extraction_info = self.extract_text_from_pdf_with_ocr(file_bytes)
            
            # Step 2: Parse the extracted text into course structure
            result = self.parse_course_content(text, filename)
            
            # Step 3: Add comprehensive processing metadata
            result['processing_info'] = {
                'filename': filename,
                'file_size_bytes': len(file_bytes),
                'extraction_info': extraction_info,
                'text_length': len(text),
                'modules_detected': len(result.get('modules', [])),
                'pattern_used': getattr(self, '_last_pattern_used', 'default'),
                'processing_timestamp': self._get_timestamp(),
                'parser_version': '2.0_enhanced'
            }
            
            # Step 4: Quality assessment
            quality_assessment = self._assess_parsing_quality(result, text)
            result['quality_assessment'] = quality_assessment
            
            self.processing_stats['successful_parses'] += 1
            logger.info(f"Successfully processed {filename}: {len(result.get('modules', []))} modules detected")
            
            return result
            
        except ParseError:
            raise  # Re-raise ParseError as-is
        except Exception as e:
            error_context = {
                'filename': filename,
                'file_size': len(file_bytes),
                'processing_stats': self.processing_stats
            }
            logger.error(f"Unexpected error processing {filename}: {e}")
            raise ParseError(f"Unexpected error processing PDF: {e}", "processing_failed", error_context)
    
    def parse_course_content(self, text: str, filename: str) -> Dict[str, Any]:
        """
        Enhanced course content parsing with improved module detection.
        
        Args:
            text: Extracted text content
            filename: Source filename for reference
            
        Returns:
            Dict containing parsed course structure
        """
        # Step 1: Detect module patterns
        module_matches, pattern_used, detection_info = self.detect_module_patterns(text)
        self._last_pattern_used = pattern_used
        
        # Step 2: Extract course metadata
        course_meta = self._extract_course_metadata(text, filename)
        
        # Step 3: Parse modules based on detected pattern
        if module_matches:
            modules = self._parse_detected_modules(text, module_matches, pattern_used)
        else:
            # Fallback: create single comprehensive module
            modules = self._create_fallback_module(text, filename)
        
        # Step 4: Build final result structure
        result = {
            'meta': course_meta,
            'modules': modules,
            'detection_info': detection_info,
            'processing_summary': {
                'pattern_used': pattern_used,
                'modules_found': len(modules),
                'structured': len(module_matches) > 0,
                'fallback_used': len(module_matches) == 0
            }
        }
        
        return result
    
    def _extract_course_metadata(self, text: str, filename: str) -> Dict[str, Any]:
        """Extract course metadata from text"""
        
        # Extract title with multiple patterns
        title_patterns = [
            r'(?:Course|Class|Training|Tutorial|Workshop)[:\s]*([^\n]+)',
            r'# ([^\n]+)',
            r'## ([^\n]+)',
            r'Title:\s*([^\n]+)',
            r'^([A-Z][^.!?\n]{10,100})$'  # Standalone title-like lines
        ]
        
        title = "AI Learning Roadmap"  # Default
        for pattern in title_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                candidate = match.group(1).strip()
                if 5 <= len(candidate) <= 100:  # Reasonable title length
                    title = candidate
                    break
        
        # Extract other metadata
        level_match = re.search(r'Level:\s*([^\n]+)', text, re.IGNORECASE)
        level = level_match.group(1).strip() if level_match else "Beginner to Intermediate"
        
        duration_match = re.search(r'Duration:\s*([^\n]+)', text, re.IGNORECASE)
        duration = duration_match.group(1).strip() if duration_match else "Self-paced"
        
        # Extract key skills from content
        key_skills = self._extract_key_skills(text)
        
        return {
            'title': title,
            'level': level,
            'duration': duration,
            'key_skills': key_skills,
            'source_filename': filename,
            'extracted_from': 'enhanced_parser_v2'
        }
    
    def _parse_detected_modules(self, text: str, matches: List[re.Match], pattern_used: str) -> List[Dict[str, Any]]:
        """Parse modules based on detected pattern matches"""
        modules = []
        
        for i, match in enumerate(matches):
            module_number = match.group(1)
            module_title = match.group(2).strip()
            
            # Extract content for this module
            module_content = self._extract_module_content(text, match, matches, i)
            
            # Build module structure
            module = {
                "index": int(module_number) if module_number.isdigit() else i + 1,
                "title": module_title,
                "objectives": module_content.get("objectives", []),
                "summary_notes": module_content.get("summary_notes", []),
                "resources": self._build_default_resources(),
                "daily_plan": self._build_default_daily_plan(),
                "quiz": self._create_default_quiz(),
                "content_preview": module_content.get("preview", "")
            }
            
            modules.append(module)
        
        return modules
    
    def _extract_module_content(self, text: str, current_match: re.Match, all_matches: List[re.Match], match_index: int) -> Dict[str, Any]:
        """Extract content for a specific module"""
        
        # Determine content boundaries
        start_pos = current_match.end()
        if match_index + 1 < len(all_matches):
            end_pos = all_matches[match_index + 1].start()
        else:
            end_pos = len(text)
        
        module_text = text[start_pos:end_pos].strip()
        
        # Extract objectives
        objectives = self._extract_objectives_from_text(module_text)
        
        # Generate summary notes
        summary_notes = self._generate_summary_notes(module_text, current_match.group(2))
        
        # Create content preview
        preview = module_text[:200] + "..." if len(module_text) > 200 else module_text
        
        return {
            "objectives": objectives,
            "summary_notes": summary_notes,
            "preview": preview,
            "content_length": len(module_text)
        }
    
    def _extract_objectives_from_text(self, text: str) -> List[str]:
        """Extract learning objectives from module text"""
        objectives = []
        
        # Multiple patterns for objectives
        objective_patterns = [
            r'[•·*-]\s*([^\n]+)',  # Bullet points
            r'\d+\.\s*([^\n]+)',   # Numbered lists
            r'[a-z]\)\s*([^\n]+)', # Lettered lists
            r'(?:Learn|Understand|Master|Explore|Build|Create|Develop|Study|Practice)\s*([^\n.]+)', # Action verbs
            r'(?:Objective|Goal|Aim|Target)[:\s]*([^\n]+)', # Explicit objectives
        ]
        
        for pattern in objective_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                objective = match.strip()
                if 10 <= len(objective) <= 200 and objective not in objectives:
                    objectives.append(objective)
        
        # If no specific objectives found, create generic ones
        if not objectives:
            module_words = text.split()[:10]
            if module_words:
                key_concepts = [word for word in module_words if len(word) > 3][:3]
                if key_concepts:
                    objectives.append(f"Master the concepts of {', '.join(key_concepts)}")
                    objectives.append("Apply knowledge through practical exercises")
                    objectives.append("Demonstrate understanding of core principles")
        
        return objectives[:5]  # Limit to 5 objectives
    
    def _generate_summary_notes(self, text: str, module_title: str) -> List[str]:
        """Generate summary notes for a module"""
        notes = []
        
        # Add title-based note
        notes.append(f"Focus on {module_title.lower()}")
        
        # Add content-based notes
        if "practice" in text.lower() or "exercise" in text.lower():
            notes.append("Complete all practical exercises")
        
        if "project" in text.lower():
            notes.append("Work on hands-on projects")
        
        if "test" in text.lower() or "quiz" in text.lower() or "assessment" in text.lower():
            notes.append("Prepare for assessments and evaluations")
        
        # Add generic notes if none found
        if len(notes) == 1:
            notes.extend([
                "Review key concepts regularly",
                "Practice the skills learned",
                "Take notes on important points"
            ])
        
        return notes[:4]  # Limit to 4 notes
    
    def _extract_key_skills(self, text: str) -> List[str]:
        """Extract key skills that will be learned from the content"""
        skills = []
        
        # Pattern-based skill extraction
        skill_patterns = [
            r'(?:learn|master|develop|build|create|understand)\s+([a-zA-Z][a-zA-Z\s]{2,25})',
            r'(?:skills?|knowledge|expertise)\s*:?\s*([a-zA-Z][a-zA-Z\s,]{5,100})',
            r'(?:technologies?|tools?|frameworks?|languages?)\s*:?\s*([a-zA-Z][a-zA-Z\s,]{5,100})'
        ]
        
        for pattern in skill_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                # Clean and validate skills
                skill_text = match.strip().lower()
                if 3 <= len(skill_text) <= 30 and skill_text not in [s.lower() for s in skills]:
                    skills.append(skill_text.title())
        
        # Add default skills if none found
        if not skills:
            skills = ["Problem Solving", "Critical Thinking", "Practical Application"]
        
        return skills[:6]  # Limit to 6 skills
    
    def _create_fallback_module(self, text: str, filename: str) -> List[Dict[str, Any]]:
        """Create a fallback module when no patterns are detected"""
        logger.warning(f"No module patterns detected in {filename}, creating fallback module")
        
        # Try to extract some meaningful content
        objectives = self._extract_objectives_from_text(text)
        if not objectives:
            objectives = [
                "Study the provided material thoroughly",
                "Understand the key concepts presented",
                "Apply the knowledge in practical situations"
            ]
        
        return [{
            "index": 1,
            "title": "Complete Learning Material",
            "objectives": objectives,
            "summary_notes": [
                "Review all provided content",
                "Take detailed notes on key points",
                "Practice concepts through exercises",
                "Seek clarification on difficult topics"
            ],
            "resources": self._build_default_resources(),
            "daily_plan": self._build_default_daily_plan(),
            "quiz": self._create_default_quiz(),
            "content_preview": text[:300] + "..." if len(text) > 300 else text
        }]
    
    def _build_default_resources(self) -> Dict[str, Any]:
        """Build default resource structure"""
        return {
            "articles": [
                {"title": "Recommended Reading", "url": "#", "type": "article"},
                {"title": "Practice Exercises", "url": "#", "type": "exercise"}
            ],
            "videos": [
                {"title": "Video Tutorial", "url": "#", "duration": "15 min"}
            ],
            "tools": [
                {"name": "Study Guide", "url": "#", "description": "Comprehensive study materials"}
            ]
        }
    
    def _build_default_daily_plan(self) -> Dict[str, Any]:
        """Build default daily plan structure"""
        return {
            "day_1": {"task": "Review objectives and materials", "duration": "30 min"},
            "day_2": {"task": "Complete practice exercises", "duration": "45 min"},
            "day_3": {"task": "Apply knowledge in projects", "duration": "60 min"},
            "day_4": {"task": "Review and reinforce learning", "duration": "30 min"}
        }
    
    def _create_default_quiz(self) -> Dict[str, Any]:
        """Create default quiz structure"""
        return {
            "questions": [
                {
                    "question": "What are the key concepts covered in this module?",
                    "type": "open_ended",
                    "points": 10
                },
                {
                    "question": "How would you apply this knowledge practically?",
                    "type": "open_ended", 
                    "points": 10
                }
            ],
            "total_points": 20,
            "passing_score": 14
        }
    
    def _assess_parsing_quality(self, result: Dict, original_text: str) -> Dict[str, Any]:
        """Assess the quality of parsing results"""
        
        modules = result.get('modules', [])
        pattern_used = result.get('processing_summary', {}).get('pattern_used', 'unknown')
        
        quality_score = 0
        quality_factors = []
        
        # Factor 1: Module count (0-30 points)
        if len(modules) >= 3:
            quality_score += 30
            quality_factors.append("Good module count")
        elif len(modules) >= 2:
            quality_score += 20
            quality_factors.append("Adequate module count")
        elif len(modules) == 1:
            quality_score += 10
            quality_factors.append("Single module detected")
        
        # Factor 2: Pattern detection (0-25 points)
        if pattern_used != 'default':
            quality_score += 25
            quality_factors.append(f"Pattern detected: {pattern_used}")
        else:
            quality_factors.append("No pattern detected")
        
        # Factor 3: Content richness (0-25 points)
        total_objectives = sum(len(m.get('objectives', [])) for m in modules)
        if total_objectives >= len(modules) * 2:
            quality_score += 25
            quality_factors.append("Rich objective content")
        elif total_objectives >= len(modules):
            quality_score += 15
            quality_factors.append("Adequate objective content")
        else:
            quality_factors.append("Limited objective content")
        
        # Factor 4: Text utilization (0-20 points)
        text_length = len(original_text)
        if text_length >= 1000:
            quality_score += 20
            quality_factors.append("Substantial content processed")
        elif text_length >= 500:
            quality_score += 15
            quality_factors.append("Moderate content processed")
        else:
            quality_score += 5
            quality_factors.append("Limited content processed")
        
        # Quality grade
        if quality_score >= 80:
            grade = "A"
        elif quality_score >= 70:
            grade = "B"
        elif quality_score >= 60:
            grade = "C"
        elif quality_score >= 50:
            grade = "D"
        else:
            grade = "F"
        
        return {
            "score": quality_score,
            "grade": grade,
            "factors": quality_factors,
            "recommendations": self._get_quality_recommendations(quality_score, pattern_used, modules)
        }
    
    def _get_quality_recommendations(self, score: int, pattern_used: str, modules: List) -> List[str]:
        """Get recommendations for improving parsing quality"""
        recommendations = []
        
        if score < 50:
            recommendations.append("Consider providing more structured content with clear module headers")
        
        if pattern_used == 'default':
            recommendations.append("Use clear section headers (Week 1:, Chapter 1:, etc.) for better parsing")
        
        if len(modules) == 1:
            recommendations.append("Break content into multiple sections or modules for better organization")
        
        total_objectives = sum(len(m.get('objectives', [])) for m in modules)
        if total_objectives < len(modules) * 2:
            recommendations.append("Include more explicit learning objectives or bullet points")
        
        return recommendations
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def get_processing_statistics(self) -> Dict[str, Any]:
        """Get comprehensive processing statistics"""
        return {
            'processing_stats': self.processing_stats.copy(),
            'supported_patterns': [p['description'] for p in self.module_patterns],
            'ocr_capabilities': self._check_ocr_capabilities()
        }
    
    def _check_ocr_capabilities(self) -> Dict[str, bool]:
        """Check if OCR dependencies are available"""
        capabilities = {}
        
        try:
            import fitz
            capabilities['pymupdf'] = True
        except ImportError:
            capabilities['pymupdf'] = False
        
        try:
            import pytesseract
            # Configure tesseract path for Windows
            import platform
            import os
            if platform.system() == 'Windows':
                tesseract_paths = [
                    r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                    r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe'
                ]
                for path in tesseract_paths:
                    if os.path.exists(path):
                        pytesseract.pytesseract.tesseract_cmd = path
                        break
            capabilities['pytesseract'] = True
        except ImportError:
            capabilities['pytesseract'] = False
        
        try:
            from PIL import Image
            capabilities['pillow'] = True
        except ImportError:
            capabilities['pillow'] = False
        
        capabilities['ocr_ready'] = all(capabilities.values())
        
        return capabilities

# Convenience function for easy import and use
def create_enhanced_parser() -> EnhancedContentParser:
    """Create and return an enhanced content parser instance"""
    return EnhancedContentParser()

# Example usage and testing
if __name__ == "__main__":
    parser = create_enhanced_parser()
    
    # Print supported patterns
    print("Enhanced Content Parser v2.0")
    print("Supported Module Patterns:")
    for pattern in parser.module_patterns:
        print(f"  - {pattern['description']}")
    
    # Print OCR capabilities
    capabilities = parser._check_ocr_capabilities()
    print(f"\nOCR Capabilities: {'✅ Ready' if capabilities['ocr_ready'] else '❌ Not Ready'}")
    for lib, available in capabilities.items():
        if lib != 'ocr_ready':
            print(f"  - {lib}: {'✅' if available else '❌'}")