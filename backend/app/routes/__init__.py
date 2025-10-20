#!/usr/bin/env python3
"""
API routes module for FastAPI application.
Registers all route handlers.
"""

from fastapi import APIRouter
from .pdf_parser import router as pdf_router

# Main API router
api_router = APIRouter(prefix="/api")

# Include PDF parsing routes
api_router.include_router(pdf_router, tags=["pdf"])

# Add other route modules here as needed
# api_router.include_router(course_router, prefix="/courses", tags=["courses"])
# api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])