"""
Text chunking service using LangChain's RecursiveCharacterTextSplitter.
Splits extracted PDF text into overlapping chunks with metadata.
"""
import logging
from typing import List, Tuple, Dict, Any

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

from app.config import settings

logger = logging.getLogger("rag-service.chunking_service")


def create_text_splitter() -> RecursiveCharacterTextSplitter:
    """Create a text splitter with the configured chunk size and overlap."""
    return RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )


def chunk_pages_with_metadata(
    pages: List[Tuple[int, str]],
    metadata: Dict[str, Any],
) -> List[Document]:
    """
    Split page texts into chunks and attach metadata to each chunk.

    Args:
        pages: List of (page_number, page_text) tuples from PDF extraction.
        metadata: Base metadata dict (resourceId, subjectCode, etc.)

    Returns:
        List of LangChain Document objects with content and metadata.
    """
    splitter = create_text_splitter()
    all_chunks: List[Document] = []

    for page_num, page_text in pages:
        # Split this page's text into chunks
        chunks = splitter.split_text(page_text)

        for chunk_idx, chunk_text in enumerate(chunks):
            # Build per-chunk metadata
            chunk_metadata = {
                **metadata,
                "page": page_num,
                "chunk_index": chunk_idx,
            }

            doc = Document(
                page_content=chunk_text,
                metadata=chunk_metadata,
            )
            all_chunks.append(doc)

    logger.info(
        f"Created {len(all_chunks)} chunks from {len(pages)} pages "
        f"(chunk_size={settings.chunk_size}, overlap={settings.chunk_overlap})"
    )
    return all_chunks
