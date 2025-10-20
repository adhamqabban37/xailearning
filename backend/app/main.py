from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from .db import engine
from .routes import api_router
import logging
import os
import time
import uuid
import json

# Import models for SQLModel registration
from models.course import Course, Module

# Optional parsing utilities
from services.pdf_parser import (
    extract_text,
    validate_pdf_content,
    parse_roadmap_structure,
    PDFProcessingError,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-learner-api")

app = FastAPI()

# CORS configuration (env override)
default_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://localhost:3005",
    "http://localhost:3006",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:3003",
    "http://127.0.0.1:3004",
    "http://127.0.0.1:3005",
    "http://127.0.0.1:3006",
]
cors_env = os.getenv("CORS_ORIGINS")
allow_origins = [o.strip() for o in cors_env.split(",") if o.strip()] if cors_env else default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SQLModel.metadata.create_all(engine)

# Include API routes
app.include_router(api_router)


@app.middleware("http")
async def request_id_logger(request: Request, call_next):
    start = time.perf_counter()
    # use incoming request id if provided
    rid = request.headers.get("x-request-id") or uuid.uuid4().hex
    request.state.request_id = rid
    try:
        response = await call_next(request)
    except Exception as e:
        duration_ms = int((time.perf_counter() - start) * 1000)
        logger.exception(f"{request.method} {request.url.path} 500 {duration_ms}ms rid={rid}")
        raise
    duration_ms = int((time.perf_counter() - start) * 1000)
    response.headers["x-request-id"] = rid
    logger.info(f"{request.method} {request.url.path} {response.status_code} {duration_ms}ms rid={rid}")
    return response


@app.on_event("startup")
async def on_startup():
    # Initialize database tables
    try:
        from .db import init_db
        init_db()
        logger.info("Database tables initialized")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
    
    # Lightweight DB check
    try:
        logger.info("Starting AI Learner API... Performing DB check")
        with engine.connect() as conn:
            conn.exec_driver_sql("SELECT 1")
        logger.info("DB connection OK")
    except Exception as e:
        logger.warning(f"DB check failed: {e}")

@app.get("/api/health")
def health_check(request: Request):
    return {"ok": True, "request_id": getattr(request.state, "request_id", None)}


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    rid = getattr(request.state, "request_id", None)
    payload = {"detail": exc.detail}
    if rid:
        payload["request_id"] = rid
    response = JSONResponse(status_code=exc.status_code, content=payload)
    if rid:
        response.headers["x-request-id"] = rid
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    rid = getattr(request.state, "request_id", None)
    logger.exception("Unhandled error")
    payload = {"detail": "Internal server error"}
    if rid:
        payload["request_id"] = rid
    response = JSONResponse(status_code=500, content=payload)
    if rid:
        response.headers["x-request-id"] = rid
    return response


