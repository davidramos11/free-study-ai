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
    <div className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-stone-400">
          {cards.length ? `Card ${index + 1} of ${cards.length}` : 'Turn this document into 10 flashcards.'}
        </p>
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-gold-soft disabled:opacity-60"
        >
          {loading ? 'Generating…' : cards.length ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-950/60 p-3 text-sm text-red-300">{error}</p>}

      {!card ? (
        <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-stone-700 text-sm text-stone-500">
          {loading ? <span className="animate-pulse">Writing your cards…</span> : 'Your cards will show up here.'}
        </div>
      ) : (
        <>
          <button
            onClick={() => setFlipped((f) => !f)}
            className="flex min-h-56 w-full flex-col items-center justify-center rounded-xl border border-stone-800 bg-stone-950 p-8 text-center transition hover:border-gold/50"
          >
            <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.2em] ${flipped ? 'text-cal' : 'text-gold'}`}>
              {flipped ? 'Answer' : 'Question'}
            </p>
            <div className="font-display text-xl leading-snug">
              <MathText>{flipped ? card.answer : card.question}</MathText>
            </div>
            <p className="mt-4 text-xs text-stone-500">{flipped ? `From page ${card.page}` : 'Click to flip'}</p>
          </button>

          <div className="flex items-center justify-between text-sm">
            <button onClick={() => go(-1)} className="rounded-lg px-3 py-1.5 text-stone-300 transition hover:bg-stone-800">
              ← Prev
            </button>
            <button onClick={() => go(1)} className="rounded-lg px-3 py-1.5 text-stone-300 transition hover:bg-stone-800">
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  )
}