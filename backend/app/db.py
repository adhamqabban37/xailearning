"""
Database configuration and session management for AI Learning Platform
"""

from sqlmodel import SQLModel, create_engine, Session
from typing import Generator
import os

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ai_learning_platform.db")

# Create engine with proper configuration
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Set to False in production
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

def init_db() -> None:
    """
    Initialize database and create all tables
    """
    SQLModel.metadata.create_all(engine)
    print("Database tables created successfully")

def get_session() -> Generator[Session, None, None]:
    """
    Dependency to get database session
    """
    with Session(engine) as session:
        yield session