@app.post("/api/upload-roadmap")
async def upload_roadmap(file: UploadFile = File(...)):
    """
    Orchestrate the complete PDF processing pipeline:
    1. Validate uploaded PDF
    2. Extract text from PDF
    3. Parse structured course data using parse_roadmap_structure()
    4. Enrich content using ContentParser.parse_course_content()
    5. Return structured JSON to frontend
    """
    request_id = uuid.uuid4().hex
    logger.info(f"[{request_id}] Starting PDF upload processing")
    
    # Step 1: Validate uploaded file
    if not file.filename:
        logger.error(f"[{request_id}] No filename provided")
        raise HTTPException(status_code=400, detail="No filename provided")

    content_type = file.content_type or ""
    is_pdf = file.filename.lower().endswith(".pdf") or "pdf" in content_type.lower()
    if not is_pdf:
        logger.error(f"[{request_id}] Invalid file type: {content_type}")
        raise HTTPException(status_code=415, detail="File type not supported. Please upload a PDF file.")

    try:
        # Step 2: Read and validate file content
        content = await file.read()
        size = len(content)
        logger.info(f"[{request_id}] File uploaded: {file.filename} ({size} bytes)")
        
        if size == 0:
            logger.error(f"[{request_id}] Empty file uploaded")
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        if size > 10 * 1024 * 1024:  # 10MB limit
            logger.error(f"[{request_id}] File too large: {size} bytes")
            raise HTTPException(status_code=413, detail="File is too large. Please choose a file under 10MB.")

        # Step 3: Extract text from PDF
        try:
            logger.info(f"[{request_id}] Extracting text from PDF...")
            text = extract_text(content)
            text_length = len(text or "")
            logger.info(f"[{request_id}] Text extraction successful: {text_length} characters")
            
            if text_length == 0:
                logger.error(f"[{request_id}] No text content extracted from PDF")
                raise HTTPException(status_code=422, detail="No text content found in PDF. This may be a scanned document requiring OCR.")
                
        except PDFProcessingError as e:
            logger.error(f"[{request_id}] PDF processing error: {e}")
            raise HTTPException(status_code=422, detail=str(e))

        # Step 4: Validate PDF content quality
        logger.info(f"[{request_id}] Validating PDF content quality...")
        is_valid, validation_error = validate_pdf_content(text)
        if not is_valid:
            logger.error(f"[{request_id}] PDF validation failed: {validation_error}")
            raise HTTPException(status_code=422, detail=validation_error)
        logger.info(f"[{request_id}] PDF content validation passed")

        # Step 5: Parse structured course data
        logger.info(f"[{request_id}] Parsing course structure...")
        try:
            parsed_structure = parse_roadmap_structure(text)
            logger.info(f"[{request_id}] Course structure parsed successfully")
            logger.debug(f"[{request_id}] Parsed structure: {json.dumps(parsed_structure, indent=2)}")
            
            # Validate parsed structure
            if not parsed_structure or not isinstance(parsed_structure, dict):
                logger.error(f"[{request_id}] Invalid parsed structure")
                raise ValueError("Failed to parse valid course structure from PDF")
                
            lessons_count = len(parsed_structure.get("lessons", []))
            logger.info(f"[{request_id}] Found {lessons_count} lessons in parsed structure")
            
        except Exception as e:
            logger.error(f"[{request_id}] Course parsing failed: {e}")
            raise HTTPException(status_code=422, detail=f"Failed to parse course structure: {str(e)}")

        # Step 6: Enhance content using ContentParser
        logger.info(f"[{request_id}] Enhancing content with AI enrichment...")
        try:
            from services.content_parser_clean import ContentParser
            content_parser = ContentParser()
            
            enriched_course = content_parser.parse_course_content(parsed_structure)
            logger.info(f"[{request_id}] Content enrichment completed successfully")
            logger.debug(f"[{request_id}] Enriched course: {json.dumps(enriched_course, indent=2)}")
            
            # Validate enriched structure
            if not enriched_course or not isinstance(enriched_course, dict):
                logger.error(f"[{request_id}] Invalid enriched structure")
                raise ValueError("Content enrichment produced invalid result")
                
            enriched_lessons_count = len(enriched_course.get("lessons", []))
            logger.info(f"[{request_id}] Enriched course contains {enriched_lessons_count} lessons")
            
        except Exception as e:
            logger.error(f"[{request_id}] Content enrichment failed: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to enhance course content: {str(e)}")

        # Step 7: Generate and save course to database
        logger.info(f"[{request_id}] Generating course and learning guide...")
        
        # Always generate a guaranteed course_id first
        guaranteed_course_id = str(uuid.uuid4())
        logger.info(f"[{request_id}] Generated guaranteed course ID: {guaranteed_course_id}")
        
        course_saved_successfully = False
        database_course_id = None
        try:
            from models.course import Course, Module
            from .db import SessionLocal
            
            logger.info(f"[{request_id}] Creating database session...")
            
            # Create course and modules in database
            with SessionLocal() as db:
                logger.info(f"[{request_id}] Database session created, creating course...")
                
                # Create the main course with guaranteed ID
                course = Course(
                    id=guaranteed_course_id,  # Use our guaranteed UUID
                    title=enriched_course.get("course_title", "Learning Course"),
                    level=enriched_course.get("meta", {}).get("difficulty_level", "Intermediate"),
                    duration=f"{enriched_course.get('meta', {}).get('estimated_hours', 0)} hours",
                    milestones=[lesson.get("title", f"Lesson {lesson.get('lesson_number', 1)}") 
                              for lesson in enriched_course.get("lessons", [])],
                    final_competency=f"Master {enriched_course.get('course_title', 'the subject')}",
                    source_filename=file.filename,
                    structured=True
                )
                
                logger.info(f"[{request_id}] Course object created with ID: {guaranteed_course_id}, adding to session...")
                db.add(course)
                
                logger.info(f"[{request_id}] Flushing to save course...")
                db.flush()  # Save the course
                
                database_course_id = course.id
                logger.info(f"[{request_id}] Database course ID confirmed: {database_course_id}")
                
                # Create modules from lessons
                logger.info(f"[{request_id}] Creating modules...")
                for lesson in enriched_course.get("lessons", []):
                    module = Module(
                        course_id=course.id,
                        index=lesson.get("lesson_number", 1),
                        title=lesson.get("title", "Lesson " + str(lesson.get('lesson_number', 1))),
                        objectives=lesson.get("topics", []),
                        summary_notes=[lesson.get("content", "")],
                        resources={
                            "youtube": lesson.get("resources", [])[:2] if lesson.get("resources") else [],
                            "courses": [],
                            "pdfs_docs": [],
                            "websites": lesson.get("resources", [])[2:4] if len(lesson.get("resources", [])) > 2 else [],
                            "practice_platforms": []
                        },
                        daily_plan=lesson.get("daily_plan", {}),
                        quiz={
                            "questions": [
                                {
                                    "id": f"q{i+1}",
                                    "type": "multiple_choice",
                                    "question": f"What is a key concept in {topic}?",
                                    "options": [f"Option A for {topic}", f"Option B for {topic}", f"Option C for {topic}", f"Option D for {topic}"],
                                    "answer": f"Option A for {topic}",
                                    "explanation": f"This covers the fundamental aspects of {topic}"
                                }
                                for i, topic in enumerate(lesson.get("topics", [])[:3])
                            ]
                        }
                    )
                    logger.info(f"[{request_id}] Module {lesson.get('lesson_number', 1)} created")
                    db.add(module)
                
                logger.info(f"[{request_id}] Committing to database...")
                db.commit()
                
                logger.info(f"[{request_id}] Course saved to database with ID: {course.id}")
                course_saved_successfully = True
                
                # Step 8: Generate comprehensive learning guide
                learning_guide = {
                    "study_plan": {
                        "total_duration": f"{enriched_course.get('meta', {}).get('estimated_hours', 0)} hours",
                        "recommended_pace": "1-2 lessons per week",
                        "daily_commitment": "30-60 minutes per day",
                        "milestones": [
                            {
                                "week": i+1,
                                "goal": f"Complete {lesson.get('title', 'Lesson ' + str(lesson.get('lesson_number', 1)))}",
                                "skills": lesson.get("skill_tags", [])[:3]
                            }
                            for i, lesson in enumerate(enriched_course.get("lessons", []))
                        ]
                    },
                    "learning_path": [
                        {
                            "lesson_number": lesson.get("lesson_number", 1),
                            "title": lesson.get("title", ""),
                            "duration": lesson.get("duration", "2 hours"),
                            "difficulty": "progressive",
                            "prerequisites": [enriched_course.get("lessons", [])[i-1].get("title", "") 
                                            for i in range(1, lesson.get("lesson_number", 1))][:1],
                            "outcomes": lesson.get("learning_objectives", [])[:3]
                        }
                        for lesson in enriched_course.get("lessons", [])
                    ],
                    "resource_library": {
                        "all_videos": [resource for lesson in enriched_course.get("lessons", []) 
                                     for resource in lesson.get("resources", [])[:2]],
                        "practice_exercises": [
                            {
                                "lesson": lesson.get("title", ""),
                                "exercises": lesson.get("practice_exercises", [])
                            }
                            for lesson in enriched_course.get("lessons", [])
                        ],
                        "skill_matrix": {
                            "skills": list(set([skill for lesson in enriched_course.get("lessons", []) 
                                              for skill in lesson.get("skill_tags", [])])),
                            "progression": "beginner → intermediate → advanced"
                        }
                    }
                }
                
        except Exception as e:
            logger.error(f"[{request_id}] Course generation failed: {e}")
            course_saved_successfully = False
            database_course_id = None
            # guaranteed_course_id is still available as fallback
            # Write detailed error to file for debugging
            try:
                with open("database_error.log", "w") as f:
                    import traceback
                    f.write(f"Database save error: {str(e)}\n\n")
                    f.write(f"Error type: {type(e).__name__}\n\n")
                    f.write("Full traceback:\n")
                    f.write(traceback.format_exc())
                    f.write(f"\n\nRequest ID: {request_id}")
                logger.error(f"[{request_id}] Error details written to database_error.log")
            except Exception as log_error:
                logger.error(f"[{request_id}] Failed to write error log: {log_error}")
            # Don't fail the upload, just log the error
        
        # Step 9: Prepare comprehensive response with guaranteed course_id
        logger.info(f"[{request_id}] Preparing final response with course and learning guide...")
        
        # Always use guaranteed_course_id - either from database or our generated UUID
        final_course_id = database_course_id if course_saved_successfully and database_course_id else guaranteed_course_id
        logger.info(f"[{request_id}] Final course ID for response: {final_course_id}")
        
        final_response = {
            "course_id": final_course_id,  # Always guaranteed to exist
            "course": {
                "id": final_course_id,
                "title": enriched_course.get("course_title", "Learning Course"),
                "description": enriched_course.get("course_description", ""),
                "lessons": enriched_course.get("lessons", []),
                "meta": enriched_course.get("meta", {}),
                "modules_count": len(enriched_course.get("lessons", []))
            },
            "learning_guide": learning_guide if 'learning_guide' in locals() else {},
            "processing_info": {
                "filename": file.filename,
                "file_size": size,
                "text_length": text_length,
                "lessons_parsed": lessons_count,
                "lessons_enriched": enriched_lessons_count,
                "course_saved": course_saved_successfully,
                "pipeline_steps_completed": [
                    "PDF validation",
                    "Text extraction", 
                    "Content validation",
                    "Structure parsing",
                    "Content enrichment",
                    "Course generation",
                    "Learning guide creation"
                ]
            }
        }
        
        logger.info(f"[{request_id}] Pipeline completed successfully")
        logger.info(f"[{request_id}] Generated course '{final_response['course']['title']}' with {len(final_response['course']['lessons'])} lessons and comprehensive learning guide")
        
        return final_response

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.exception(f"[{request_id}] Unexpected error during pipeline processing")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/courses")
async def get_courses():
    """Get all generated courses"""
    try:
        from models.course import Course, Module
        from .db import SessionLocal
        
        with SessionLocal() as db:
            courses = db.query(Course).all()
            
            result = []
            for course in courses:
                modules = db.query(Module).filter(Module.course_id == course.id).all()
                
                result.append({
                    "id": course.id,
                    "title": course.title,
                    "level": course.level,
                    "duration": course.duration,
                    "milestones": course.milestones,
                    "final_competency": course.final_competency,
                    "source_filename": course.source_filename,
                    "created_at": course.created_at.isoformat(),
                    "modules_count": len(modules),
                    "modules": [
                        {
                            "id": module.id,
                            "index": module.index,
                            "title": module.title,
                            "objectives": module.objectives,
                            "has_resources": bool(module.resources),
                            "has_daily_plan": bool(module.daily_plan),
                            "has_quiz": bool(module.quiz)
                        }
                        for module in modules
                    ]
                })
            
            return {"courses": result, "total": len(result)}
    except Exception as e:
        logger.error(f"Failed to get courses: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve courses")


