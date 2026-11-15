import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { askQuestion } from './api'

export default function Chat({ documentId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // start fresh when switching documents
  useEffect(() => {
    setMessages([])
  }, [documentId])

  async function handleSubmit(e) {
    e.preventDefault()
    const question = input.trim()
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
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold">Ask about this document</h2>
      </div>

      <div className="space-y-4 p-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate-500">Try “what are the key definitions?”</p>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex'}>
            {m.role === 'user' && (
              <div className="max-w-[85%] rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">{m.text}</div>
            )}
            {m.role === 'error' && (
              <div className="max-w-[85%] rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{m.text}</div>
            )}
            {m.role === 'assistant' && (
              <div className="max-w-[85%] rounded-lg bg-slate-100 px-3 py-2 text-sm">
                {/* tailwind strips list styles, so add them back */}
                <div className="space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {m.text}
                  </ReactMarkdown>
                </div>
                {m.pages?.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    Sources: {m.pages.map((p) => `p. ${p}`).join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && <p className="text-sm text-slate-500">Thinking…</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button
          disabled={loading || !input.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </section>
  )
}