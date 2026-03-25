import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    pgvector_host: str = os.getenv("PGVECTOR_HOST", "localhost")
    pgvector_port: int = int(os.getenv("PGVECTOR_PORT", "5432"))
    pgvector_database: str = os.getenv("PGVECTOR_DATABASE", "hive_vectors")
    pgvector_user: str = os.getenv("PGVECTOR_USER", "")
    pgvector_password: str = os.getenv("PGVECTOR_PASSWORD", "")
    aws_access_key_id: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    aws_secret_access_key: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    aws_region: str = os.getenv("AWS_REGION", "ap-southeast-1")
    s3_bucket_name: str = os.getenv("S3_BUCKET_NAME", "hive-study-resources")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "models/embedding-001")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-pro")
    top_k_chunks: int = int(os.getenv("TOP_K_CHUNKS", "3"))
    min_similarity_score: float = float(os.getenv("MIN_SIMILARITY_SCORE", "0.5"))
    chunk_size: int = int(os.getenv("CHUNK_SIZE", "1000"))
    chunk_overlap: int = int(os.getenv("CHUNK_OVERLAP", "200"))
    out_of_syllabus_threshold: float = float(os.getenv("OUT_OF_SYLLABUS_THRESHOLD", "0.5"))
    port: int = int(os.getenv("PORT", "8000"))
    resource_service_url: str = os.getenv("RESOURCE_SERVICE_URL", "http://localhost:3002")


settings = Settings()