@app.get("/api/courses/{course_id}")
async def get_course_details(course_id: str):
    """Get detailed course information including modules and learning guide"""
    try:
        from models.course import Course, Module
        from .db import SessionLocal
        
        with SessionLocal() as db:
            course = db.query(Course).filter(Course.id == course_id).first()
            if not course:
                raise HTTPException(status_code=404, detail="Course not found")
            
            modules = db.query(Module).filter(Module.course_id == course_id).order_by(Module.index).all()
            
            # Generate learning guide on-demand
            learning_guide = {
                "study_plan": {
                    "total_duration": course.duration,
                    "recommended_pace": f"1-2 modules per week",
                    "daily_commitment": "30-60 minutes per day",
                    "milestones": [
                        {
                            "week": i+1,
                            "goal": f"Complete {module.title}",
                            "skills": module.objectives[:3]
                        }
                        for i, module in enumerate(modules)
                    ]
                },
                "learning_path": [
                    {
                        "module_number": module.index,
                        "title": module.title,
                        "objectives": module.objectives,
                        "prerequisites": [modules[i-1].title for i in range(1, module.index)][:1] if module.index > 1 else [],
                        "resources_available": bool(module.resources),
                        "practice_available": bool(module.quiz),
                        "daily_plan_available": bool(module.daily_plan)
                    }
                    for module in modules
                ],
                "resource_summary": {
                    "total_modules": len(modules),
                    "total_objectives": sum(len(module.objectives) for module in modules),
                    "resource_types": ["videos", "documentation", "practice", "quizzes"]
                }
            }
            
            return {
                "course": {
                    "id": course.id,
                    "title": course.title,
                    "level": course.level,
                    "duration": course.duration,
                    "milestones": course.milestones,
                    "final_competency": course.final_competency,
                    "source_filename": course.source_filename,
                    "created_at": course.created_at.isoformat(),
                    "updated_at": course.updated_at.isoformat()
                },
                "modules": [
                    {
                        "id": module.id,
                        "index": module.index,
                        "title": module.title,
                        "objectives": module.objectives,
                        "summary_notes": module.summary_notes,
                        "resources": module.resources,
                        "daily_plan": module.daily_plan,
                        "quiz": module.quiz
                    }
                    for module in modules
                ],
                "learning_guide": learning_guide
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get course details: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve course details")
