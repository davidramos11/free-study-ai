import sys
import anthropic
from search import search

# reads ANTHROPIC_API_KEY, loaded from .env by db.py
client = anthropic.Anthropic()

# haiku is cheap and fast, swap to claude-sonnet-5-5 for harder material
MODEL = "claude-haiku-5-5"

SYSTEM = """You are a study assistant. Answer the student's question using only the provided excerpts from their course notes.
Cite the page for every claim, like [p. 3]. If the excerpts don't contain the answer, say so instead of guessing."""


def ask(question, document_id):
    results = search(question, document_id)
    context = "\n\n".join(f"[page {r['page']}]\n{r['content']}" for r in results)

    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=SYSTEM,
        messages=[{"role": "user", "content": f"Excerpts:\n{context}\n\nQuestion: {question}"}],
    )

    # response can include thinking blocks, keep only the text
    answer = "".join(b.text for b in response.content if b.type == "text")
    pages = sorted({r["page"] for r in results})
    return {"answer": answer, "pages": pages}


# quick test: python backend/chat.py 1 "your question"
if __name__ == "__main__":
    result = ask(sys.argv[2], int(sys.argv[1]))
    print(result["answer"])
    print("\nsources: pages", result["pages"])