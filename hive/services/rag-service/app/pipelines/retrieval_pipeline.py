import logging

from app.models.schemas import QueryRequest, QueryResponse
from app.services.embedding_service import EmbeddingService
from app.services.gemini_service import GeminiService
from app.services.vector_store_service import VectorStoreService

logger = logging.getLogger("rag-service.retrieval-pipeline")


class RetrievalPipeline:
    def __init__(self) -> None:
        self.embedding_service = EmbeddingService()
        self.vector_store = VectorStoreService()
        self.gemini_service = GeminiService()

    def run(self, request: QueryRequest, subject_name: str = "") -> QueryResponse:
        query_embedding = self.embedding_service.create_query_embedding(request.question)
        logger.info("Query embedding created")

        chunks = self.vector_store.similarity_search(
            query_embedding=query_embedding,
            subject_code=request.subjectCode,
            top_k=3,
        )
        logger.info("Retrieved %s chunks for subject %s", len(chunks), request.subjectCode)

        if self.gemini_service.is_out_of_syllabus(chunks):
            return QueryResponse(
                answer=(
                    "This question appears to be outside the syllabus for this subject. "
                    "Please refer to your course materials or ask your lecturer."
                ),
                sources=[],
                subjectCode=request.subjectCode,
                is_out_of_syllabus=True,
                chunks_used=0,
            )

        prompt = self.gemini_service.build_prompt(
            question=request.question,
            context_chunks=chunks,
            chat_history=request.chat_history,
            subject_code=request.subjectCode,
            subject_name=subject_name or request.subjectCode,
        )

        answer = self.gemini_service.generate_response(prompt)

        sources = sorted(list({c.get("file_name", "Unknown") for c in chunks}))

        return QueryResponse(
            answer=answer,
            sources=sources,
            subjectCode=request.subjectCode,
            is_out_of_syllabus=False,
            chunks_used=len(chunks),
        )
