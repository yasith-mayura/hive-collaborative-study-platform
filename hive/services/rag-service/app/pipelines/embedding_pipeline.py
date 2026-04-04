import logging

from app.models.schemas import IngestRequest, IngestResponse
from app.services.embedding_service import EmbeddingService
from app.services.pdf_service import PDFService
from app.services.vector_store_service import VectorStoreService

logger = logging.getLogger("rag-service.embedding-pipeline")


class EmbeddingPipeline:
    def __init__(self) -> None:
        self.pdf_service = PDFService()
        self.embedding_service = EmbeddingService()
        self.vector_store = VectorStoreService()

    def run(self, request: IngestRequest) -> IngestResponse:
        pdf_bytes = self.pdf_service.download_from_s3(request.s3Url)

        text = self.pdf_service.extract_text(pdf_bytes)
        if not text:
            raise ValueError("Could not extract text")

        chunks = self.pdf_service.chunk_text(text)
        logger.info("Created %s chunks from %s", len(chunks), request.fileName)

        embeddings = self.embedding_service.create_embeddings_batch(chunks)
        logger.info("Generated %s embeddings", len(embeddings))

        metadata = {
            "subject_code": request.subjectCode,
            "resource_id": request.resourceId,
            "resource_type": request.resourceType,
            "file_name": request.fileName,
        }
        count = self.vector_store.store_chunks(chunks, embeddings, metadata)

        return IngestResponse(
            success=True,
            resourceId=request.resourceId,
            subjectCode=request.subjectCode,
            chunks_created=count,
            message=f"Successfully embedded {count} chunks",
        )
