import logging
import re
import time
from typing import List

import google.generativeai as genai
from google.api_core.exceptions import PermissionDenied

from app.config.settings import settings
from app.models.schemas import ChatMessage

logger = logging.getLogger("rag-service.gemini-service")


def _is_rate_limit_error(exc: Exception) -> bool:
    error_text = str(exc).lower()
    return "429" in error_text or "resource_exhausted" in error_text or "quota" in error_text


def _is_transient_error(exc: Exception) -> bool:
    error_text = str(exc).lower()
    return any(m in error_text for m in [
        "503", "unavailable", "socket closed", "connection reset",
        "failed to connect", "timeout", "deadline exceeded",
    ])


def _is_retryable_error(exc: Exception) -> bool:
    return _is_rate_limit_error(exc) or _is_transient_error(exc)


def _extract_retry_delay(exc: Exception) -> float:
    match = re.search(r"retry in ([\d.]+)s", str(exc))
    if match:
        return min(float(match.group(1)) + 1, 60.0)
    return 30.0


class GeminiService:
    def __init__(self) -> None:
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel(settings.gemini_model)

    def build_system_prompt(self, subject_code: str, subject_name: str) -> str:
        return (
            "You are HIVE's AI study assistant for the subject "
            f"{subject_name} (ID: {subject_code}) at the University "
            "of Kelaniya, Sri Lanka. Your role is to help Software "
            "Engineering students understand their course materials.\n\n"
            "IMPORTANT RULES:\n"
            "- Only answer questions related to the provided context\n"
            "- If the context does not contain relevant information,\n"
            "  clearly state the question is outside the syllabus\n"
            "- Be concise, clear and helpful\n"
            "- Reference specific documents when answering\n"
            "- Use simple language suitable for undergraduate students"
        )

    def build_prompt(
        self,
        question: str,
        context_chunks: List[dict],
        chat_history: List[ChatMessage],
        subject_code: str,
        subject_name: str,
    ) -> str:
        system_prompt = self.build_system_prompt(subject_code=subject_code, subject_name=subject_name or subject_code)

        context_block = []
        for chunk in context_chunks:
            context_block.append(f"Source: {chunk.get('file_name', 'Unknown')}\n{chunk.get('content', '')}")

        history_block = []
        for message in chat_history[-10:]:
            role = message.role if hasattr(message, "role") else message.get("role", "user")
            content = message.content if hasattr(message, "content") else message.get("content", "")
            history_block.append(f"{role}: {content}")

        return (
            f"{system_prompt}\n\n"
            "RELEVANT STUDY MATERIALS:\n"
            f"{chr(10).join(context_block) if context_block else 'No supporting context found.'}\n\n"
            "CONVERSATION HISTORY:\n"
            f"{chr(10).join(history_block) if history_block else 'No previous messages.'}\n\n"
            f"STUDENT QUESTION: {question}\n\n"
            "ANSWER:"
        )

    def generate_response(self, prompt: str, max_retries: int = 3) -> str:
        for attempt in range(max_retries + 1):
            try:
                response = self.model.generate_content(prompt)
                return (response.text or "").strip()
            except PermissionDenied as exc:
                raise RuntimeError(
                    "service_unavailable: Gemini API key is invalid or has been revoked. Please update GEMINI_API_KEY."
                ) from exc
            except Exception as exc:
                if _is_retryable_error(exc):
                    if attempt < max_retries:
                        delay = _extract_retry_delay(exc) if _is_rate_limit_error(exc) else min(10.0 * (attempt + 1), 30.0)
                        logger.warning(
                            "Gemini retryable error (attempt %s/%s), waiting %.1fs: %s",
                            attempt + 1, max_retries, delay, type(exc).__name__,
                        )
                        time.sleep(delay)
                        continue
                    if _is_rate_limit_error(exc):
                        logger.error("Gemini API rate limit exhausted after %s retries", max_retries)
                        raise RuntimeError(
                            "rate_limited: Gemini API quota exhausted. Please try again in a minute."
                        ) from exc
                    logger.error("Gemini API unavailable after %s retries", max_retries)
                    raise RuntimeError(
                        "service_unavailable: Cannot reach Gemini API. Check your internet connection."
                    ) from exc
                logger.error("Gemini API error: %s", exc)
                raise RuntimeError("Failed to generate response from Gemini") from exc
        raise RuntimeError("Failed to generate response from Gemini")

    def is_out_of_syllabus(self, chunks: List[dict]) -> bool:
        if not chunks:
            return True
        threshold = settings.min_similarity_score
        return all(float(chunk.get("similarity_score", 0.0)) < threshold for chunk in chunks)
