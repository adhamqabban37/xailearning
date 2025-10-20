from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional, Dict, Any
from datetime import datetime

class LessonBase(SQLModel):
    day_number: int
    topic: str
    duration: int = 60  # minutes
    summary: Optional[str] = None
    content: Optional[str] = None
    resources: List[str] = Field(default_factory=list)
    mini_project: Optional[str] = None
    quiz_questions: List[Dict[str, Any]] = Field(default_factory=list)

class Lesson(LessonBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="course.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    course: Optional["Course"] = Relationship(back_populates="lessons")

class LessonCreate(LessonBase):
    course_id: int

class LessonRead(LessonBase):
    id: int
    course_id: int
    created_at: datetime
    updated_at: datetime

class LessonUpdate(SQLModel):
    topic: Optional[str] = None
    duration: Optional[int] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    resources: Optional[List[str]] = None
    mini_project: Optional[str] = None
    quiz_questions: Optional[List[Dict[str, Any]]] = None
