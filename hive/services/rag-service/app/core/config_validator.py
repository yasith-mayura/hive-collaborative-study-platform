"""
Configuration validation helpers.
Validates required settings before the service starts.
"""
import logging
import sys

from app.config import settings

logger = logging.getLogger("rag-service.config_validator")


def validate_config() -> bool:
    """
    Validate that all required configuration is present.
    Returns True if valid, logs errors and returns False otherwise.
    """
    errors = []

    # Check critical API keys
    if not settings.google_api_key or settings.google_api_key == "your-gemini-api-key-here":
        errors.append("GOOGLE_API_KEY is not set or is still the placeholder value")

    # Check database URL
    if not settings.database_url:
        errors.append("DATABASE_URL is not set")

    # Check AWS credentials (needed for PDF download)
    if not settings.aws_access_key_id or settings.aws_access_key_id == "your-aws-access-key":
        logger.warning("⚠  AWS_ACCESS_KEY_ID not set — S3 downloads via boto3 will fail")

    if not settings.aws_secret_access_key or settings.aws_secret_access_key == "your-aws-secret-key":
        logger.warning("⚠  AWS_SECRET_ACCESS_KEY not set — S3 downloads via boto3 will fail")

    if errors:
        for err in errors:
            logger.error(f"❌ Config error: {err}")
        return False

    logger.info("✅ Configuration validated successfully")
    return True
