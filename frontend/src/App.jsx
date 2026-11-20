import { useEffect, useRef, useState } from 'react'
import { listDocuments, uploadPdf } from './api'
import Chat from './Chat'
import Flashcards from './Flashcards'

const STEPS = [
  { n: '01', title: 'Upload', text: 'Drop in lecture slides or notes as a PDF.' },
  { n: '02', title: 'Ask', text: 'Get answers grounded in your notes, with page citations.' },
  { n: '03', title: 'Review', text: 'Turn any document into flashcards in seconds.' },
]

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4" />
      <path d="m6 10 6-6 6 6" />
      <path d="M4 20h16" />
    </svg>
  )
}

function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  )
}

function App() {
  const [documents, setDocuments] = useState([])
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('chat')
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  // load the document list once when the page opens
  useEffect(() => {
    listDocuments()
      .then(setDocuments)
      .catch(() => setError("Couldn't reach the server. Is the backend running?"))
  }, [])

  async function uploadFile(file) {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const doc = await uploadPdf(file)
      setDocuments(await listDocuments())
      setSelected(doc.id)
      setTab('chat')
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    uploadFile(e.dataTransfer.files[0])
  }

  const current = documents.find((d) => d.id === selected)

  return (
    <div
      className="min-h-screen bg-stone-950 font-sans text-stone-100"
      onDragEnter={(e) => {
        if (e.dataTransfer.types.includes('Files')) setDragging(true)
      }}
    >
      {/* soft background glows */}
      <div className="pointer-events-none fixed -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none fixed -right-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-cal/15 blur-3xl" />

      {/* full-page drop target while dragging a file */}
      {dragging && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm"
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div className="pointer-events-none rounded-2xl border-2 border-dashed border-gold px-12 py-10 text-center">
            <p className="font-display text-2xl text-gold">Drop your PDF</p>
            <p className="mt-1 text-sm text-stone-400">It'll be ready to study in a few seconds</p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          uploadFile(e.target.files[0])
          e.target.value = ''
        }}
      />

      <header className="relative border-b border-cal/40 bg-stone-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <button onClick={() => setSelected(null)} className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold font-display text-lg font-semibold text-stone-950">
              F
            </span>
            <span className="text-left">
              <span className="block font-display text-lg leading-none">Free Study AI</span>
              <span className="mt-1 block text-xs text-stone-500">Notes in. Answers out.</span>
            </span>
          </button>
          <a
            href="https://github.com/davidramos11/free-study-ai"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-stone-400 transition hover:text-gold"
          >
            GitHub
          </a>
        </div>
      </header>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row">
        <aside className="space-y-4 md:w-64 md:shrink-0">
          <button
            onClick={() => inputRef.current.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-stone-950 transition hover:bg-gold-soft disabled:opacity-60"
          >
            {uploading ? 'Processing…' : '+ Upload PDF'}
          </button>

          {error && <p className="rounded-lg bg-red-950/60 p-3 text-sm text-red-300">{error}</p>}

          <div>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-stone-500">Your documents</h2>
            {documents.length === 0 ? (
              <p className="px-1 text-sm text-stone-500">Nothing here yet.</p>
            ) : (
              <ul className="space-y-1">
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <button
                      onClick={() => setSelected(doc.id)}
                      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                        selected === doc.id
                          ? 'border-gold/50 bg-gold/10 text-stone-100'
                          : 'border-transparent text-stone-300 hover:bg-stone-900'
                      }`}
                    >
                      <span className={selected === doc.id ? 'text-gold' : 'text-stone-500'}>
                        <DocIcon />
                      </span>
                      <span className="truncate">{doc.filename}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {!current ? (
            <section className="rounded-2xl border border-cal/30 bg-linear-to-br from-cal-deep/70 via-stone-900/60 to-stone-900/60 p-8 md:p-12">
              <h1 className="font-display text-4xl leading-tight md:text-5xl">
                Turn your lecture notes into answers <span className="text-gold">you can trust.</span>
              </h1>
              <p className="mt-4 max-w-xl text-stone-400">
                Upload a PDF, ask anything about it, and every answer cites the page it came from.
              </p>

              <button
                onClick={() => inputRef.current.click()}
                disabled={uploading}
                className="mt-8 flex w-full flex-col items-center rounded-xl border-2 border-dashed border-stone-700 bg-stone-950/60 px-6 py-10 transition hover:border-gold/70 hover:bg-stone-950"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold">
                  <UploadIcon />
                </span>
                <span className="mt-3 font-medium">
                  {uploading ? 'Processing your PDF…' : 'Drop a PDF here or click to upload'}
                </span>
                <span className="mt-1 text-sm text-stone-500">
                  {uploading ? 'Extracting, chunking, and embedding' : 'Lecture slides or notes'}
                </span>
              </button>

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {STEPS.map((s) => (
                  <div key={s.n} className="rounded-xl border border-cal/30 bg-cal-deep/40 p-4">
                    <p className="font-display text-gold">{s.n}</p>
                    <p className="mt-1 font-medium">{s.title}</p>
                    <p className="mt-1 text-sm text-stone-400">{s.text}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-cal/30 bg-stone-900/60">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-stone-500">Studying</p>
                  <h2 className="truncate font-display text-xl">{current.filename}</h2>
                </div>
                <div className="flex rounded-lg border border-stone-800 bg-stone-950 p-1">
                  {['chat', 'flashcards'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${
                        tab === t ? 'bg-gold text-stone-950' : 'text-stone-400 hover:text-stone-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* both stay mounted so switching tabs keeps chat history */}
              <div className={tab === 'chat' ? '' : 'hidden'}>
                <Chat documentId={selected} />
              </div>
              <div className={tab === 'flashcards' ? '' : 'hidden'}>
                <Flashcards documentId={selected} />
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default App