import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Sparkles, WifiOff } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useCoach } from '@/lib/useCoach'
import { cn } from '@/lib/utils'

const PRESETS = [
  'Can I afford a $40 dinner out?',
  "Where's my money going?",
  'Am I on track this month?',
  'What can I cut?',
  'Recap my week',
]

/**
 * "Ask Curb" — natural-language money Q&A backed by the LLM coach
 * (/api/coach), with a graceful deterministic fallback when the API isn't
 * configured or reachable (e.g. plain `vite dev`).
 */
export function AskCoachCard() {
  const { turns, loading, mode, ask } = useCoach()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [turns, loading])

  const send = (text: string) => {
    if (!text.trim() || loading) return
    setInput('')
    void ask(text)
  }

  const started = turns.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <Sparkles size={17} strokeWidth={1.75} />
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-semibold tracking-tight">Ask Curb</div>
            <div className="text-[12px] text-soft mt-0.5">
              Your money, in plain words. Ask anything.
            </div>
          </div>
          {mode === 'offline' && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-soft bg-card-2 rounded-full px-2 py-1 shrink-0"
              title="Answering from on-device data — live coach isn't configured."
            >
              <WifiOff size={10} strokeWidth={2.5} />
              Offline
            </span>
          )}
        </div>

        {/* Conversation */}
        <AnimatePresence initial={false}>
          {started && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div
                ref={scrollRef}
                className="mt-4 max-h-[300px] overflow-y-auto no-scrollbar space-y-2.5 pr-0.5"
              >
                {turns.map((t) => (
                  <div
                    key={t.id}
                    className={cn('flex', t.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
                        t.role === 'user'
                          ? 'bg-ink text-white dark:bg-white dark:text-ink rounded-br-md'
                          : 'bg-card-2 text-ink rounded-bl-md',
                      )}
                    >
                      {t.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-card-2 rounded-2xl rounded-bl-md px-3.5 py-3">
                      <TypingDots />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preset chips (only before the first question) */}
        {!started && (
          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => send(p)}
                disabled={loading}
                className="text-[12px] font-medium text-ink bg-card-2 hover:bg-[var(--line)] rounded-full px-3 py-1.5 tap transition-colors disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Composer */}
        <form
          className="mt-4 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your spending…"
            enterKeyHint="send"
            className="flex-1 h-11 rounded-xl bg-card-2 px-3.5 text-[14px] text-ink placeholder:text-soft outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send"
            className="h-11 w-11 rounded-xl bg-brand text-white flex items-center justify-center tap shrink-0 disabled:opacity-40"
          >
            <ArrowUp size={18} strokeWidth={2.25} />
          </button>
        </form>
      </Card>
    </motion.div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-soft"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  )
}
