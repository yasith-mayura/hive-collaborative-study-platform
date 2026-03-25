"""
Services module — business logic for PDF processing, embedding, retrieval, and chat.
"""
from app.services.pdf_service import download_and_extract_pdf
from app.services.chunking_service import chunk_pages_with_metadata
from app.services.embedding_service import run_embedding_pipeline, delete_document_embeddings
from app.services.retrieval_service import search_similar_chunks, check_relevance
from app.services.chat_service import generate_answer, generate_out_of_syllabus_response

__all__ = [
    "download_and_extract_pdf",
    "chunk_pages_with_metadata",
    "run_embedding_pipeline",
    "delete_document_embeddings",
    "search_similar_chunks",
    "check_relevance",
    "generate_answer",
    "generate_out_of_syllabus_response",
]
