import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { getFlashcards } from './api'

function MathText({ children }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
      {children}
    </ReactMarkdown>
  )
}

export default function Flashcards({ documentId }) {
  const [cards, setCards] = useState([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // reset when switching documents
  useEffect(() => {
    setCards([])
    setIndex(0)
    setFlipped(false)
    setError('')
  }, [documentId])

  async function generate() {
    setLoading(true)
    setError('')
    try {
      setCards(await getFlashcards(documentId))
      setIndex(0)
      setFlipped(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // wraps around at both ends
  function go(step) {
    setIndex((i) => (i + step + cards.length) % cards.length)
    setFlipped(false)
  }

  const card = cards[index]

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold">Flashcards</h2>
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Generating…' : cards.length ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      <div className="p-4">
        {error && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {!card ? (
          <p className="text-sm text-slate-500">
            {loading ? 'Writing your cards, this takes a few seconds…' : 'Generate 10 flashcards from this document.'}
          </p>
        ) : (
          <>
            <button
              onClick={() => setFlipped((f) => !f)}
              className="flex min-h-48 w-full flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-6 text-center transition hover:border-blue-300"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {flipped ? 'Answer' : 'Question'}
              </p>
              <div className="text-lg">
                <MathText>{flipped ? card.answer : card.question}</MathText>
              </div>
              {flipped && <p className="mt-3 text-xs text-slate-500">p. {card.page}</p>}
              {!flipped && <p className="mt-3 text-xs text-slate-400">Click to flip</p>}
            </button>

            <div className="mt-3 flex items-center justify-between text-sm">
              <button onClick={() => go(-1)} className="rounded-lg px-3 py-1.5 hover:bg-slate-100">
                ← Prev
              </button>
              <span className="text-slate-500">
                {index + 1} / {cards.length}
              </span>
              <button onClick={() => go(1)} className="rounded-lg px-3 py-1.5 hover:bg-slate-100">
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}