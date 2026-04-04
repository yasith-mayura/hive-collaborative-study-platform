# HIVE RAG Service

AI-powered study assistant using **RAG** (Retrieval-Augmented Generation) with Google Gemini, LangChain, and PGVector.

## Overview

This service powers the "AI Support" chatbot feature inside each subject on the HIVE platform. It provides subject-specific answers by retrieving relevant content from uploaded study materials (PDFs) and generating responses using Google Gemini.

### Key Features

- **Subject-specific answers** — Vectors filtered by `subjectCode` ensure answers come only from the relevant subject's materials
- **Two pipelines**:
  - **Embedding Pipeline** — Triggered when a PDF is uploaded via resource-service
  - **Retrieval Pipeline** — Triggered when a student asks a question
- **Out-of-syllabus detection** — Questions outside the subject context get a polite redirect
- **Chat history support** — Frontend sends full chat history with each request (backend is stateless)
- **Source attribution** — Answers include references to source documents and pages

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Python FastAPI |
| LLM | Google Gemini (`gemini-2.0-flash`) |
| Embeddings | Gemini `text-embedding-004` |
| Vector DB | PostgreSQL + pgvector |
| Orchestration | LangChain |
| PDF Processing | PyPDF2 |

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+ with [pgvector](https://github.com/pgvector/pgvector) extension
- Google Gemini API key

### 1. Start PostgreSQL with pgvector

```bash
docker run -d \
  --name hive-pgvector \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=hive_rag \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

### 2. Setup environment

```bash
cd hive/services/rag-service
cp .env.example .env
# Edit .env with your actual API keys and database URL
```

### 3. Install dependencies

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Run the service

```bash
uvicorn app.main:app --reload --port 8000
```

### 5. Verify

```bash
curl http://localhost:8000/health
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Service info |
| `GET` | `/health` | Health check |
| `POST` | `/api/rag/ingest` | Trigger embedding pipeline (called by resource-service) |
| `POST` | `/api/rag/chat` | Ask a question (called by frontend) |
| `DELETE` | `/api/rag/documents/{resourceId}` | Remove embeddings (called by resource-service) |
| `GET` | `/api/rag/documents` | List ingested documents |
| `GET` | `/api/rag/documents/stats` | Document statistics by subject |

## Architecture

```
┌──────────────┐     POST /api/rag/ingest     ┌──────────────┐
│   Resource   │ ──────────────────────────── │              │
│   Service    │                              │              │
└──────────────┘                              │              │
                                              │  RAG Service │──── PGVector DB
┌──────────────┐     POST /api/rag/chat       │   (FastAPI)  │
│   Frontend   │ ──────────────────────────── │              │
│   Chatbot    │                              │              │──── Google Gemini
└──────────────┘                              └──────────────┘
```

## Environment Variables

See [.env.example](.env.example) for all available configuration options.

## Docker

```bash
docker build -t hive-rag-service .
docker run -p 8000:8000 --env-file .env hive-rag-service
```
