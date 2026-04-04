import io
import logging
from typing import List
from urllib.request import urlopen

import boto3
from botocore.exceptions import BotoCoreError, ClientError
try:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
except ImportError:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

from app.config.settings import settings
from app.utils.helpers import clean_text, parse_s3_url

logger = logging.getLogger("rag-service.pdf-service")


class PDFService:
    def __init__(self) -> None:
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id or None,
            aws_secret_access_key=settings.aws_secret_access_key or None,
            region_name=settings.aws_region,
        )

    def download_from_s3(self, s3_url: str) -> bytes:
        try:
            bucket, key = parse_s3_url(s3_url)
            logger.info("Downloading PDF from s3://%s/%s", bucket, key)
            response = self.s3_client.get_object(Bucket=bucket, Key=key)
            return response["Body"].read()
        except ValueError:
            logger.info("Falling back to HTTP download for PDF URL")
            with urlopen(s3_url, timeout=30) as response:  # nosec B310
                return response.read()
        except (ClientError, BotoCoreError) as exc:
            logger.error("Failed to download PDF from S3: %s", exc)
            raise RuntimeError("Could not download PDF from S3") from exc

    def extract_text(self, pdf_bytes: bytes) -> str:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        pages: List[str] = []
        for page in reader.pages:
            text = page.extract_text() or ""
            cleaned = clean_text(text)
            if cleaned:
                pages.append(cleaned)
        return "\n\n".join(pages)

    def chunk_text(self, text: str) -> List[str]:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
        )
        return splitter.split_text(text)
