"""
Core module — database, embeddings, vector store, and configuration.
"""
from app.core.database import get_connection_string, check_database_connection
from app.core.embeddings import get_embeddings
from app.core.vector_store import get_vector_store, initialize_vector_store
from app.core.constants import (
    RESOURCE_TYPES,
    DEFAULT_TOP_K,
    RELEVANCE_THRESHOLD,
    MAX_OUTPUT_TOKENS,
    TEMPERATURE,
)

__all__ = [
    "get_connection_string",
    "check_database_connection",
    "get_embeddings",
    "get_vector_store",
    "initialize_vector_store",
    "RESOURCE_TYPES",
    "DEFAULT_TOP_K",
    "RELEVANCE_THRESHOLD",
    "MAX_OUTPUT_TOKENS",
    "TEMPERATURE",
]
