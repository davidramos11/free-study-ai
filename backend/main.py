# the main file !!!! :)

from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from db import get_conn, init_db
from ingest import ingest_pdf
from chat import ask
from flashcards import make_flashcards

app = FastAPI(title="free study ai")

# let the react dev server call the api
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


class Question(BaseModel):
    question: str


@app.post("/documents")
def upload(file: UploadFile):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "only pdf files are supported")
    try:
        doc_id, count = ingest_pdf(file.file.read(), file.filename)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {"id": doc_id, "filename": file.filename, "chunks": count}


@app.get("/documents")
def list_documents():
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, filename, created_at FROM documents ORDER BY created_at DESC"
        ).fetchall()
    return [{"id": i, "filename": f, "created_at": c} for i, f, c in rows]


@app.post("/documents/{document_id}/chat")
def chat(document_id: int, body: Question):
    return ask(body.question, document_id)


@app.post("/documents/{document_id}/flashcards")
def flashcards(document_id: int, count: int = 10):
    return make_flashcards(document_id, count)