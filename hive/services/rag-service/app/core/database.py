"""
PostgreSQL + PGVector database connection and table setup.
"""
import logging
from sqlalchemy import text
from app.config import settings

logger = logging.getLogger("rag-service.database")


def get_connection_string() -> str:
    """Return the database connection string."""
    return settings.database_url


def check_database_connection() -> bool:
    """Verify that PostgreSQL is reachable and pgvector extension is available."""
    from sqlalchemy import create_engine

    try:
        engine = create_engine(settings.database_url)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            logger.info("✅ PostgreSQL connection verified")

            # Ensure pgvector extension exists
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
            logger.info("✅ pgvector extension enabled")
        engine.dispose()
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False
