"""
PDF parsing utilities with robust text extraction and fallback methods.
"""
import io
import logging
import re
from typing import Dict, List, Optional, Tuple

try:
    from PyPDF2 import PdfReader
    PYPDF2_AVAILABLE = True
except ImportError:
    PYPDF2_AVAILABLE = False

try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFProcessingError(Exception):
    """Custom exception for PDF processing errors"""
    pass

def extract_text_pypdf2(pdf_bytes: bytes) -> str:
    """
    Extract text using PyPDF2 library
    
    Args:
        pdf_bytes: PDF file content as bytes
        
    Returns:
        Extracted text as string
        
    Raises:
        PDFProcessingError: If extraction fails
    """
    try:
        pdf_stream = io.BytesIO(pdf_bytes)
        reader = PdfReader(pdf_stream)
        
        if len(reader.pages) == 0:
            raise PDFProcessingError("PDF contains no pages")
        
        text_parts = []
        for page_num, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
                else:
                    logger.warning(f"No text found on page {page_num + 1}")
            except Exception as e:
                logger.warning(f"Failed to extract text from page {page_num + 1}: {str(e)}")
        
        text = "\n".join(text_parts)
        
        if not text.strip():
            raise PDFProcessingError("No text could be extracted from PDF. The PDF might be image-based or corrupted.")
        
        return text
        
    except PDFProcessingError:
        raise
    except Exception as e:
        raise PDFProcessingError(f"PyPDF2 extraction failed: {str(e)}")

def extract_text_pdfplumber(pdf_bytes: bytes) -> str:
    """
    Extract text using pdfplumber library (fallback method)
    
    Args:
        pdf_bytes: PDF file content as bytes
        
    Returns:
        Extracted text as string
        
    Raises:
        PDFProcessingError: If extraction fails
    """
    try:
        pdf_stream = io.BytesIO(pdf_bytes)
        
        with pdfplumber.open(pdf_stream) as pdf:
            if len(pdf.pages) == 0:
                raise PDFProcessingError("PDF contains no pages")
            
            text_parts = []
            for page_num, page in enumerate(pdf.pages):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
                    else:
                        logger.warning(f"No text found on page {page_num + 1}")
                except Exception as e:
                    logger.warning(f"Failed to extract text from page {page_num + 1}: {str(e)}")
            
            text = "\n".join(text_parts)
            
            if not text.strip():
                raise PDFProcessingError("No text could be extracted from PDF. The PDF might be image-based or corrupted.")
            
            return text
            
    except PDFProcessingError:
        raise
    except Exception as e:
        raise PDFProcessingError(f"pdfplumber extraction failed: {str(e)}")

def extract_text(pdf_bytes: bytes) -> str:
    """
    Extract text from PDF using multiple methods with fallbacks
    
    Args:
        pdf_bytes: PDF file content as bytes
        
    Returns:
        Extracted text as string
        
    Raises:
        PDFProcessingError: If all extraction methods fail
    """
    if not pdf_bytes:
        raise PDFProcessingError("Empty PDF file provided")
    
    # Check if PDF starts with proper PDF header
    if not pdf_bytes.startswith(b'%PDF-'):
        raise PDFProcessingError("Invalid PDF file format")
    
    errors = []
    
    # Try PyPDF2 first
    if PYPDF2_AVAILABLE:
        try:
            text = extract_text_pypdf2(pdf_bytes)
            logger.info("Successfully extracted text using PyPDF2")
            return text
        except PDFProcessingError as e:
            errors.append(f"PyPDF2: {str(e)}")
            logger.warning(f"PyPDF2 failed: {str(e)}")
    
    # Fallback to pdfplumber
    if PDFPLUMBER_AVAILABLE:
        try:
            text = extract_text_pdfplumber(pdf_bytes)
            logger.info("Successfully extracted text using pdfplumber")
            return text
        except PDFProcessingError as e:
            errors.append(f"pdfplumber: {str(e)}")
            logger.warning(f"pdfplumber failed: {str(e)}")
    
    # If both methods fail
    error_msg = "All PDF extraction methods failed. " + "; ".join(errors)
    if not PYPDF2_AVAILABLE and not PDFPLUMBER_AVAILABLE:
        error_msg = "No PDF processing libraries available"
    
    raise PDFProcessingError(error_msg)

