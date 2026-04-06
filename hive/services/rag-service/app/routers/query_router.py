import json
import logging
from urllib.error import URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from fastapi import APIRouter, HTTPException

from app.config.settings import settings
from app.models.schemas import QueryRequest, QueryResponse
from app.pipelines.retrieval_pipeline import RetrievalPipeline
from app.services.vector_store_service import VectorStoreService

logger = logging.getLogger("rag-service.query-router")

router = APIRouter()


def _fetch_subject_name(subject_code: str) -> str:
    encoded = quote(subject_code, safe="")
    url = f"{settings.resource_service_url}/resources/subject/{encoded}"
    req = Request(url, method="GET")
    try:
        with urlopen(req, timeout=5) as response:  # nosec B310
            payload = json.loads(response.read().decode("utf-8"))
            subject = payload.get("subject", {})
            return subject.get("subjectName", "")
    except (URLError, TimeoutError, json.JSONDecodeError, ValueError):
        return ""


@router.post("/query", response_model=QueryResponse)
def query_subject_assistant(request: QueryRequest):
    try:
        subject_name = _fetch_subject_name(request.subjectCode)
        pipeline = RetrievalPipeline()
        return pipeline.run(request=request, subject_name=subject_name)
    except Exception as exc:
        error_msg = str(exc).lower()
        if "rate_limited" in error_msg or "quota" in error_msg or "429" in error_msg:
            logger.warning("Query rate limited: %s", exc)
            raise HTTPException(status_code=429, detail="AI quota exceeded. Please wait a minute and try again.") from exc
        if "service_unavailable" in error_msg or "unavailable" in error_msg or "failed to connect" in error_msg:
            logger.warning("Query service unavailable: %s", exc)
            detail = str(exc)
            if "service_unavailable:" in detail:
                detail = detail.split("service_unavailable:", 1)[1].strip()
            raise HTTPException(status_code=503, detail=detail or "Cannot reach AI service. Please check your internet connection and try again.") from exc
        logger.exception("Query failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/chat", response_model=QueryResponse)
def chat_subject_assistant(request: QueryRequest):
    return query_subject_assistant(request)


@router.get("/subjects/{subjectCode}/status")
def get_subject_embedding_status(subjectCode: str):
    try:
        service = VectorStoreService()
        return service.get_subject_status(subjectCode)
    except Exception as exc:
        logger.exception("Status retrieval failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
