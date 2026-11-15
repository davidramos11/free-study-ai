import io
import os
import sys
from pypdf import PdfReader
from db import get_conn
from embeddings import embed_documents

CHUNK_WORDS = 200
OVERLAP_WORDS = 40


def extract_pages(file_bytes):
    reader = PdfReader(io.BytesIO(file_bytes))
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        if text.strip():
            pages.append((i + 1, text))
    return pages


def chunk_text(text):
    words = text.split()
    chunks = []
    step = CHUNK_WORDS - OVERLAP_WORDS
    for start in range(0, len(words), step):
        chunks.append(" ".join(words[start:start + CHUNK_WORDS]))
        if start + CHUNK_WORDS >= len(words):
            break
    return chunks


def ingest_pdf(file_bytes, filename):
    rows = []
    for page_num, text in extract_pages(file_bytes):
        for chunk in chunk_text(text):
            rows.append((page_num, chunk))

    if not rows:
        raise ValueError("no text found in pdf")

    embeddings = embed_documents([content for _, content in rows])

    with get_conn() as conn:
        doc_id = conn.execute(
            "INSERT INTO documents (filename) VALUES (%s) RETURNING id",
            (filename,),
        ).fetchone()[0]
        with conn.cursor() as cur:
            cur.executemany(
                "INSERT INTO chunks (document_id, page, content, embedding) VALUES (%s, %s, %s, %s)",
                [(doc_id, page, content, emb) for (page, content), emb in zip(rows, embeddings)],
            )

    return doc_id, len(rows)


# quick test: python backend/ingest.py path/to/file.pdf
if __name__ == "__main__":
    path = sys.argv[1]
    with open(path, "rb") as f:
        doc_id, count = ingest_pdf(f.read(), os.path.basename(path))
    print(f"document {doc_id}: {count} chunks")