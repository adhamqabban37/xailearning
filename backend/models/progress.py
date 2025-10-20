from sqlmodel import SQLModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class ProgressBase(SQLModel):
    user_id: str
    course_id: int
    lesson_id: int
    completed: bool = False
    time_spent: int = 0  # minutes
    quiz_score: Optional[float] = None
    quiz_answers: Dict[str, Any] = Field(default_factory=dict)

class Progress(ProgressBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProgressCreate(ProgressBase):
    pass

class ProgressRead(ProgressBase):
    id: int
    created_at: datetime
    updated_at: datetime

class ProgressUpdate(SQLModel):
    completed: Optional[bool] = None
    time_spent: Optional[int] = None
    quiz_score: Optional[float] = None
    quiz_answers: Optional[Dict[str, Any]] = None
