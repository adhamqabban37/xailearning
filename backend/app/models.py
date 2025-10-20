"""
Simplified models module that exports the main models from the models package
"""

# Import the main models from the comprehensive models/course.py
# Since models/ is at the same level as app/, we need to use absolute imports
import sys
import os

# Add the backend directory to the path to access models package
backend_dir = os.path.dirname(os.path.dirname(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from models.course import (
    # SQLModel tables
    Course,
    Module, 
    Progress,
    
    # Pydantic models for JSON validation
    ResourcePack,
    DailyPlan,
    QuizBlock,
    Timeline,
    CourseMeta,
    VideoResource,
    CourseResource,
    DocResource,
    WebResource,
    PracticeResource,
    DailyAction,
    QuizQuestion,
    Assignment,
    
    # Request/Response models
    CourseResponse,
    ModuleResponse,
    ProgressRequest,
    ProgressResponse
)

# Additional response models for API consistency
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class CourseCreateRequest(BaseModel):
    """Request model for creating a course"""
    title: str
    level: Optional[str] = None
    duration: str = "Self-paced"
    final_competency: Optional[str] = None
    source_filename: str = "manual_input"

class CourseListResponse(BaseModel):
    """Response model for listing courses"""
    id: str
    title: str
    level: Optional[str]
    duration: str
    modules_count: int
    created_at: datetime
    progress_percentage: float = 0.0

class ModuleCreateRequest(BaseModel):
    """Request model for creating a module"""
    course_id: str
    index: int
    title: str
    objectives: List[str]
    summary_notes: List[str]
    resources: Optional[Dict[str, Any]] = None
    daily_plan: Optional[Dict[str, Any]] = None
    quiz: Optional[Dict[str, Any]] = None

class ModuleListResponse(BaseModel):
    """Response model for listing modules"""
    id: str
    course_id: str
    index: int
    title: str
    objectives: List[str]
    is_completed: bool = False

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    message: str
    timestamp: datetime
    database_connected: bool

__all__ = [
    # Tables
    "Course", "Module", "Progress",
    # JSON models
    "ResourcePack", "DailyPlan", "QuizBlock", "Timeline", "CourseMeta",
    "VideoResource", "CourseResource", "DocResource", "WebResource", "PracticeResource",
    "DailyAction", "QuizQuestion", "Assignment",
    # Request/Response models
    "CourseResponse", "ModuleResponse", "ProgressRequest", "ProgressResponse",
    "CourseCreateRequest", "CourseListResponse", "ModuleCreateRequest", "ModuleListResponse",
    "HealthResponse"
]