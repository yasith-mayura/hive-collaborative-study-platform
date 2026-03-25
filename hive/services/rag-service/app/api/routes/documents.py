"""
Document management endpoints — listing and deleting ingested documents.
Called by resource-service (delete) and admin dashboards (listing).
"""
import logging
from fastapi import APIRouter, HTTPException

from app.models.schemas import DocumentListResponse, DocumentInfo, ErrorResponse
from app.services.embedding_service import delete_document_embeddings
from app.core.vector_store import get_vector_store

logger = logging.getLogger("rag-service.documents")

router = APIRouter(prefix="/api/rag", tags=["Documents"])


@router.delete(
    "/documents/{resourceId}",
    responses={500: {"model": ErrorResponse}},
    summary="Delete all embeddings for a resource",
)
async def delete_document(resourceId: str):
    """
    Called by resource-service when a resource is deleted.
    Removes all vector embeddings for the given resourceId.
    """
    logger.info(f"🗑️  Delete request for resource: {resourceId}")

    try:
        deleted_count = await delete_document_embeddings(resourceId)

        return {
            "message": f"Deleted {deleted_count} embeddings",
            "resourceId": resourceId,
            "deletedChunks": deleted_count,
            "status": "success",
        }

    except Exception as e:
        logger.error(f"❌ Delete failed for {resourceId}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/documents",
    summary="List all ingested documents (grouped by resource)",
)
async def list_documents(subjectCode: str = None):
    """
    List all ingested documents, optionally filtered by subjectCode.
    Returns unique documents with their chunk counts.
    """
    logger.info(f"📋 Listing documents (filter: {subjectCode or 'none'})")

    try:
        store = get_vector_store()

        # Build filter
        filter_dict = {}
        if subjectCode:
            filter_dict["subjectCode"] = subjectCode.upper()

        # Query for all documents (use a large k to get all)
        results = store.similarity_search(
            query="",
            k=10000,
            filter=filter_dict if filter_dict else None,
        )

        # Group by resourceId
        documents_map = {}
        for doc in results:
            rid = doc.metadata.get("resourceId", "unknown")
            if rid not in documents_map:
                documents_map[rid] = {
                    "resourceId": rid,
                    "subjectCode": doc.metadata.get("subjectCode", ""),
                    "subjectName": doc.metadata.get("subjectName", ""),
                    "fileName": doc.metadata.get("fileName", ""),
                    "resourceType": doc.metadata.get("resourceType", ""),
                    "chunksCount": 0,
                }
            documents_map[rid]["chunksCount"] += 1

        documents = list(documents_map.values())

        return {
            "totalDocuments": len(documents),
            "documents": documents,
        }

    except Exception as e:
        logger.error(f"❌ List documents failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/documents/stats",
    summary="Get document statistics by subject",
)
async def document_stats():
    """
    Get statistics about ingested documents grouped by subject.
    """
    logger.info("📊 Getting document stats")

    try:
        store = get_vector_store()

        results = store.similarity_search(
            query="",
            k=10000,
        )

        # Group by subjectCode
        subject_stats = {}
        for doc in results:
            code = doc.metadata.get("subjectCode", "unknown")
            if code not in subject_stats:
                subject_stats[code] = {
                    "subjectCode": code,
                    "subjectName": doc.metadata.get("subjectName", ""),
                    "documentCount": 0,
                    "totalChunks": 0,
                    "resourceIds": set(),
                }
            subject_stats[code]["totalChunks"] += 1
            subject_stats[code]["resourceIds"].add(doc.metadata.get("resourceId", ""))

        # Convert sets to counts
        stats_list = []
        for code, stats in subject_stats.items():
            stats["documentCount"] = len(stats["resourceIds"])
            del stats["resourceIds"]
            stats_list.append(stats)

        return {
            "totalSubjects": len(stats_list),
            "totalChunks": sum(s["totalChunks"] for s in stats_list),
            "subjects": stats_list,
        }

    except Exception as e:
        logger.error(f"❌ Document stats failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
