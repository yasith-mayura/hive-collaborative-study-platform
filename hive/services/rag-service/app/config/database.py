import logging

import psycopg2
from pgvector.psycopg2 import register_vector

from app.config.settings import settings

logger = logging.getLogger("rag-service.database")


CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS document_chunks (
  id SERIAL PRIMARY KEY,
  subject_code VARCHAR(50) NOT NULL,
  resource_id VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  file_name VARCHAR(255),
  chunk_index INTEGER,
  content TEXT NOT NULL,
  embedding vector(768),
  created_at TIMESTAMP DEFAULT NOW()
);
"""


CREATE_INDEX_SQL = """
CREATE INDEX IF NOT EXISTS idx_subject_id
ON document_chunks(subject_code);
"""


CREATE_VECTOR_INDEX_SQL = """
CREATE INDEX IF NOT EXISTS idx_embedding
ON document_chunks USING ivfflat (embedding vector_cosine_ops);
"""


def get_db_connection():
    conn = psycopg2.connect(
        host=settings.pgvector_host,
        port=settings.pgvector_port,
        dbname=settings.pgvector_database,
        user=settings.pgvector_user,
        password=settings.pgvector_password,
        connect_timeout=5,
    )
    register_vector(conn)
    return conn


def init_db() -> None:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            cur.execute(CREATE_TABLE_SQL)
            cur.execute(CREATE_INDEX_SQL)
            cur.execute(CREATE_VECTOR_INDEX_SQL)
        conn.commit()
        logger.info("Database initialized for RAG service")
    finally:
        conn.close()
