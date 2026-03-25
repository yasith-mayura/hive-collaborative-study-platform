"""
Rate limiting utility for API endpoints.
Uses a simple in-memory token bucket approach.
"""
import time
import logging
from collections import defaultdict
from fastapi import HTTPException

logger = logging.getLogger("rag-service.rate_limiter")


class RateLimiter:
    """Simple in-memory rate limiter using token bucket algorithm."""

    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests = defaultdict(list)

    def check_rate_limit(self, client_id: str) -> bool:
        """
        Check if a client has exceeded the rate limit.
        Returns True if allowed, raises HTTPException if exceeded.
        """
        now = time.time()
        window_start = now - self.window_seconds

        # Clean old entries
        self._requests[client_id] = [
            t for t in self._requests[client_id] if t > window_start
        ]

        if len(self._requests[client_id]) >= self.max_requests:
            logger.warning(f"Rate limit exceeded for client: {client_id}")
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Max {self.max_requests} requests per {self.window_seconds}s",
            )

        self._requests[client_id].append(now)
        return True


# Default rate limiter for chat endpoint (10 requests per minute per IP)
chat_rate_limiter = RateLimiter(max_requests=10, window_seconds=60)

# Rate limiter for ingest endpoint (5 requests per minute)
ingest_rate_limiter = RateLimiter(max_requests=5, window_seconds=60)
