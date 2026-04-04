import logging

import psycopg2
from pgvector.psycopg2 import register_vector

from app.config.settings import settings

logger = logging.getLogger("rag-service.database")


def _create_table_sql(embedding_dimensions: int) -> str:
    return f"""
CREATE TABLE IF NOT EXISTS document_chunks (
    id SERIAL PRIMARY KEY,
    subject_code VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    file_name VARCHAR(255),
    chunk_index INTEGER,
    content TEXT NOT NULL,
    embedding vector({embedding_dimensions}),
    created_at TIMESTAMP DEFAULT NOW()
);
"""


CREATE_INDEX_SQL = """
CREATE INDEX IF NOT EXISTS idx_subject_id
ON document_chunks(subject_code);
"""


MAX_IVFFLAT_DIMENSIONS = 2000


def _create_vector_index_if_supported(cur, embedding_dimensions: int) -> None:
    if embedding_dimensions > MAX_IVFFLAT_DIMENSIONS:
        logger.warning(
            "Skipping ivfflat index creation: embedding dimensions %s exceed ivfflat limit %s",
            embedding_dimensions,
            MAX_IVFFLAT_DIMENSIONS,
        )
        return

    cur.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_embedding
        ON document_chunks USING ivfflat (embedding vector_cosine_ops);
        """
    )


def _get_embedding_dimensions(cur) -> int | None:
    cur.execute(
        """
        SELECT a.atttypmod
        FROM pg_attribute a
        JOIN pg_class c ON a.attrelid = c.oid
        WHERE c.relname = 'document_chunks'
          AND a.attname = 'embedding'
          AND a.attnum > 0
          AND NOT a.attisdropped
        """
    )
    row = cur.fetchone()
    if not row:
        return None

    atttypmod = row[0]
    if atttypmod is None or atttypmod < 0:
        return None
    return atttypmod


def _reconcile_embedding_dimensions(cur, target_dimensions: int) -> None:
    current_dimensions = _get_embedding_dimensions(cur)
    if current_dimensions is None or current_dimensions == target_dimensions:
        return

    logger.warning(
        "Embedding dimension mismatch detected for document_chunks: database=%s, configured=%s",
        current_dimensions,
        target_dimensions,
    )

    cur.execute("SELECT COUNT(*) FROM document_chunks")
    row_count = cur.fetchone()[0]

    # Existing vectors cannot be resized between dimensions, so rebuild when dimensions change.
    if row_count > 0:
        logger.warning(
            "Clearing %s existing chunk row(s) before changing vector dimension to %s",
            row_count,
            target_dimensions,
        )
        cur.execute("TRUNCATE TABLE document_chunks")

    cur.execute("DROP INDEX IF EXISTS idx_embedding")
    cur.execute(
        f"ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector({target_dimensions})"
    )
    _create_vector_index_if_supported(cur, target_dimensions)
    logger.info("Updated document_chunks.embedding to vector(%s)", target_dimensions)


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
        target_dimensions = settings.embedding_dimensions
        if target_dimensions <= 0:
            raise ValueError("EMBEDDING_DIMENSIONS must be a positive integer")

        with conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            cur.execute(_create_table_sql(target_dimensions))
            cur.execute(CREATE_INDEX_SQL)
            _create_vector_index_if_supported(cur, target_dimensions)
            _reconcile_embedding_dimensions(cur, target_dimensions)
        conn.commit()
        logger.info("Database initialized for RAG service")
    finally:
        conn.close()
