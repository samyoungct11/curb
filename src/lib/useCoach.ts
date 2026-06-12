import { useCallback, useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { buildCoach } from '@/lib/coach'
import { buildCoachSnapshot } from '@/lib/coachSnapshot'
import { apiPost } from '@/lib/api'

/** A turn as shown in the chat UI. */
export interface CoachTurn {
  id: string
  role: 'user' | 'coach'
  text: string
  /** True when this answer came from the offline deterministic coach. */
  offline?: boolean
}

/** Raw Anthropic message (string for user turns, content array for assistant turns). */
interface ApiMessage {
  role: 'user' | 'assistant'
  content: unknown
}

type Mode = 'unknown' | 'live' | 'offline'

/**
 * Pick the best deterministic answer for a free-form question, so the coach
 * still works in `vite dev` (no /api) or when ANTHROPIC_API_KEY isn't set.
 */
function offlineAnswer(question: string, coach: ReturnType<typeof buildCoach>): string {
  const q = question.toLowerCase()
  if (/recap|my week|this week|how('?s| is| am| are).*(week|going|doing)|summary/.test(q))
    return coach.recap.body
  if (/afford|can i (buy|get|spend|afford)|should i (buy|get)|enough (for|to)/.test(q))
    return coach.answers.afford
  if (/cut|save|reduce|trim|cancel|subscription|wasting|spend less/.test(q))
    return coach.answers.cut
  if (/on track|on pace|over\s?budget|overspend|behind|ahead|doing ok/.test(q))
    return coach.answers.track
  if (/where|going|biggest|most|breakdown|spent on|categor/.test(q))
    return coach.answers.going
  // Default: the "where's it going" overview is the most generally useful.
  return coach.answers.going
}

let turnSeq = 0
const nextId = () => `turn-${Date.now()}-${turnSeq++}`

export function useCoach() {
  const [turns, setTurns] = useState<CoachTurn[]>([])
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<Mode>('unknown')
  // Full Anthropic message history (with thinking-block signatures) for continuity.
  const apiHistory = useRef<ApiMessage[]>([])

  const ask = useCallback(async (question: string) => {
    const text = question.trim()
    if (!text || loading) return

    setTurns((t) => [...t, { id: nextId(), role: 'user', text }])
    setLoading(true)

    const state = useAppStore.getState()

    // Try the live LLM coach; fall back to deterministic answers on any failure.
    try {
      const snapshot = buildCoachSnapshot(state)
      const messages = [...apiHistory.current, { role: 'user' as const, content: text }]
      // apiPost attaches the Supabase session token — /api/coach requires a
      // verified user so strangers can't spend the Anthropic budget.
      const resp = await apiPost('/api/coach', { messages, snapshot })
      if (!resp.ok) throw new Error(`coach ${resp.status}`)
      const data = (await resp.json()) as { text: string; messages: ApiMessage[] }
      apiHistory.current = data.messages
      setMode('live')
      setTurns((t) => [...t, { id: nextId(), role: 'coach', text: data.text }])
    } catch {
      const coach = buildCoach({
        user: state.user,
        categories: state.categories,
        transactions: state.transactions,
        goals: state.goals,
      })
      setMode('offline')
      setTurns((t) => [
        ...t,
        { id: nextId(), role: 'coach', text: offlineAnswer(text, coach), offline: true },
      ])
    } finally {
      setLoading(false)
    }
  }, [loading])

  const reset = useCallback(() => {
    apiHistory.current = []
    setTurns([])
    setMode('unknown')
  }, [])

  return { turns, loading, mode, ask, reset }
}
