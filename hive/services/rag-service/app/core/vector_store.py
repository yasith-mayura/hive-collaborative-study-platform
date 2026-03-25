"""
LangChain PGVector vector store configuration.
"""
import logging
from langchain_postgres import PGVector
from app.config import settings
from app.core.database import get_connection_string
from app.core.embeddings import get_embeddings

logger = logging.getLogger("rag-service.vector_store")

# Singleton vector store instance
_vector_store_instance = None


def get_vector_store() -> PGVector:
    """
    Return a singleton PGVector store instance.
    Uses the Gemini embeddings and PostgreSQL connection.
    """
    global _vector_store_instance

    if _vector_store_instance is None:
        logger.info(f"Initializing PGVector store (collection: {settings.collection_name})")

        _vector_store_instance = PGVector(
            embeddings=get_embeddings(),
            collection_name=settings.collection_name,
            connection=get_connection_string(),
            use_jsonb=True,  # enables metadata filtering
        )

        logger.info("✅ PGVector store initialized")

    return _vector_store_instance


def initialize_vector_store() -> bool:
    """
    Initialize the vector store on startup.
    Creates the collection table if it doesn't exist.
    Returns True on success.
    """
    try:
        store = get_vector_store()
        logger.info(f"✅ Vector store ready (collection: {settings.collection_name})")
        return True
    except Exception as e:
        logger.error(f"❌ Vector store initialization failed: {e}")
        return False