def validate_pdf_content(text: str) -> Tuple[bool, str]:
    """
    Validate extracted PDF content for AI roadmap structure
    
    Args:
        text: Extracted text from PDF
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not text or len(text.strip()) < 50:
        return False, "PDF content is too short or empty"
    
    # Check for common AI roadmap markers
    roadmap_markers = [
        r'day\s*\d+',
        r'week\s*\d+',
        r'lesson\s*\d+',
        r'step\s*\d+',
        r'phase\s*\d+',
        r'module\s*\d+',
        r'learning\s*path',
        r'roadmap',
        r'curriculum',
        r'course\s*outline'
    ]
    
    text_lower = text.lower()
    marker_found = any(re.search(pattern, text_lower) for pattern in roadmap_markers)
    
    if not marker_found:
        return False, "PDF doesn't appear to contain a structured learning roadmap. Please ensure your PDF contains a learning plan with days, lessons, or modules."
    
    return True, ""

def parse_roadmap_structure(text: str) -> Dict[str, any]:
    """
    Enhanced roadmap parser with robust lesson detection and comprehensive debugging.
    Reliably extracts course structure from PDF text with multiple fallback strategies.
    
    Args:
        text: Extracted text from PDF
        
    Returns:
        Dictionary containing parsed roadmap structure in standardized format:
        {
            "course_title": "...",
            "course_description": "...", 
            "lessons": [
                {
                    "lesson_number": 1,
                    "title": "...",
                    "topics": ["..."],
                    "duration": "...",
                    "content": "..."
                }
            ]
        }
    """
    import re
    from datetime import datetime
    
    logger.info("🚀 Starting enhanced roadmap parsing...")
    logger.debug(f"📄 Input text length: {len(text)} characters")
    logger.debug(f"📄 Text preview: {text[:200]}...")
    
    # Validate input
    if not text or len(text.strip()) < 20:
        logger.warning("⚠️  Text too short for meaningful parsing")
        return _get_minimal_fallback_structure()
    
    try:
        # STEP 1: Extract course metadata with enhanced detection
        logger.info("🔍 Step 1: Extracting course title and description...")
        course_title = _extract_course_title_enhanced(text)
        course_description = _extract_course_description_enhanced(text)
        
        logger.info(f"✅ Course title: {course_title}")
        logger.info(f"✅ Description: {course_description[:100]}...")
        
        # STEP 2: Multi-strategy lesson extraction with priority order
        logger.info("🔍 Step 2: Extracting lessons with multi-strategy approach...")
        lessons = []
        
        # Strategy 1: Enhanced pattern-based detection (highest priority)
        pattern_lessons = _extract_lessons_enhanced_patterns(text)
        if pattern_lessons:
            lessons = pattern_lessons
            logger.info(f"✅ Strategy 1 SUCCESS: Found {len(pattern_lessons)} lessons via patterns")
        else:
            logger.info("❌ Strategy 1 FAILED: No pattern-based lessons found")
        
        # Strategy 2: Intelligent bullet/numbered list detection (medium priority)
        if len(lessons) < 2:
            bullet_lessons = _extract_lessons_enhanced_bullets(text)
            if bullet_lessons:
                lessons = bullet_lessons
                logger.info(f"✅ Strategy 2 SUCCESS: Found {len(bullet_lessons)} lessons via bullets")
            else:
                logger.info("❌ Strategy 2 FAILED: No bullet-based lessons found")
        
        # Strategy 3: Content segmentation fallback (lowest priority)
        if len(lessons) < 1:
            segment_lessons = _extract_lessons_content_segments(text)
            lessons = segment_lessons
            logger.info(f"✅ Strategy 3 FALLBACK: Created {len(segment_lessons)} lessons via segmentation")
        
        # STEP 3: Post-processing and validation
        logger.info("🔍 Step 3: Cleaning and validating lessons...")
        lessons = _validate_and_clean_lessons(lessons)
        
        # Ensure minimum viable structure
        if not lessons:
            logger.warning("⚠️  No lessons extracted, creating emergency fallback")
            lessons = _create_emergency_fallback_lessons(text)
        
        # STEP 4: Build final structure
        structure = {
            "course_title": course_title,
            "course_description": course_description,
            "lessons": lessons
        }
        
        # STEP 5: Final validation and debugging
        _debug_final_structure(structure)
        logger.info(f"🎉 Successfully parsed course: '{course_title}' with {len(lessons)} lessons")
        
        return structure
        
    except Exception as e:
        logger.error(f"💥 Critical parsing error: {str(e)}")
        logger.exception("Full error traceback:")
        return _get_error_fallback_structure(text, str(e))


def _extract_course_title_enhanced(text: str) -> str:
    """Enhanced course title extraction with multiple strategies and debugging"""
    logger.debug("🔍 Extracting course title...")
    
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    # Strategy 1: Look for explicit title indicators
    title_indicators = [
        r'(?:title|course|program|curriculum|roadmap)[:\s]*(.+)',
        r'(?:learning|training|study)[:\s]+(.+)',
        r'(?:complete|comprehensive|master)[:\s]+(.+)',
    ]
    
    for line in lines[:15]:  # Check first 15 lines
        for pattern in title_indicators:
            match = re.search(pattern, line, re.IGNORECASE)
            if match and 10 <= len(match.group(1).strip()) <= 120:
                title = match.group(1).strip()
                logger.debug(f"✅ Title found via indicator: {title}")
                return _clean_title(title)
    
    # Strategy 2: Look for lines with title characteristics
    title_keywords = ['roadmap', 'plan', 'course', 'learning', 'guide', 'curriculum', 'syllabus', 'program', 'training', 'tutorial']
    for line in lines[:10]:
        if 15 <= len(line) <= 120:  # Reasonable title length
            line_lower = line.lower()
            # Check for title keywords
            if any(keyword in line_lower for keyword in title_keywords):
                logger.debug(f"✅ Title found via keywords: {line}")
                return _clean_title(line)
            # Check for title formatting (Title Case, ALL CAPS)
            if line.istitle() or line.isupper():
                # Avoid false positives like "PAGE 1", "CHAPTER 1"
                if not re.match(r'^(page|chapter|section|part)\s*\d+', line, re.IGNORECASE):
                    logger.debug(f"✅ Title found via formatting: {line}")
                    return _clean_title(line)
    
    # Strategy 3: Use first substantial, non-metadata line
    for line in lines[:8]:
        if 20 <= len(line) <= 100:
            # Skip obvious non-titles
            skip_patterns = ['page', 'chapter', 'section', 'date', 'author', 'version', '©', 'copyright']
            if not any(pattern in line.lower() for pattern in skip_patterns):
                logger.debug(f"✅ Title found via first substantial line: {line}")
                return _clean_title(line)
    
    # Fallback
    logger.debug("❌ No specific title found, using fallback")
    return "Learning Course"


def _extract_course_description_enhanced(text: str) -> str:
    """Enhanced course description extraction with better detection"""
    logger.debug("🔍 Extracting course description...")
    
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    # Strategy 1: Look for explicit description patterns
    desc_patterns = [
        r'(?:description|overview|about|introduction)[:\s]*(.+)',
        r'(?:this course|this program|this guide)[:\s]*(.+)',
        r'(?:you will learn|learn how to|master)[:\s]*(.+)',
    ]
    
    for i, line in enumerate(lines[:25]):
        for pattern in desc_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match and len(match.group(1).strip()) >= 30:
                desc = match.group(1).strip()
                # Include next line if it continues the description
                if i + 1 < len(lines) and len(lines[i + 1]) > 20:
                    desc += " " + lines[i + 1]
                logger.debug(f"✅ Description found via pattern: {desc[:100]}...")
                return desc[:400]
    
    # Strategy 2: Look for substantial paragraphs with descriptive content
    descriptive_keywords = ['learn', 'master', 'understand', 'develop', 'build', 'create', 'course', 'comprehensive', 'complete']
    
    for line in lines[:20]:
        if len(line) >= 60:  # Substantial paragraph
            line_lower = line.lower()
            keyword_count = sum(1 for keyword in descriptive_keywords if keyword in line_lower)
            if keyword_count >= 2:  # Multiple descriptive keywords
                logger.debug(f"✅ Description found via keywords: {line[:100]}...")
                return line[:400]
    
    # Strategy 3: First long paragraph
    for line in lines[:15]:
        if len(line) >= 80:
            logger.debug(f"✅ Description found via length: {line[:100]}...")
            return line[:400]
    
    # Fallback
    logger.debug("❌ No specific description found, creating generic one")
    return "A comprehensive learning course extracted from PDF content with structured lessons and practical applications."


def _extract_lessons_enhanced_patterns(text: str) -> List[Dict]:
    """Enhanced pattern-based lesson extraction with comprehensive regex patterns"""
    logger.debug("🔍 Extracting lessons via enhanced patterns...")
    
    lessons = []
    
    # Comprehensive lesson patterns with flexible matching
    lesson_patterns = [
        # Day patterns (most common)
        r'(?:^|\n)\s*day\s*(\d+)[:\-\s\u2013\u2014]*([^\n]+(?:\n(?!\s*(?:day|lesson|step|week|module|chapter)\s*\d+)[^\n]*)*)',
        # Lesson patterns
        r'(?:^|\n)\s*lesson\s*(\d+)[:\-\s\u2013\u2014]*([^\n]+(?:\n(?!\s*(?:day|lesson|step|week|module|chapter)\s*\d+)[^\n]*)*)',
        # Step patterns
        r'(?:^|\n)\s*step\s*(\d+)[:\-\s\u2013\u2014]*([^\n]+(?:\n(?!\s*(?:day|lesson|step|week|module|chapter)\s*\d+)[^\n]*)*)',
        # Week patterns
        r'(?:^|\n)\s*week\s*(\d+)[:\-\s\u2013\u2014]*([^\n]+(?:\n(?!\s*(?:week|day|lesson)\s*\d+)[^\n]*)*)',
        # Module patterns
        r'(?:^|\n)\s*module\s*(\d+)[:\-\s\u2013\u2014]*([^\n]+(?:\n(?!\s*(?:module|lesson|chapter)\s*\d+)[^\n]*)*)',
        # Chapter patterns
        r'(?:^|\n)\s*chapter\s*(\d+)[:\-\s\u2013\u2014]*([^\n]+(?:\n(?!\s*(?:chapter|lesson)\s*\d+)[^\n]*)*)',
        # Numbered sections (1., 2., etc.)
        r'(?:^|\n)\s*(\d+)[\.)]\s*([^\n]+(?:\n(?!\s*\d+[\.)]\s*)[^\n]*)*)',
    ]
    
    # Add text boundaries for better matching
    text_bounded = '\n' + text + '\n'
    
    for pattern_idx, pattern in enumerate(lesson_patterns):
        logger.debug(f"🔍 Trying pattern {pattern_idx + 1}: {pattern[:50]}...")
        
        matches = list(re.finditer(pattern, text_bounded, re.IGNORECASE | re.DOTALL))
        
        if matches:
            logger.debug(f"✅ Pattern {pattern_idx + 1} found {len(matches)} potential lessons")
            
            pattern_lessons = []
            for match in matches:
                try:
                    lesson_num = int(match.group(1))
                    content = match.group(2).strip()
                    
                    # Validate content quality
                    if 15 <= len(content) <= 3000:  # Reasonable content length
                        lesson = _parse_lesson_content_enhanced(lesson_num, content)
                        pattern_lessons.append(lesson)
                        logger.debug(f"✅ Lesson {lesson_num}: {lesson['title'][:50]}...")
                
                except (ValueError, AttributeError, IndexError) as e:
                    logger.debug(f"❌ Failed to parse match: {e}")
                    continue
            
            # Return first successful pattern with sufficient lessons
            if len(pattern_lessons) >= 2:
                logger.info(f"✅ Pattern {pattern_idx + 1} SUCCESS: {len(pattern_lessons)} lessons")
                return pattern_lessons[:25]  # Max 25 lessons
    
    logger.debug("❌ No patterns yielded sufficient lessons")
    return []


def _extract_lessons_enhanced_bullets(text: str) -> List[Dict]:
    """Enhanced bullet point and numbered list lesson extraction"""
    logger.debug("🔍 Extracting lessons via enhanced bullet detection...")
    
    lines = text.split('\n')
    lessons = []
    
    # Enhanced bullet patterns
    bullet_patterns = [
        r'^\s*([•▪▫▬◦‣⁃]\s*.+)',  # Various bullet characters
        r'^\s*([-*+]\s*.+)',       # Dash/asterisk bullets
        r'^\s*(\d+[\.)]\s*.+)',    # Numbered lists (1. or 1))
        r'^\s*([a-zA-Z][\.)]\s*.+)', # Letter lists (a. or a))
        r'^\s*([IVX]+[\.)]\s*.+)',  # Roman numerals
    ]
    
    current_lesson = None
    lesson_content = []
    lesson_number = 1
    
    for line_idx, line in enumerate(lines):
        line_stripped = line.strip()
        if not line_stripped:
            continue
        
        # Check if line matches any bullet pattern
        is_new_lesson = False
        lesson_title = None
        
        for pattern in bullet_patterns:
            match = re.match(pattern, line)
            if match:
                bullet_content = match.group(1).strip()
                # Remove bullet character to get clean title
                clean_title = re.sub(r'^[•▪▫▬◦‣⁃\-*+\d+\w+[\.)]\s*', '', bullet_content).strip()
                
                # Validate as potential lesson title
                if 10 <= len(clean_title) <= 150:
                    lesson_title = clean_title
                    is_new_lesson = True
                    break
        
        if is_new_lesson:
            # Save previous lesson if exists
            if current_lesson and lesson_content:
                lesson = _create_lesson_from_content_enhanced(lesson_number, current_lesson, lesson_content)
                lessons.append(lesson)
                logger.debug(f"✅ Bullet lesson {lesson_number}: {current_lesson[:50]}...")
                lesson_number += 1
            
            # Start new lesson
            current_lesson = lesson_title
            lesson_content = []
        else:
            # Add to current lesson content (if we have one)
            if current_lesson:
                # Only add meaningful content
                if len(line_stripped) > 5:
                    lesson_content.append(line_stripped)
    
    # Don't forget the last lesson
    if current_lesson and lesson_content:
        lesson = _create_lesson_from_content_enhanced(lesson_number, current_lesson, lesson_content)
        lessons.append(lesson)
        logger.debug(f"✅ Final bullet lesson {lesson_number}: {current_lesson[:50]}...")
    
    if lessons:
        logger.info(f"✅ Bullet extraction SUCCESS: {len(lessons)} lessons")
    else:
        logger.debug("❌ No bullet-based lessons found")
    
    return lessons[:20]  # Limit to 20 lessons


def _extract_lessons_content_segments(text: str) -> List[Dict]:
    """Fallback: Create lessons by intelligently segmenting content"""
    logger.debug("🔍 Creating lessons via content segmentation (fallback)...")
    
    # Split by multiple newlines (paragraph breaks)
    segments = [seg.strip() for seg in re.split(r'\n\s*\n+', text) if seg.strip()]
    
    # Filter out very short segments
    substantial_segments = [seg for seg in segments if len(seg) >= 50]
    
    if len(substantial_segments) < 2:
        # If we don't have enough substantial segments, split differently
        # Try splitting by single newlines and grouping
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        substantial_segments = []
        current_segment = []
        
        for line in lines:
            current_segment.append(line)
            if len('\n'.join(current_segment)) >= 100:  # Minimum segment size
                substantial_segments.append('\n'.join(current_segment))
                current_segment = []
        
        # Add remaining content
        if current_segment:
            substantial_segments.append('\n'.join(current_segment))
    
    lessons = []
    for i, segment in enumerate(substantial_segments[:15]):  # Max 15 segments
        lesson = _parse_lesson_content_enhanced(i + 1, segment)
        lessons.append(lesson)
        logger.debug(f"✅ Segment lesson {i + 1}: {lesson['title'][:50]}...")
    
    logger.info(f"✅ Segmentation SUCCESS: {len(lessons)} lessons from content")
    return lessons


def _parse_lesson_content_enhanced(lesson_num: int, content: str) -> Dict:
    """Enhanced lesson content parsing with better topic and duration extraction"""
    lines = [line.strip() for line in content.split('\n') if line.strip()]
    
    # Extract title - enhanced logic
    title = f"Lesson {lesson_num}"
    if lines:
        first_line = lines[0]
        # Clean and validate first line as title
        clean_title = re.sub(r'^[:\-\s\u2013\u2014]+', '', first_line).strip()
        clean_title = re.sub(r'[:\-\s\u2013\u2014]+$', '', clean_title).strip()
        
        if 5 <= len(clean_title) <= 120:
            title = clean_title
    
    # Extract topics with enhanced detection
    topics = _extract_topics_enhanced(content)
    
    # Extract duration with improved patterns
    duration = _extract_duration_enhanced(content)
    
    # Limit content length for response size
    limited_content = content[:1000] + "..." if len(content) > 1000 else content
    
    return {
        "lesson_number": lesson_num,
        "title": title,
        "topics": topics,
        "duration": duration,
        "content": limited_content
    }


def _create_lesson_from_content_enhanced(lesson_num: int, title: str, content_lines: List[str]) -> Dict:
    """Enhanced lesson creation from title and content lines"""
    content = '\n'.join(content_lines)
    
    # Clean title
    clean_title = re.sub(r'^[:\-\s\u2013\u2014]+', '', title).strip()
    clean_title = re.sub(r'[:\-\s\u2013\u2014]+$', '', clean_title).strip()
    
    topics = _extract_topics_enhanced(content)
    duration = _extract_duration_enhanced(content)
    
    limited_content = content[:1000] + "..." if len(content) > 1000 else content
    
    return {
        "lesson_number": lesson_num,
        "title": clean_title[:120],
        "topics": topics,
        "duration": duration,
        "content": limited_content
    }


def _extract_topics_enhanced(content: str) -> List[str]:
    """Enhanced topic extraction with multiple strategies"""
    topics = []
    lines = content.split('\n')
    
    # Strategy 1: Look for explicit topic markers
    topic_markers = ['•', '-', '▪', '▫', '◦', '‣', '⁃', '→', '✓', '*']
    for line in lines:
        line = line.strip()
        if 5 <= len(line) <= 120:
            # Check for topic markers
            for marker in topic_markers:
                if line.startswith(marker):
                    topic = line[1:].strip()
                    if len(topic) > 3:
                        topics.append(topic)
                        break
    
    # Strategy 2: Look for learning action phrases
    action_patterns = [
        r'(?:learn|understand|master|build|create|develop|implement|practice|study|explore|discover)\s+(.+)',
        r'(?:how to|introduction to|overview of|basics of)\s+(.+)',
    ]
    
    for line in lines:
        for pattern in action_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match and 5 <= len(match.group(1).strip()) <= 100:
                topics.append(match.group(1).strip())
    
    # Strategy 3: Extract technical terms and concepts (capitalized phrases)
    if len(topics) < 3:
        # Look for capitalized technical terms
        tech_terms = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', content)
        # Filter for reasonable lengths and common patterns
        filtered_terms = [term for term in tech_terms 
                         if 3 <= len(term) <= 50 and not term.lower() in ['The', 'This', 'That', 'With', 'For', 'And']]
        topics.extend(list(set(filtered_terms))[:5])
    
    # Strategy 4: Extract key phrases in quotes or after colons
    if len(topics) < 2:
        quoted_phrases = re.findall(r'["\'](.*?)["\']', content)
        colon_phrases = re.findall(r':\s*([^.\n]+)', content)
        
        for phrase in quoted_phrases + colon_phrases:
            phrase = phrase.strip()
            if 3 <= len(phrase) <= 80:
                topics.append(phrase)
    
    # Clean and deduplicate topics
    cleaned_topics = []
    seen = set()
    for topic in topics:
        topic = topic.strip()
        topic_lower = topic.lower()
        if topic_lower not in seen and len(topic) >= 3:
            cleaned_topics.append(topic)
            seen.add(topic_lower)
    
    return cleaned_topics[:10]  # Max 10 topics


def _extract_duration_enhanced(content: str) -> str:
    """Enhanced duration extraction with comprehensive time patterns"""
    # Enhanced time patterns
    time_patterns = [
        (r'(\d+\.?\d*)\s*(?:hours?|hrs?)', 60),      # hours
        (r'(\d+\.?\d*)\s*(?:minutes?|mins?)', 1),    # minutes  
        (r'(\d+\.?\d*)\s*(?:days?)', 480),           # days (8 hours each)
        (r'(\d+\.?\d*)\s*(?:weeks?)', 2400),         # weeks (40 hours each)
        (r'(\d+\.?\d*)\s*(?:months?)', 9600),        # months (160 hours each)
    ]
    
    content_lower = content.lower()
    total_minutes = 0
    
    for pattern, multiplier in time_patterns:
        matches = re.findall(pattern, content_lower)
        for match in matches:
            try:
                time_val = float(match)
                total_minutes += time_val * multiplier
            except ValueError:
                continue
    
    # Convert back to readable format
    if total_minutes > 0:
        if total_minutes >= 60:
            hours = int(total_minutes // 60)
            mins = int(total_minutes % 60)
            if mins > 0:
                return f"{hours} hours {mins} minutes"
            else:
                return f"{hours} hour{'s' if hours != 1 else ''}"
        else:
            return f"{int(total_minutes)} minutes"
    
    # Smart estimation based on content characteristics
    content_length = len(content)
    word_count = len(content.split())
    
    # Estimate reading time (200 words per minute) plus practice time
    estimated_reading_minutes = word_count / 200
    estimated_total_minutes = estimated_reading_minutes * 2.5  # Factor for practice/exercises
    
    if estimated_total_minutes >= 60:
        hours = int(estimated_total_minutes // 60)
        return f"{hours} hour{'s' if hours != 1 else ''}"
    elif estimated_total_minutes >= 30:
        return "30-60 minutes"
    else:
        return "15-30 minutes"


def _validate_and_clean_lessons(lessons: List[Dict]) -> List[Dict]:
    """Comprehensive lesson validation and cleaning"""
    logger.debug(f"🔍 Validating and cleaning {len(lessons)} lessons...")
    
    if not lessons:
        return []
    
    cleaned_lessons = []
    seen_titles = set()
    
    for i, lesson in enumerate(lessons):
        # Ensure all required fields
        cleaned_lesson = {
            "lesson_number": lesson.get("lesson_number", i + 1),
            "title": lesson.get("title", f"Lesson {i + 1}"),
            "topics": lesson.get("topics", []),
            "duration": lesson.get("duration", "1 hour"),
            "content": lesson.get("content", "")
        }
        
        # Clean and validate title
        title = str(cleaned_lesson["title"]).strip()
        title = _clean_title(title)
        
        # Handle duplicate titles
        original_title = title
        counter = 1
        while title.lower() in seen_titles:
            title = f"{original_title} (Part {counter})"
            counter += 1
        
        cleaned_lesson["title"] = title
        seen_titles.add(title.lower())
        
        # Validate and clean topics
        topics = cleaned_lesson["topics"]
        if not isinstance(topics, list):
            topics = []
        
        cleaned_topics = []
        for topic in topics:
            if isinstance(topic, str) and len(topic.strip()) >= 3:
                clean_topic = topic.strip()[:100]  # Limit length
                if clean_topic not in cleaned_topics:  # Avoid duplicates
                    cleaned_topics.append(clean_topic)
        
        cleaned_lesson["topics"] = cleaned_topics[:12]  # Max 12 topics
        
        # Validate duration
        duration = cleaned_lesson["duration"]
        if not isinstance(duration, str) or len(duration.strip()) < 3:
            cleaned_lesson["duration"] = "1 hour"
        
        # Validate content
        content = cleaned_lesson["content"]
        if not isinstance(content, str) or len(content.strip()) < 5:
            cleaned_lesson["content"] = f"Content for {title}"
        
        cleaned_lessons.append(cleaned_lesson)
    
    # Re-number lessons sequentially
    for i, lesson in enumerate(cleaned_lessons):
        lesson["lesson_number"] = i + 1
    
    logger.debug(f"✅ Cleaned and validated {len(cleaned_lessons)} lessons")
    return cleaned_lessons


def _clean_title(title: str) -> str:
    """Clean and normalize a title string"""
    if not title:
        return "Untitled Lesson"
    
    # Remove leading/trailing punctuation and whitespace
    title = re.sub(r'^[:\-\s\u2013\u2014\.,;]+', '', title).strip()
    title = re.sub(r'[:\-\s\u2013\u2014\.,;]+$', '', title).strip()
    
    # Limit length
    if len(title) > 120:
        title = title[:120].rsplit(' ', 1)[0] + "..."
    
    # Ensure minimum length
    if len(title) < 3:
        title = "Lesson"
    
    return title


def _create_emergency_fallback_lessons(text: str) -> List[Dict]:
    """Create emergency fallback lessons when all extraction methods fail"""
    logger.warning("⚠️  Creating emergency fallback lessons...")
    
    # Split text into chunks
    words = text.split()
    chunk_size = max(50, len(words) // 3)  # Aim for 3 lessons
    
    lessons = []
    for i in range(0, len(words), chunk_size):
        chunk_words = words[i:i + chunk_size]
        chunk_content = ' '.join(chunk_words)
        
        lesson = {
            "lesson_number": len(lessons) + 1,
            "title": f"Course Content Part {len(lessons) + 1}",
            "topics": ["Key concepts", "Learning objectives", "Practical applications"],
            "duration": "1-2 hours",
            "content": chunk_content[:800] + "..." if len(chunk_content) > 800 else chunk_content
        }
        lessons.append(lesson)
        
        if len(lessons) >= 3:  # Max 3 emergency lessons
            break
    
    logger.info(f"✅ Created {len(lessons)} emergency fallback lessons")
    return lessons


def _get_minimal_fallback_structure() -> Dict:
    """Return minimal fallback structure for empty/invalid input"""
    return {
        "course_title": "Learning Course",
        "course_description": "A structured learning course extracted from PDF content.",
        "lessons": [{
            "lesson_number": 1,
            "title": "Course Introduction",
            "topics": ["Getting started", "Course overview"],
            "duration": "30 minutes",
            "content": "Welcome to this learning course. Please refer to the original material for detailed content."
        }]
    }


def _get_error_fallback_structure(text: str, error_msg: str) -> Dict:
    """Return error fallback structure when parsing completely fails"""
    return {
        "course_title": "Learning Course (Parsing Error)",
        "course_description": f"Course extraction encountered an error: {error_msg[:100]}",
        "lessons": [{
            "lesson_number": 1,
            "title": "Original Content",
            "topics": ["Raw content", "Manual review needed"],
            "duration": "Variable",
            "content": text[:1000] + "..." if len(text) > 1000 else text
        }]
    }


def _debug_final_structure(structure: Dict) -> None:
    """Debug and log the final parsed structure"""
    logger.debug("🔍 Final structure debug:")
    logger.debug(f"  📚 Course: {structure.get('course_title', 'N/A')}")
    logger.debug(f"  📄 Description length: {len(structure.get('course_description', ''))}")
    
    lessons = structure.get('lessons', [])
    logger.debug(f"  📖 Total lessons: {len(lessons)}")
    
    for i, lesson in enumerate(lessons[:3]):  # Debug first 3 lessons
        logger.debug(f"    📝 Lesson {i+1}: {lesson.get('title', 'N/A')}")
        logger.debug(f"       Topics: {len(lesson.get('topics', []))}")
        logger.debug(f"       Duration: {lesson.get('duration', 'N/A')}")
        logger.debug(f"       Content length: {len(lesson.get('content', ''))}")
    
    if len(lessons) > 3:
        logger.debug(f"    ... and {len(lessons) - 3} more lessons")


def _extract_course_title(text: str) -> str:
    """Legacy function - now uses enhanced version"""
    return _extract_course_title_enhanced(text)


def _extract_course_description(text: str) -> str:
    """Legacy function - now uses enhanced version"""
    return _extract_course_description_enhanced(text)


def _extract_lessons_by_patterns(text: str) -> List[Dict]:
    """Legacy function - now uses enhanced version"""
    return _extract_lessons_enhanced_patterns(text)


def _extract_lessons_by_bullets(text: str) -> List[Dict]:
    """Legacy function - now uses enhanced version"""
    return _extract_lessons_enhanced_bullets(text)


def _extract_lessons_by_paragraphs(text: str) -> List[Dict]:
    """Legacy function - now uses enhanced version"""
    return _extract_lessons_content_segments(text)


def _parse_lesson_content(lesson_num: int, content: str) -> Dict:
    """Legacy function - now uses enhanced version"""
    return _parse_lesson_content_enhanced(lesson_num, content)


def _create_lesson_from_content(lesson_num: int, title: str, content_lines: List[str]) -> Dict:
    """Legacy function - now uses enhanced version"""
    return _create_lesson_from_content_enhanced(lesson_num, title, content_lines)


def _extract_topics_from_content(content: str) -> List[str]:
    """Legacy function - now uses enhanced version"""
    return _extract_topics_enhanced(content)


def _extract_duration(content: str) -> str:
    """Legacy function - now uses enhanced version"""
    return _extract_duration_enhanced(content)


def _clean_and_standardize_lessons(lessons: List[Dict]) -> List[Dict]:
    """Legacy function - now uses enhanced version"""
    return _validate_and_clean_lessons(lessons)
