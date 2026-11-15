import { useEffect, useState } from 'react'
import { listDocuments, uploadPdf } from './api'

function App() {
  const [documents, setDocuments] = useState([])
  const [selected, setSelected] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  // load the document list once when the page opens
  useEffect(() => {
    listDocuments()
      .then(setDocuments)
      .catch(() => setError("Couldn't reach the server. Is the backend running?"))
  }, [])

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const doc = await uploadPdf(file)
      setDocuments(await listDocuments())
      setSelected(doc.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="text-xl font-semibold">Free Study AI</h1>
          <p className="text-sm text-slate-500">Upload lecture notes. Ask questions. Get flashcards.</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <label className="block cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-white p-8 text-center transition hover:border-blue-400">
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <p className="font-medium">{uploading ? 'Processing your PDF…' : 'Click to upload a PDF'}</p>
          <p className="mt-1 text-sm text-slate-500">
            {uploading ? 'Extracting, chunking, and embedding' : 'Lecture slides or notes'}
          </p>
        </label>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Your documents</h2>
          {documents.length === 0 ? (
            <p className="text-sm text-slate-500">No documents yet.</p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <button
                    onClick={() => setSelected(doc.id)}
                    className={`w-full rounded-lg border bg-white p-3 text-left transition ${
                      selected === doc.id
                        ? 'border-blue-500 ring-2 ring-blue-100'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {doc.filename}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

export default App