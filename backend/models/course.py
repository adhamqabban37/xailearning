from sqlmodel import SQLModel, Field, Relationship, JSON, Column
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel
import uuid

# Pydantic models for JSON validation
class VideoResource(BaseModel):
    title: str
    url: str
    duration: Optional[str] = None
    timestamps: Optional[List[Dict[str, str]]] = None  # [{"t": "1:30", "topic": "Introduction"}]
    key_takeaways: Optional[List[str]] = None

class CourseResource(BaseModel):
    title: str
    url: str
    type: str = "free"  # "free" | "paid"
    est_time_hours: Optional[int] = None
    why_this: Optional[str] = None

class DocResource(BaseModel):
    title: str
    url: str
    auto_summary_bullets: Optional[List[str]] = None
    sections_to_focus: Optional[List[str]] = None

class WebResource(BaseModel):
    title: str
    url: str
    summary: Optional[str] = None
    use_case: Optional[str] = None

class PracticeResource(BaseModel):
    platform: str
    url: str
    target_exercises: Optional[List[str]] = None

class ResourcePack(BaseModel):
    youtube: Optional[List[VideoResource]] = None
    courses: Optional[List[CourseResource]] = None
    pdfs_docs: Optional[List[DocResource]] = None
    websites: Optional[List[WebResource]] = None
    practice_platforms: Optional[List[PracticeResource]] = None

class DailyAction(BaseModel):
    action: str  # "watch", "read", "practice", "apply"
    url: Optional[str] = None
    time: str
    notes_prompt: Optional[str] = None
    sections: Optional[List[str]] = None
    exercise: Optional[str] = None
    task: Optional[str] = None

class DailyPlan(BaseModel):
    # Flexible structure: day_1, day_2, etc. or any key
    plan: Dict[str, List[DailyAction]] = {}

class QuizQuestion(BaseModel):
    id: str
    type: str  # "multiple_choice", "short_answer", "practical"
    question: str
    options: Optional[List[str]] = None  # for MCQ
    answer: Optional[str] = None  # for MCQ
    explanation: Optional[str] = None  # for MCQ
    key_points: Optional[List[str]] = None  # for short answer
    task: Optional[str] = None  # for practical
    success_criteria: Optional[List[str]] = None  # for practical

class Assignment(BaseModel):
    title: str
    description: str
    requirements: List[str]
    rubric: Dict[str, str]
    submission_format: Optional[str] = None

class QuizBlock(BaseModel):
    questions: List[QuizQuestion]
    assignment: Optional[Assignment] = None

class Timeline(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    milestones: Optional[List[Dict[str, str]]] = None  # [{"date": "2024-01-15", "label": "Complete Module 1"}]

class CourseMeta(BaseModel):
    title: str
    level: Optional[str] = None
    duration: str
    milestones: Optional[List[str]] = None
    final_competency: Optional[str] = None
    source_filename: str
    structured: bool  # Whether JSON blocks were detected

# SQLModel tables
class Course(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Course metadata
    title: str
    level: Optional[str] = None
    duration: str
    milestones: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    final_competency: Optional[str] = None
    source_filename: str
    structured: bool = False  # Whether JSON blocks were detected
    
    # Course content as JSON
    timeline: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    library: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))  # Global resource pack
    
    # Relationships
    modules: List["Module"] = Relationship(back_populates="course")
    progress_records: List["Progress"] = Relationship(back_populates="course")

class Module(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    course_id: str = Field(foreign_key="course.id")
    
    # Module basic info
    index: int  # 1-based
    title: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    
    # Module content as JSON
    objectives: List[str] = Field(sa_column=Column(JSON))
    summary_notes: List[str] = Field(sa_column=Column(JSON))
    pitfalls: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    
    # Complex nested data
    resources: Dict[str, Any] = Field(sa_column=Column(JSON))  # ResourcePack
    daily_plan: Dict[str, Any] = Field(sa_column=Column(JSON))  # DailyPlan
    quiz: Dict[str, Any] = Field(sa_column=Column(JSON))  # QuizBlock
    assignment: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))  # Assignment
    
    # Relationships
    course: Course = Relationship(back_populates="modules")
    progress_records: List["Progress"] = Relationship(back_populates="module")

class Progress(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    course_id: str = Field(foreign_key="course.id")
    module_id: Optional[str] = Field(default=None, foreign_key="module.id")
    user_id: str = Field(default="default_user")  # No auth for MVP
    
    # Progress tracking
    day_key: Optional[str] = None  # e.g., "day_1", "day_2"
    minutes_spent: int = 0
    actions_completed: List[str] = Field(default_factory=list, sa_column=Column(JSON))  # Action IDs/descriptions
    quiz_score: Optional[float] = None  # 0-100
    notes: Optional[str] = None
    
    # Status
    module_completed: bool = False
    last_accessed: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    course: Course = Relationship(back_populates="progress_records")
    module: Optional[Module] = Relationship(back_populates="progress_records")

# Response models
class CourseResponse(BaseModel):
    meta: CourseMeta
    modules: List[Dict[str, Any]]  # Will be ModuleJSON in practice
    timeline: Optional[Timeline] = None
    library: Optional[ResourcePack] = None
    progress: Optional[Dict[str, Any]] = None  # Current user progress summary

class ModuleResponse(BaseModel):
    index: int
    title: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    objectives: List[str]
    summary_notes: List[str]
    pitfalls: Optional[List[str]] = None
    resources: ResourcePack
    daily_plan: DailyPlan
    quiz: QuizBlock
    assignment: Optional[Assignment] = None
    progress: Optional[Dict[str, Any]] = None  # User progress for this module

class ProgressRequest(BaseModel):
    course_id: str
    module_index: Optional[int] = None
    day_key: Optional[str] = None
    minutes: int = 0
    actions_done: List[str] = []
    quiz_score: Optional[float] = None
    notes: Optional[str] = None
    completed: bool = False

class ProgressResponse(BaseModel):
    success: bool
    message: str
    total_minutes: int
    modules_completed: int
    current_module: Optional[int] = None
    current_day: Optional[str] = None
