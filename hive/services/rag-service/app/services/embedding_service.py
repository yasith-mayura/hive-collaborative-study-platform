import logging
import time
from typing import List

import google.generativeai as genai

from app.config.settings import settings

logger = logging.getLogger("rag-service.embedding-service")


class EmbeddingService:
    def __init__(self) -> None:
        genai.configure(api_key=settings.gemini_api_key)
        self.model = settings.embedding_model

    @staticmethod
    def _extract_embedding(response: dict) -> List[float]:
        if not response:
            raise RuntimeError("Empty embedding response")

        embedding = response.get("embedding")
        if isinstance(embedding, dict) and "values" in embedding:
            return embedding["values"]
        if isinstance(embedding, list):
            return embedding

        raise RuntimeError("Unexpected embedding response format")

    def create_embedding(self, text: str) -> List[float]:
        response = genai.embed_content(
            model=self.model,
            content=text,
            task_type="retrieval_document",
        )
        return self._extract_embedding(response)

    def create_query_embedding(self, text: str) -> List[float]:
        response = genai.embed_content(
            model=self.model,
            content=text,
            task_type="retrieval_query",
        )
        return self._extract_embedding(response)

    def create_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        all_embeddings: List[List[float]] = []
        batch_size = 10

        for idx in range(0, len(texts), batch_size):
            batch = texts[idx : idx + batch_size]
            for text in batch:
                all_embeddings.append(self.create_embedding(text))
            if idx + batch_size < len(texts):
                time.sleep(1)

        logger.info("Created %s embeddings", len(all_embeddings))
        return all_embeddings
