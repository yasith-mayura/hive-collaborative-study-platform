from typing import Dict, List

from psycopg2.extras import RealDictCursor, execute_batch

from app.config.database import get_db_connection
from app.utils.helpers import to_vector_literal


class VectorStoreService:
    def __init__(self) -> None:
        self.conn = get_db_connection()

    def store_chunks(self, chunks: List[str], embeddings: List[List[float]], metadata: dict) -> int:
        if len(chunks) != len(embeddings):
            raise ValueError("chunks and embeddings count mismatch")

        subject_code = metadata.get("subject_code") or metadata.get("subjectId") or metadata.get("subject_id")
        resource_id = metadata.get("resource_id") or metadata.get("resourceId")
        resource_type = metadata.get("resource_type") or metadata.get("resourceType")
        file_name = metadata.get("file_name") or metadata.get("fileName")

        rows = []
        for idx, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            rows.append(
                (
                    subject_code,
                    resource_id,
                    resource_type,
                    file_name,
                    idx,
                    chunk,
                    to_vector_literal(emb),
                )
            )

        sql = """
            INSERT INTO document_chunks (
              subject_code, resource_id, resource_type, file_name,
              chunk_index, content, embedding
            ) VALUES (%s, %s, %s, %s, %s, %s, %s::vector)
        """

        with self.conn.cursor() as cur:
            execute_batch(cur, sql, rows, page_size=100)
        self.conn.commit()
        return len(rows)

    def similarity_search(self, query_embedding: List[float], subject_code: str, top_k: int = 3) -> List[Dict]:
        vector = to_vector_literal(query_embedding)
        sql = """
            SELECT content, file_name, resource_type, resource_id, chunk_index,
                   1 - (embedding <=> %s::vector) AS similarity_score
            FROM document_chunks
            WHERE subject_code = %s
            ORDER BY embedding <=> %s::vector
            LIMIT %s
        """

        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, (vector, subject_code, vector, top_k))
            rows = cur.fetchall()
        return [dict(row) for row in rows]

    def delete_by_resource_id(self, resource_id: str) -> bool:
        sql = "DELETE FROM document_chunks WHERE resource_id = %s"
        with self.conn.cursor() as cur:
            cur.execute(sql, (resource_id,))
            deleted = cur.rowcount
        self.conn.commit()
        return deleted > 0

    def get_subjects_stats(self) -> List[Dict]:
        sql = """
            SELECT subject_code, COUNT(*) AS chunk_count,
                   COUNT(DISTINCT resource_id) AS resource_count
            FROM document_chunks
            GROUP BY subject_code
            ORDER BY subject_code
        """
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql)
            rows = cur.fetchall()
        return [dict(row) for row in rows]

    def get_subject_status(self, subject_code: str) -> Dict:
        sql = """
            SELECT resource_id, file_name, resource_type, COUNT(*) AS chunks
            FROM document_chunks
            WHERE subject_code = %s
            GROUP BY resource_id, file_name, resource_type
            ORDER BY file_name
        """
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, (subject_code,))
            rows = [dict(r) for r in cur.fetchall()]

        return {
            "subjectCode": subject_code,
            "total_chunks": sum(int(r["chunks"]) for r in rows),
            "resources": rows,
        }
