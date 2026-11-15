import sys
from db import get_conn
from embeddings import embed_query


def search(query, document_id, k=5):
    query_emb = embed_query(query)
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT page, content, embedding <=> %s AS distance
            FROM chunks
            WHERE document_id = %s
            ORDER BY distance
            LIMIT %s
            """,
            (query_emb, document_id, k),
        ).fetchall()
    return [{"page": p, "content": c, "distance": float(d)} for p, c, d in rows]


# quick test: python backend/search.py 1 "your question"
if __name__ == "__main__":
    doc_id = int(sys.argv[1])
    for r in search(sys.argv[2], doc_id):
        print(f"page {r['page']} ({r['distance']:.3f}): {r['content'][:100]}...")