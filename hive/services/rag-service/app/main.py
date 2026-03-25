import logging

import google.generativeai as genai
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.database import init_db
from app.config.settings import settings
from app.routers.ingest_router import router as ingest_router
from app.routers.query_router import router as query_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("rag-service")

app = FastAPI(title="HIVE RAG Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest_router, prefix="/api/rag", tags=["ingest"])
app.include_router(query_router, prefix="/api/rag", tags=["query"])


@app.on_event("startup")
def startup_event() -> None:
    init_db()

    genai.configure(api_key=settings.gemini_api_key)
    _ = genai.GenerativeModel(settings.gemini_model)

    logger.info("RAG Service started successfully")


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "rag-service"}
