"""
Global error handlers for the FastAPI application.
"""
import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

logger = logging.getLogger("rag-service.errors")


def register_error_handlers(app: FastAPI):
    """Register global error handlers on the FastAPI app."""

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle request validation errors with user-friendly messages."""
        logger.warning(f"Validation error: {exc.errors()}")
        return JSONResponse(
            status_code=400,
            content={
                "message": "Invalid request data",
                "detail": str(exc.errors()),
                "status": "error",
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Catch-all handler for unhandled exceptions."""
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "message": "Internal server error",
                "detail": str(exc),
                "status": "error",
            },
        )
