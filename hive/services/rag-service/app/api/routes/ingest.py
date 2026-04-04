"""
Ingest endpoint — triggers the embedding pipeline when a PDF is uploaded.
Called by the resource-service.
"""
import logging
from fastapi import APIRouter, HTTPException

from app.models.schemas import IngestRequest, IngestResponse, ErrorResponse
from app.services.embedding_service import run_embedding_pipeline

logger = logging.getLogger("rag-service.ingest")

router = APIRouter(prefix="/api/rag", tags=["Ingest"])


@router.post(
    "/ingest",
    response_model=IngestResponse,
    responses={500: {"model": ErrorResponse}},
    summary="Trigger embedding pipeline for a new PDF",
)
async def ingest_document(request: IngestRequest):
    """
    Triggered by resource-service when a new PDF is uploaded.
    Downloads the PDF, extracts text, chunks it, and stores embeddings
    in PGVector with subjectCode metadata.
    """
    logger.info(f"📥 Ingest request received for {request.resourceId} ({request.fileName})")

    try:
        chunks_created = await run_embedding_pipeline(request)

        if chunks_created == 0:
            return IngestResponse(
                message="Document already ingested or no text found",
                resourceId=request.resourceId,
                subjectCode=request.subjectCode,
                chunksCreated=0,
                status="skipped",
            )

        return IngestResponse(
            message=f"Successfully embedded {chunks_created} chunks",
            resourceId=request.resourceId,
            subjectCode=request.subjectCode,
            chunksCreated=chunks_created,
            status="success",
        )

    except Exception as e:
        logger.error(f"❌ Ingest failed for {request.resourceId}: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )
