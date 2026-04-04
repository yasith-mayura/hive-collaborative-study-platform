"""
Chat service — Gemini LLM integration for RAG-powered answers.
Builds prompts with context and chat history, calls Gemini for responses.
"""
import logging
from typing import List

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, AIMessage, SystemMessage

from app.config import settings
from app.models.schemas import ChatMessage
from app.core.prompts import SYSTEM_PROMPT_TEMPLATE, QUESTION_WITH_CONTEXT_TEMPLATE, OUT_OF_SYLLABUS_TEMPLATE
from app.core.constants import MAX_OUTPUT_TOKENS, TEMPERATURE

logger = logging.getLogger("rag-service.chat_service")

# Singleton LLM instance
_llm_instance = None


def get_llm() -> ChatGoogleGenerativeAI:
    """Return a singleton Gemini LLM instance."""
    global _llm_instance

    if _llm_instance is None:
        logger.info(f"Initializing Gemini LLM: {settings.gemini_model}")
        _llm_instance = ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=settings.google_api_key,
            temperature=TEMPERATURE,
            max_output_tokens=MAX_OUTPUT_TOKENS,
        )
        logger.info("✅ Gemini LLM initialized")

    return _llm_instance


def build_system_prompt(subject_code: str, subject_name: str = "") -> str:
    """Build the system prompt for the subject-specific assistant."""
    subject_suffix = f" ({subject_name})" if subject_name else ""
    return SYSTEM_PROMPT_TEMPLATE.format(
        subject_code=subject_code,
        subject_suffix=subject_suffix,
    )


def build_messages(
    question: str,
    context: str,
    chat_history: List[ChatMessage],
    subject_code: str,
) -> List:
    """
    Build the message list for Gemini including:
    1. System prompt
    2. Chat history
    3. Context + current question
    """
    messages = []

    # System prompt
    messages.append(SystemMessage(content=build_system_prompt(subject_code)))

    # Chat history (frontend manages this)
    for msg in chat_history:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            messages.append(AIMessage(content=msg.content))

    # Current question with context
    if context:
        user_prompt = QUESTION_WITH_CONTEXT_TEMPLATE.format(
            context=context,
            question=question,
        )
    else:
        user_prompt = question

    messages.append(HumanMessage(content=user_prompt))

    return messages


async def generate_answer(
    question: str,
    context: str,
    chat_history: List[ChatMessage],
    subject_code: str,
) -> str:
    """
    Generate an answer using Gemini with the provided context and chat history.

    Args:
        question: The student's question.
        context: Relevant text from vector search.
        chat_history: Previous conversation messages.
        subject_code: Subject code for the system prompt.

    Returns:
        The AI-generated answer string.
    """
    logger.info(f"Generating answer for: '{question[:60]}...'")

    llm = get_llm()
    messages = build_messages(question, context, chat_history, subject_code)

    response = await llm.ainvoke(messages)

    answer = response.content
    logger.info(f"Answer generated ({len(answer)} chars)")

    return answer


async def generate_out_of_syllabus_response(subject_code: str) -> str:
    """Return the out-of-syllabus message."""
    return OUT_OF_SYLLABUS_TEMPLATE.format(subject_code=subject_code)
