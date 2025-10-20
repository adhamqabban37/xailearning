from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from typing import Optional
import json
import logging
from services.pdf_parser import extract_text, validate_pdf_content, parse_roadmap_structure, PDFProcessingError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Learner Platform API",
    description="Transform AI-generated roadmaps into interactive learning experiences",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "AI Learner Platform API is running!", "status": "healthy"}

@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "AI Learner Platform API",
        "version": "1.0.0"
    }

@app.post("/api/upload-roadmap")
async def upload_roadmap(file: UploadFile = File(...)):
    """Upload and process AI-generated roadmap PDF"""
    
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Validate file size (10MB limit)
    file_size = 0
    pdf_bytes = b""
    
    try:
        # Read file content
        content = await file.read()
        pdf_bytes = content
        file_size = len(content)
        
        if file_size == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        if file_size > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        
        logger.info(f"Processing PDF: {file.filename}, Size: {file_size} bytes")
        
    except Exception as e:
        logger.error(f"Failed to read uploaded file: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {str(e)}")
    
    try:
        # Extract text from PDF
        extracted_text = extract_text(pdf_bytes)
        logger.info(f"Successfully extracted {len(extracted_text)} characters from PDF")
        
        # Validate content structure
        is_valid, validation_error = validate_pdf_content(extracted_text)
        if not is_valid:
            raise HTTPException(status_code=422, detail=f"Invalid roadmap content: {validation_error}")
        
        # Parse roadmap structure
        roadmap_structure = parse_roadmap_structure(extracted_text)
        
        # Create a course ID for this roadmap
        import uuid
        course_id = str(uuid.uuid4())
        
        # Store roadmap data (in a real app, you'd save to database)
        # For now, we'll return it in the response
        course_data = {
            "course_id": course_id,
            "title": roadmap_structure["title"],
            "description": f"AI-generated learning roadmap with {roadmap_structure['total_lessons']} lessons",
            "total_lessons": roadmap_structure["total_lessons"],
            "total_hours": roadmap_structure["total_hours"],
            "total_days": roadmap_structure["total_days"],
            "estimated_weeks": roadmap_structure["estimated_weeks"],
            "difficulty": roadmap_structure["difficulty_level"],
            "lessons": roadmap_structure["lessons"],
            "key_skills": roadmap_structure["key_skills"],
            "created_at": roadmap_structure["created_at"]
        }
        
        # Success response
        return {
            "message": "Roadmap processed successfully!",
            "filename": file.filename,
            "file_size": file_size,
            "status": "completed",
            "course": course_data,
            "text_length": len(extracted_text),
            "processing_summary": {
                "lessons_found": roadmap_structure["total_lessons"],
                "estimated_duration": f"{roadmap_structure['total_hours']} hours",
                "key_topics": len(roadmap_structure["key_skills"])
            }
        }
        
    except PDFProcessingError as e:
        logger.error(f"PDF processing error for {file.filename}: {str(e)}")
        raise HTTPException(status_code=422, detail=f"PDF processing failed: {str(e)}")
    
    except Exception as e:
        logger.error(f"Unexpected error processing {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/ingest/pdf")
async def ingest_pdf(file: UploadFile = File(...)):
    """Alternative endpoint for PDF ingestion (alias for upload-roadmap)"""
    return await upload_roadmap(file)

@app.get("/api/courses")
async def get_courses():
    """Get all available courses"""
    # Mock data for now
    return {
        "courses": [
            {
                "id": 1,
                "title": "Sample Course",
                "description": "A sample learning course",
                "lessons_count": 5,
                "estimated_duration": "5 hours"
            }
        ]
    }

@app.get("/api/courses/{course_id}")
async def get_course(course_id: str):
    """Get specific course details"""
    # In a real app, you'd fetch from database
    # For now, return a structured response
    return {
        "id": course_id,
        "title": "AI-Generated Learning Course",
        "description": "Interactive learning course created from your uploaded roadmap",
        "status": "ready",
        "message": "Course data would be retrieved from database in production",
        "note": "This is a placeholder - integrate with actual course storage"
    }

@app.get("/api/courses/{course_id}/lessons")
async def get_course_lessons(course_id: str):
    """Get lessons for a specific course"""
    # In a real app, you'd fetch lessons from database
    return {
        "course_id": course_id,
        "lessons": [],
        "message": "Lessons would be retrieved from database in production"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
