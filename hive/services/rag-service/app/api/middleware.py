"""
Request logging middleware.
Logs every incoming request and its response status.
"""
import logging
import time
from fastapi import Request

logger = logging.getLogger("rag-service.middleware")


async def request_logging_middleware(request: Request, call_next):
    """Log request method, path, and response time."""
    start_time = time.time()

    # Log incoming request
    logger.info(f"→ {request.method} {request.url.path}")

    response = await call_next(request)

    # Calculate processing time
    process_time = time.time() - start_time
    logger.info(
        f"← {request.method} {request.url.path} "
        f"[{response.status_code}] ({process_time:.3f}s)"
    )

    # Add processing time header
    response.headers["X-Process-Time"] = f"{process_time:.3f}"

    return response
