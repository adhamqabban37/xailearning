#!/usr/bin/env python3
"""
FastAPI route for PDF parsing functionality.
Equivalent to Express route but using FastAPI and pdfplumber for better text extraction.
"""

from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import pdfplumber
import io
from typing import Dict, Any, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# 20MB file size limit
MAX_FILE_SIZE = 20 * 1024 * 1024

@router.post("/parse-pdf")
async def parse_pdf(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Parse PDF file and return structured JSON data.
    
    Args:
        file: Uploaded PDF file (multipart/form-data)
        
    Returns:
        JSON response with parsed PDF data
        
    Raises:
        HTTPException: If file is invalid or parsing fails
    """
    try:
        # Validate file presence
        if not file:
            raise HTTPException(status_code=400, detail="No file uploaded")
        
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Read file content
        content = await file.read()
        
        # Check file size
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413, 
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Parse PDF using pdfplumber
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            
            # Extract metadata
            metadata = pdf.metadata or {}
            pdf_data = {
                "metadata": {
                    "title": metadata.get('Title', ''),
                    "author": metadata.get('Author', ''),
                    "subject": metadata.get('Subject', ''),
                    "creator": metadata.get('Creator', ''),
                    "producer": metadata.get('Producer', ''),
                    "creation_date": str(metadata.get('CreationDate', '')),
                    "modification_date": str(metadata.get('ModDate', '')),
                    "page_count": len(pdf.pages)
                },
                "pages": [],
                "tables": [],
                "images_count": 0
            }
            
            # Extract content from each page
            for page_num, page in enumerate(pdf.pages):
                try:
                    # Extract text
                    text = page.extract_text() or ""
                    
                    # Extract tables
                    tables = page.extract_tables()
                    page_tables = []
                    for table in tables:
                        if table:
                            page_tables.append({
                                "rows": table,
                                "row_count": len(table),
                                "col_count": len(table[0]) if table else 0
                            })
                    
                    # Count images
                    images = page.images
                    images_count = len(images) if images else 0
                    pdf_data["images_count"] += images_count
                    
                    # Add page data
                    pdf_data["pages"].append({
                        "page_number": page_num + 1,
                        "text": text.strip(),
                        "char_count": len(text),
                        "tables": page_tables,
                        "images_count": images_count,
                        "bbox": page.bbox,  # Page dimensions
                    })
                    
                    # Add tables to main tables array
                    for table in page_tables:
                        pdf_data["tables"].append({
                            "page": page_num + 1,
                            **table
                        })
                        
                except Exception as page_error:
                    logger.warning(f"Error extracting content from page {page_num + 1}: {page_error}")
                    pdf_data["pages"].append({
                        "page_number": page_num + 1,
                        "text": "",
                        "char_count": 0,
                        "tables": [],
                        "images_count": 0,
                        "error": str(page_error)
                    })
            
            # Calculate summary statistics
            total_text = " ".join([page["text"] for page in pdf_data["pages"]])
            pdf_data["summary"] = {
                "total_pages": len(pdf.pages),
                "total_characters": len(total_text),
                "total_words": len(total_text.split()) if total_text else 0,
                "total_tables": len(pdf_data["tables"]),
                "total_images": pdf_data["images_count"],
                "has_text": bool(total_text.strip()),
                "has_tables": len(pdf_data["tables"]) > 0,
                "has_images": pdf_data["images_count"] > 0
            }
        
        logger.info(f"Successfully parsed PDF: {file.filename} ({pdf_data['summary']['total_pages']} pages)")
        
        return {
            "ok": True,
            "filename": file.filename,
            "data": pdf_data
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as err:
        logger.error(f"Unexpected error parsing PDF {file.filename}: {err}")
        raise HTTPException(
            status_code=500, 
            detail=f"Server error: {str(err)}"
        )