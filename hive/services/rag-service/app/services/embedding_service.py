import logging
import re
import time
from typing import List

import google.generativeai as genai
from google.api_core.exceptions import PermissionDenied

from app.config.settings import settings

logger = logging.getLogger("rag-service.embedding-service")


class EmbeddingService:
    def __init__(self) -> None:
        genai.configure(api_key=settings.gemini_api_key)
        self.model = settings.embedding_model
        self._fallback_models = [
            "models/gemini-embedding-001",
            "gemini-embedding-001",
            "models/gemini-embedding-2-preview",
            "gemini-embedding-2-preview",
            "models/text-embedding-004",
            "text-embedding-004",
            "models/embedding-001",
            "embedding-001",
        ]

    @staticmethod
    def _is_model_unavailable_error(exc: Exception) -> bool:
        error_text = str(exc).lower()
        markers = [
            "not found",
            "not supported for embedcontent",
            "unsupported model",
            "model not found",
            "statuscode.not_found",
            " 404 ",
        ]
        return any(marker in error_text for marker in markers)

    @staticmethod
    def _is_rate_limit_error(exc: Exception) -> bool:
        error_text = str(exc).lower()
        return "429" in error_text or "resource_exhausted" in error_text or "quota" in error_text

    @staticmethod
    def _is_transient_error(exc: Exception) -> bool:
        error_text = str(exc).lower()
        return any(m in error_text for m in [
            "503", "unavailable", "socket closed", "connection reset",
            "failed to connect", "timeout", "deadline exceeded",
        ])

    @staticmethod
    def _is_retryable_error(exc: Exception) -> bool:
        return EmbeddingService._is_rate_limit_error(exc) or EmbeddingService._is_transient_error(exc)

    @staticmethod
    def _extract_retry_delay(exc: Exception) -> float:
        match = re.search(r"retry in ([\d.]+)s", str(exc))
        if match:
            return min(float(match.group(1)) + 1, 60.0)
        return 30.0

    def _candidate_models(self) -> List[str]:
        candidates = [self.model, *self._fallback_models]
        seen = set()
        ordered_candidates: List[str] = []
        for candidate in candidates:
            if candidate and candidate not in seen:
                seen.add(candidate)
                ordered_candidates.append(candidate)
        return ordered_candidates

    def _discover_embedding_models(self) -> List[str]:
        discovered: List[str] = []
        try:
            for model in genai.list_models():
                methods = getattr(model, "supported_generation_methods", None) or []
                if "embedContent" in methods and getattr(model, "name", None):
                    discovered.append(model.name)
            if discovered:
                logger.info("Discovered %s embed-capable model(s) from Gemini API", len(discovered))
        except Exception as exc:
            logger.warning("Unable to discover embedding models via ListModels: %s", exc)
        return discovered

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
        response = self._embed_with_fallback(text=text, task_type="retrieval_document")
        return self._extract_embedding(response)

    def create_query_embedding(self, text: str) -> List[float]:
        response = self._embed_with_fallback(text=text, task_type="retrieval_query")
        return self._extract_embedding(response)

    def _embed_with_fallback(self, text: str, task_type: str, max_retries: int = 3) -> dict:
        attempted_models: List[str] = []
        first_failure: Exception | None = None
        candidate_models = self._candidate_models()
        discovery_attempted = False

        idx = 0
        while idx < len(candidate_models):
            candidate = candidate_models[idx]
            idx += 1

            attempted_models.append(candidate)
            for retry in range(max_retries + 1):
                try:
                    response = genai.embed_content(model=candidate, content=text, task_type=task_type)
                    if candidate != self.model:
                        logger.warning(
                            "Embedding model %s unavailable; switched to %s",
                            self.model,
                            candidate,
                        )
                        self.model = candidate
                    return response
                except PermissionDenied as exc:
                    raise RuntimeError(
                        "service_unavailable: Gemini API key is invalid or has been revoked. Please update GEMINI_API_KEY."
                    ) from exc
                except Exception as exc:
                    if first_failure is None:
                        first_failure = exc

                    if self._is_retryable_error(exc):
                        if retry < max_retries:
                            delay = self._extract_retry_delay(exc) if self._is_rate_limit_error(exc) else min(10.0 * (retry + 1), 30.0)
                            logger.warning(
                                "Retryable error on %s (attempt %s/%s), waiting %.1fs: %s",
                                candidate, retry + 1, max_retries, delay, type(exc).__name__,
                            )
                            time.sleep(delay)
                            continue
                        else:
                            raise

                    if not self._is_model_unavailable_error(exc):
                        raise
                    logger.warning("Embedding model %s unavailable: %s", candidate, exc)
                    break  # try next model

            if not discovery_attempted:
                discovery_attempted = True
                discovered = self._discover_embedding_models()
                for discovered_model in discovered:
                    if discovered_model not in candidate_models:
                        candidate_models.append(discovered_model)
            continue

        raise RuntimeError(
            "No supported embedding model available. Attempted: "
            + ", ".join(attempted_models)
        ) from first_failure

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
