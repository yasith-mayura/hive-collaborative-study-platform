# HIVE - Collaborative Study Platform

This repository scaffolds a microservices-based web application called HIVE.

Structure:
- frontend/ (React + Vite)
- services/
  - api-gateway/
  - auth-service/
  - user-service/
  - resource-service/
  - chat-service/
  - note-service/
  - progress-service/
  - session-service/
  - rag-service/ (FastAPI)
- docker-compose.yml
- .env.example

Quick start:
1. Copy `.env.example` to `.env` and fill in values.
2. From project root run:
   docker-compose up --build
3. Visit frontend at http://localhost:5173 (Vite dev server)

Each Node service runs an Express server and connects to MongoDB (MONGO_URI).
The RAG service runs FastAPI on port 8000.

