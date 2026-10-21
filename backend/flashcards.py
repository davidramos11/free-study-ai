import json
import sys
from db import get_conn
from chat import client, MODEL

SYSTEM = """You write flashcards for students from their course notes.
Return only a JSON array, no other text. Each item: {"question": str, "answer": str, "page": int}.
Keep answers short (1-2 sentences). Use only facts from the excerpts."""


def get_chunks(document_id, limit=15):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT page, content FROM chunks WHERE document_id = %s ORDER BY page, id",
            (document_id,),
        ).fetchall()
    # spread picks across the whole doc
    if len(rows) > limit:
        step = len(rows) / limit
        rows = [rows[int(i * step)] for i in range(limit)]
    return rows


def make_flashcards(document_id, count=10):
    chunks = get_chunks(document_id)
    context = "\n\n".join(f"[page {page}]\n{content}" for page, content in chunks)

    response = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=SYSTEM,
        messages=[{"role": "user", "content": f"Excerpts:\n{context}\n\nWrite {count} flashcards."}],
    )

    text = "".join(b.text for b in response.content if b.type == "text").strip()
    # strip markdown code fences if the model adds them
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0]
    return json.loads(text)


# quick test: python backend/flashcards.py 1
if __name__ == "__main__":
    for card in make_flashcards(int(sys.argv[1])):
        print(f"Q: {card['question']}\nA: {card['answer']} [p. {card['page']}]\n")