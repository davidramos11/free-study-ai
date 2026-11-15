import os
import numpy as np
import voyageai
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# reads VOYAGE_API_KEY
client = voyageai.Client()

MODEL = "voyage-4-lite"


def embed_documents(texts):
    result = client.embed(texts, model=MODEL, input_type="document")
    return [np.array(e) for e in result.embeddings]


def embed_query(text):
    result = client.embed([text], model=MODEL, input_type="query")
    return np.array(result.embeddings[0])