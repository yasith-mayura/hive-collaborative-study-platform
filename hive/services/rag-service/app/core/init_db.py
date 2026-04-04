"""
Database initialization script.
Creates the PostgreSQL database and enables pgvector extension.
Run this before starting the service for the first time.

Usage:
    python -m app.core.init_db
"""
import sys
import logging

from dotenv import load_dotenv

load_dotenv()

from sqlalchemy import create_engine, text
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("init_db")


def init_database():
    """Initialize the database with pgvector extension."""
    logger.info(f"Connecting to: {settings.database_url.split('@')[-1]}")

    engine = create_engine(settings.database_url)

    with engine.connect() as conn:
        # Enable pgvector extension
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
        logger.info("✅ pgvector extension enabled")

        # Verify
        result = conn.execute(text("SELECT extversion FROM pg_extension WHERE extname = 'vector'"))
        row = result.fetchone()
        if row:
            logger.info(f"✅ pgvector version: {row[0]}")
        else:
            logger.error("❌ pgvector extension not found!")
            sys.exit(1)

    engine.dispose()
    logger.info("✅ Database initialization complete")


if __name__ == "__main__":
    init_database()
