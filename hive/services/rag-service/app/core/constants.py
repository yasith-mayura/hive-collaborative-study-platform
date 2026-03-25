"""
Constants used across the RAG service.
"""

# ── Resource Types ────────────────────────────────────────────
RESOURCE_TYPES = ["past_paper", "resource_book", "note"]

# ── Retrieval ─────────────────────────────────────────────────
DEFAULT_TOP_K = 5
RELEVANCE_THRESHOLD = 0.3

# ── LLM ───────────────────────────────────────────────────────
MAX_OUTPUT_TOKENS = 2048
TEMPERATURE = 0.3

# ── API ───────────────────────────────────────────────────────
PRESIGNED_URL_EXPIRY = 3600  # 1 hour
MAX_FILE_SIZE_MB = 50

# ── Logging Prefixes ─────────────────────────────────────────
LOG_PREFIX_PIPELINE = "[Pipeline]"
LOG_PREFIX_RAG = "[RAG]"
