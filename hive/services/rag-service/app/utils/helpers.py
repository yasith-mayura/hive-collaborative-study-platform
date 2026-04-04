import re
from typing import List, Tuple
from urllib.parse import unquote, urlparse


def clean_text(value: str) -> str:
    cleaned = re.sub(r"[^\x20-\x7E\n\t]", " ", value)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def to_vector_literal(values: List[float]) -> str:
    return "[" + ",".join(f"{float(v):.8f}" for v in values) + "]"


def parse_s3_url(s3_url: str) -> Tuple[str, str]:
    parsed = urlparse(s3_url)

    if parsed.scheme == "s3":
        return parsed.netloc, parsed.path.lstrip("/")

    host = parsed.netloc
    path = unquote(parsed.path.lstrip("/"))

    if host.startswith("s3") and ".amazonaws.com" in host:
        parts = path.split("/", 1)
        if len(parts) == 2:
            return parts[0], parts[1]

    if ".s3." in host:
        return host.split(".s3.")[0], path

    raise ValueError("Unsupported S3 URL format")
