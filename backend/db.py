import os
import psycopg
from pgvector.psycopg import register_vector
from dotenv import load_dotenv

# .env lives in the project root, one level up
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")


def get_conn():
    conn = psycopg.connect(DATABASE_URL)
    register_vector(conn)
    return conn


def init_db():
    with psycopg.connect(DATABASE_URL, autocommit=True) as conn:
        conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY,
                filename TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT now()
            )
        """)
        # 384 = output size of all-MiniLM-L6-v2
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chunks (
                id SERIAL PRIMARY KEY,
                document_id INT REFERENCES documents(id) ON DELETE CASCADE,
                page INT NOT NULL,
                content TEXT NOT NULL,
                embedding vector(384)
            )
        """)


if __name__ == "__main__":
    init_db()
    print("database ready")