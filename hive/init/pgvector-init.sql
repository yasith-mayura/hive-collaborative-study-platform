-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Optional: Create your tables here if you want them created on first start
-- Example:
-- CREATE TABLE IF NOT EXISTS documents (
--     id SERIAL PRIMARY KEY,
--     content TEXT,
--     embedding VECTOR(1536)  -- adjust dimension to match your EMBEDDING_DIMENSIONS
-- );