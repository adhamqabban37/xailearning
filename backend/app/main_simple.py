from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import logging

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
    """Upload and process AI-generated roadmap PDF - Simplified version"""
    
    # Basic validation
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        if file_size == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        if file_size > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        
        logger.info(f"Received PDF: {file.filename}, Size: {file_size} bytes")
        
        # For now, just return success without processing
        return {
            "message": "PDF received successfully!",
            "filename": file.filename,
            "file_size": file_size,
            "status": "received",
            "note": "Full processing not yet implemented in this simplified version"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/courses")
async def get_courses():
    """Get all available courses"""
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)