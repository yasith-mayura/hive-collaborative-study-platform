"""
Retrieval service — similarity search with subjectCode filtering.
Queries PGVector for relevant document chunks.
"""
import logging
from typing import List, Tuple

from langchain.schema import Document

from app.config import settings
from app.core.vector_store import get_vector_store
from app.core.constants import RELEVANCE_THRESHOLD, DEFAULT_TOP_K

logger = logging.getLogger("rag-service.retrieval_service")


def search_similar_chunks(
    query: str,
    subject_code: str,
    k: int = 5,
) -> List[Tuple[Document, float]]:
    """
    Search for similar document chunks filtered by subjectCode.

    Args:
        query: The student's question.
        subject_code: Subject code to filter results.
        k: Number of results to return.

    Returns:
        List of (Document, score) tuples sorted by relevance.
    """
    logger.info(f"Searching for chunks related to: '{query[:60]}...' (subject: {subject_code})")

    store = get_vector_store()

    results = store.similarity_search_with_relevance_scores(
        query=query,
        k=k,
        filter={"subjectCode": subject_code},
    )

    logger.info(f"Found {len(results)} matching chunks for subject {subject_code}")

    # Log relevance scores
    for doc, score in results:
        logger.debug(
            f"  Score: {score:.4f} | Source: {doc.metadata.get('fileName', 'unknown')} "
            f"(page {doc.metadata.get('page', '?')})"
        )

    return results


def check_relevance(results: List[Tuple[Document, float]]) -> bool:
    """
    Check if any results are above the relevance threshold.
    Returns True if at least one result is relevant.
    """
    if not results:
        return False

    top_score = results[0][1] if results else 0
    is_relevant = top_score >= RELEVANCE_THRESHOLD

    if not is_relevant:
        logger.info(
            f"Top score {top_score:.4f} below threshold {RELEVANCE_THRESHOLD} — "
            "question likely out of syllabus"
        )

    return is_relevant


def build_context_from_results(results: List[Tuple[Document, float]]) -> str:
    """
    Build a context string from the search results for the LLM prompt.
    """
    context_parts = []

    for i, (doc, score) in enumerate(results):
        source = doc.metadata.get("fileName", "unknown")
        page = doc.metadata.get("page", "?")
        context_parts.append(
            f"[Source {i+1}: {source} (page {page})]\n{doc.page_content}"
        )

    return "\n\n---\n\n".join(context_parts)


def get_source_references(results: List[Tuple[Document, float]]) -> List[str]:
    """
    Extract unique source references from search results.
    """
    seen = set()
    sources = []

    for doc, score in results:
        ref = f"{doc.metadata.get('fileName', 'unknown')} (page {doc.metadata.get('page', '?')})"
        if ref not in seen:
            seen.add(ref)
            sources.append(ref)

    return sources
