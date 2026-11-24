# Free Study AI

Upload your lecture notes, ask questions about them, and get answers with page citations. Generate flashcards from any PDF in seconds.

**[Try it live →](https://free-study-ai.vercel.app)**

Note: this is a shared demo. Uploaded documents are visible to all visitors, so don't upload anything personal.

## Features

- **Chat with your notes**: answers come only from your uploaded PDF, with page citations like `[p. 3]`
- **Flashcard generation**: cards pulled from across the whole document, each linked to its source page
- **Math rendering**: LaTeX in answers renders as real notation (built for courses like discrete math)

## How it works

This is a retrieval-augmented generation (RAG) app.

```mermaid
flowchart LR
    A[PDF upload] --> B[Extract text per page]
    B --> C[Split into overlapping chunks]
    C --> D[Embed with Voyage AI]
    D --> E[(Postgres + pgvector)]
    F[Question] --> G[Embed question]
    G --> H[Vector search: top 5 chunks]
    E --> H
    H --> I[Claude answers using only those chunks]
    I --> J[Answer + cited pages]
```

1. **Ingestion**: PDFs are split into ~200-word chunks with 40-word overlap, so ideas that span a cut aren't lost. Each chunk is embedded and stored with its page number.
2. **Retrieval**: a question is embedded and matched against chunks using cosine distance in pgvector.
3. **Generation**: the top chunks are sent to Claude with instructions to answer only from them and cite pages. The backend then parses which pages were actually cited, so sources only show pages Claude used.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React, Vite, Tailwind CSS, react-markdown + KaTeX |
| Backend | Python, FastAPI |
| Database | PostgreSQL + pgvector (Neon) |
| AI | Claude (answers, flashcards), Voyage AI (embeddings) |
| Hosting | Vercel (frontend), Render (backend) |

## Design decisions

- **Hosted embeddings over a local model.** I started with `all-MiniLM-L6-v2` running locally, but PyTorch needs 1GB+ of memory, more than small hosting tiers provide. Switching to Voyage AI dropped the backend's memory footprint dramatically and uses separate `document` and `query` modes for better retrieval.
- **Grounded answers.** The prompt restricts Claude to the retrieved excerpts and tells it to say when the answer isn't there, which reduces made-up answers.
- **Even sampling for flashcards.** Chunks are sampled evenly across the document so cards don't all come from the first few pages.

## Running locally

Requires Python 3.12+, Node.js, and Docker.

```bash
# database
docker compose up -d

# backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# frontend (new terminal)
cd frontend
npm install
npm run dev
```

Create a `.env` file in the project root:

```
ANTHROPIC_API_KEY=your-key
VOYAGE_API_KEY=your-key
DATABASE_URL=postgresql://study:study@localhost:5432/studyai
```

## What's next

- Chat across multiple documents at once
- Streaming answers token by token
- User accounts so each person sees only their own documents
