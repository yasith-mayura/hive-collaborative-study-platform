"""
Health check and root endpoints.
"""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/")
def root():
    """Service information."""
    return {
        "status": "OK",
        "service": "rag-service",
        "version": "1.0.0",
        "description": "HIVE AI-powered study assistant (RAG with Gemini + PGVector)",
        "endpoints": {
            "health": "GET /health",
            "ingest": "POST /api/rag/ingest",
            "chat": "POST /api/rag/chat",
            "documents": "GET /api/rag/documents",
            "delete": "DELETE /api/rag/documents/{resourceId}",
        },
    }


@router.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "OK",
        "service": "rag-service",
        "timestamp": datetime.utcnow().isoformat(),
    }
