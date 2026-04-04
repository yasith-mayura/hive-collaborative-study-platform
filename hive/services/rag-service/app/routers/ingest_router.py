import logging

from fastapi import APIRouter, HTTPException

from app.models.schemas import IngestRequest, IngestResponse
from app.pipelines.embedding_pipeline import EmbeddingPipeline
from app.services.vector_store_service import VectorStoreService

logger = logging.getLogger("rag-service.ingest-router")

router = APIRouter()


@router.post("/ingest", response_model=IngestResponse)
def ingest_document(request: IngestRequest):
    try:
        pipeline = EmbeddingPipeline()
        return pipeline.run(request)
    except Exception as exc:
        logger.exception("Ingest failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete("/documents/{resourceId}")
def delete_resource_vectors(resourceId: str):
    try:
        service = VectorStoreService()
        deleted = service.delete_by_resource_id(resourceId)
        return {
            "success": deleted,
            "resourceId": resourceId,
            "message": "Document vectors deleted" if deleted else "No vectors found",
        }
    except Exception as exc:
        logger.exception("Delete failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/stats")
def get_vector_stats():
    try:
        service = VectorStoreService()
        return {"subjects": service.get_subjects_stats()}
    except Exception as exc:
        logger.exception("Stats retrieval failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
