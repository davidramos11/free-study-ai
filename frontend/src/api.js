// set VITE_API_URL in production, falls back to local backend
const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

// throws with the backend's error message if the request fails
async function request(path, options) {
  const res = await fetch(`${API}${path}`, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || 'Something went wrong')
  }
  return res.json()
}

export function listDocuments() {
  return request('/documents')
}

export function uploadPdf(file) {
  const form = new FormData()
  form.append('file', file)
  return request('/documents', { method: 'POST', body: form })
}

export function askQuestion(documentId, question) {
  return request(`/documents/${documentId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
}

export function getFlashcards(documentId) {
  return request(`/documents/${documentId}/flashcards`, { method: 'POST' })
}
