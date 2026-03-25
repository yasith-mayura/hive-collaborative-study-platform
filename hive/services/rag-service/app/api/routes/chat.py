"""
Chat endpoint — the retrieval pipeline for student questions.
Receives a question + subjectCode + chatHistory from the frontend,
retrieves relevant context, and generates an answer using Gemini.
"""
import logging
from fastapi import APIRouter, HTTPException

from app.models.schemas import ChatRequest, ChatResponse, ErrorResponse
from app.services.retrieval_service import (
    search_similar_chunks,
    check_relevance,
    build_context_from_results,
    get_source_references,
)
from app.services.chat_service import generate_answer, generate_out_of_syllabus_response

logger = logging.getLogger("rag-service.chat")

router = APIRouter(prefix="/api/rag", tags=["Chat"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    responses={500: {"model": ErrorResponse}},
    summary="Ask a question — RAG retrieval pipeline",
)
async def chat(request: ChatRequest):
    """
    Student asks a question about a subject.
    1. Search PGVector for relevant chunks filtered by subjectCode
    2. Check if results are relevant (out-of-syllabus detection)
    3. Build context from search results
    4. Generate answer using Gemini with context + chat history
    5. Return answer with source references
    """
    logger.info(
        f"💬 Chat request | Subject: {request.subjectCode} | "
        f"Question: '{request.question[:60]}...' | "
        f"History: {len(request.chatHistory)} messages"
    )

    try:
        # Step 1: Search for relevant chunks
        results = search_similar_chunks(
            query=request.question,
            subject_code=request.subjectCode,
            k=5,
        )

        # Step 2: Check relevance
        if not check_relevance(results):
            out_of_syllabus = await generate_out_of_syllabus_response(request.subjectCode)
            return ChatResponse(
                answer=out_of_syllabus,
                sources=[],
                subjectCode=request.subjectCode,
            )

        # Step 3: Build context from results
        context = build_context_from_results(results)
        sources = get_source_references(results)

        # Step 4: Generate answer with Gemini
        answer = await generate_answer(
            question=request.question,
            context=context,
            chat_history=request.chatHistory,
            subject_code=request.subjectCode,
        )

        # Step 5: Return response
        return ChatResponse(
            answer=answer,
            sources=sources,
            subjectCode=request.subjectCode,
        )

    except Exception as e:
        logger.error(f"❌ Chat failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )
