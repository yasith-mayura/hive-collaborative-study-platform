from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os

app = FastAPI()

class RagQuery(BaseModel):
    query: str

@app.get("/")
def read_root():
    return {"status": "ok", "service": "rag-service"}

@app.post("/rag/query")
def rag_query(payload: RagQuery):
    # Placeholder: integrate LangChain / OpenAI / Pinecone here
    q = payload.query
    # Return a mock response
    return {"query": q, "answer": "This is a placeholder response from RAG service."}
