import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { askQuestion } from './api'

const SUGGESTIONS = ['What are the key definitions?', 'Summarize the main ideas', 'Give me an example problem']

export default function Chat({ documentId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // start fresh when switching documents
  useEffect(() => {
    setMessages([])
  }, [documentId])

  async function send(text) {
    const question = text.trim()
    if (!question || loading) return

    setInput('')
    setMessages((m) => [...m, { role: 'user', text: question }])
    setLoading(true)
    try {
      const res = await askQuestion(documentId, question)
      setMessages((m) => [...m, { role: 'assistant', text: res.answer, pages: res.pages }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'error', text: err.message }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="min-h-72 space-y-4 p-5">
        {messages.length === 0 && (
          <div>
            <p className="text-sm text-stone-400">Ask anything about this document. Try one of these:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-stone-700 px-3 py-1.5 text-sm text-stone-300 transition hover:border-gold/60 hover:text-gold"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex'}>
            {m.role === 'user' && (
              <div className="max-w-[85%] rounded-xl border border-cal/40 bg-cal-deep px-4 py-2 text-sm">{m.text}</div>
            )}
            {m.role === 'error' && (
              <div className="max-w-[85%] rounded-xl bg-red-950/60 px-4 py-2 text-sm text-red-300">{m.text}</div>
            )}
            {m.role === 'assistant' && (
              <div className="max-w-[85%] rounded-xl border border-stone-700/60 bg-stone-800/70 px-4 py-3 text-sm leading-relaxed">
                {/* tailwind strips list styles, so add them back */}
                <div className="space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {m.text}
                  </ReactMarkdown>
                </div>
                {m.pages?.length > 0 && (
                  <p className="mt-3 border-t border-stone-700/60 pt-2 text-xs text-gold/80">
                    Sources: {m.pages.map((p) => `p. ${p}`).join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && <p className="animate-pulse text-sm text-stone-500">Reading your notes…</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="flex gap-2 border-t border-stone-800 p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-100 placeholder-stone-500 outline-none transition focus:border-gold/70"
        />
        <button
          disabled={loading || !input.trim()}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-gold-soft disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  )
}