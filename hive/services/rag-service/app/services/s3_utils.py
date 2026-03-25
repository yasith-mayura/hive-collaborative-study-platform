"""
S3 download utility.
Provides helpers for downloading files from AWS S3 using boto3.
"""
import logging
import boto3
from app.config import settings

logger = logging.getLogger("rag-service.s3_utils")


def get_s3_client():
    """Create and return a boto3 S3 client."""
    return boto3.client(
        "s3",
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
    )


def download_from_s3(s3_key: str) -> bytes:
    """
    Download a file from S3 by key.
    Returns the raw file bytes.
    """
    logger.info(f"Downloading from S3: {s3_key}")
    client = get_s3_client()

    response = client.get_object(
        Bucket=settings.s3_bucket_name,
        Key=s3_key,
    )

    data = response["Body"].read()
    logger.info(f"Downloaded {len(data)} bytes from S3")
    return data


def generate_presigned_url(s3_key: str, expiry: int = 3600) -> str:
    """
    Generate a pre-signed URL for downloading an S3 object.
    """
    client = get_s3_client()

    url = client.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": settings.s3_bucket_name,
            "Key": s3_key,
        },
        ExpiresIn=expiry,
    )

    return url
