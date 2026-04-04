"""
Google Gemini Embeddings wrapper using LangChain.
"""
import logging
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.config import settings

logger = logging.getLogger("rag-service.embeddings")

# Singleton embedding model instance
_embeddings_instance = None


def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    """
    Return a singleton GoogleGenerativeAIEmbeddings instance.
    Uses the Gemini embedding model specified in settings.
    """
    global _embeddings_instance

    if _embeddings_instance is None:
        logger.info(f"Initializing Gemini embeddings with model: {settings.embedding_model}")
        _embeddings_instance = GoogleGenerativeAIEmbeddings(
            model=settings.embedding_model,
            google_api_key=settings.google_api_key,
        )
        logger.info("✅ Gemini embeddings initialized")

    return _embeddings_instance
