"""
Routes package — all API route modules.
"""
from app.api.routes.health import router as health_router
from app.api.routes.ingest import router as ingest_router
from app.api.routes.chat import router as chat_router
from app.api.routes.documents import router as documents_router

__all__ = [
    "health_router",
    "ingest_router",
    "chat_router",
    "documents_router",
]
