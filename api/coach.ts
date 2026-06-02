import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Curb money coach — natural-language Q&A + weekly recap powered by the
 * Anthropic Messages API, with tool access to the user's financial snapshot.
 *
 * Design notes
 * ────────────
 * • The client POSTs { messages, snapshot }. The snapshot is the only data the
 *   model sees — this function never touches a bank or a database. Tools below
 *   slice that snapshot; they don't fetch anything.
 * • We run a manual agentic loop and re-send the FULL assistant `content`
 *   arrays every turn (text + tool_use + extended-thinking blocks with their
 *   signatures). Preserving thinking blocks verbatim is required when extended
 *   thinking is combined with tool use, so this is wired in from the start.
 * • The Anthropic key is read from process.env and never returned to the
 *   client. If it's missing we 503 with { error: 'not_configured' } so the
 *   frontend can fall back to its deterministic coach.
 *
 * Tunables via env (all optional):
 *   ANTHROPIC_API_KEY  — required for live answers
 *   ANTHROPIC_MODEL    — defaults to claude-opus-4-7
 *   ANTHROPIC_EFFORT   — low | medium | high | xhigh | max (default: low)
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-7'
const EFFORT = process.env.ANTHROPIC_EFFORT ?? 'low'
const MAX_TOOL_ROUNDS = 6

// ── Snapshot shape (structural mirror of src/lib/coachSnapshot.ts) ──────────
interface SnapshotCategory {
  name: string
  budget: number
  spent: number
  remaining: number
}
interface SnapshotTransaction {
  date: string
  merchant: string
  amount: number
  category: string
}
interface SnapshotSub {
  merchant: string
  amount: number
  cadence: string
  monthly: number
  priceChangePct?: number
  essential: boolean
}
interface CoachSnapshot {
  today: string
  currency: string
  user: {
    name: string
    monthlyIncome: number
    isStudent: boolean
    ageRange: string
    tone: string
  }
  overview: Record<string, number | string | null>
  categories: SnapshotCategory[]
  subscriptions: { items: SnapshotSub[]; monthlyTotal: number; foundMoney: number }
  transactions: SnapshotTransaction[]
  goals: { name: string; target: number; current: number; targetDate?: string }[]
}

// ── Minimal Anthropic Messages API types (raw fetch, no SDK dependency) ─────
type ContentBlock = Record<string, unknown> & { type: string }
interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
}
interface AnthropicResponse {
  content: ContentBlock[]
  stop_reason: string | null
  usage?: Record<string, number>
}

// ── Tools the model can call against the snapshot ───────────────────────────
const TOOLS = [
  {
    name: 'query_transactions',
    description:
      "Search the user's recent transactions. Filter by category name, a case-insensitive merchant substring, and/or how many days back to look. Returns matching transactions newest-first plus their count and total.",
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Exact category name, e.g. "Coffee".' },
        merchant: { type: 'string', description: 'Case-insensitive merchant substring, e.g. "uber".' },
        sinceDays: { type: 'number', description: 'Only include transactions within the last N days.' },
        limit: { type: 'number', description: 'Max rows to return (default 20).' },
      },
    },
  },
  {
    name: 'get_subscriptions',
    description:
      'List detected recurring subscriptions with monthly cost, cadence, and price-change flags, plus the total non-essential "found money" that could be freed by cancelling.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_category_detail',
    description: 'Get budget, amount spent, and amount remaining this month for a single category.',
    input_schema: {
      type: 'object',
      properties: { category: { type: 'string', description: 'Exact category name.' } },
      required: ['category'],
    },
  },
] as const

function runTool(
  name: string,
  input: Record<string, unknown>,
  snap: CoachSnapshot,
): unknown {
  switch (name) {
    case 'query_transactions': {
      const category = typeof input.category === 'string' ? input.category.toLowerCase() : null
      const merchant = typeof input.merchant === 'string' ? input.merchant.toLowerCase() : null
      const sinceDays = typeof input.sinceDays === 'number' ? input.sinceDays : null
      const limit = typeof input.limit === 'number' ? input.limit : 20

      const todayMs = new Date(snap.today).getTime()
      const matches = snap.transactions.filter((t) => {
        if (category && t.category.toLowerCase() !== category) return false
        if (merchant && !t.merchant.toLowerCase().includes(merchant)) return false
        if (sinceDays != null) {
          const ageDays = (todayMs - new Date(t.date).getTime()) / 86_400_000
          if (ageDays > sinceDays) return false
        }
        return true
      })
      const total = matches.reduce((s, t) => s + t.amount, 0)
      return {
        count: matches.length,
        total: Math.round(total * 100) / 100,
        transactions: matches.slice(0, limit),
      }
    }
    case 'get_subscriptions':
      return snap.subscriptions
    case 'get_category_detail': {
      const wanted = typeof input.category === 'string' ? input.category.toLowerCase() : ''
      const cat = snap.categories.find((c) => c.name.toLowerCase() === wanted)
      return cat ?? { error: `No category named "${input.category}".`, available: snap.categories.map((c) => c.name) }
    }
    default:
      return { error: `Unknown tool: ${name}` }
  }
}

function buildSystem(snap: CoachSnapshot): { type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }[] {
  // Stable persona first (cacheable), volatile snapshot last.
  const persona = `You are Curb's money coach — a calm, encouraging guide for a ${snap.user.ageRange} year old${snap.user.isStudent ? ' student' : ''} named ${snap.user.name}. Curb helps people aged 12–25 build spending awareness.

Voice & rules:
- Warm, plain, and brief. Usually 1–3 sentences. No lectures, no shame, no jargon.
- Always ground answers in ${snap.user.name}'s real numbers. Use the overview below; call tools when you need transaction-level detail, subscription specifics, or a single category's status.
- Money is in ${snap.currency}. Format like $12 or $12.40 (drop cents when whole). Today is ${snap.today}.
- Give one concrete, encouraging next step when it helps. Celebrate wins.
- You are not a licensed financial advisor. Do not give personalized investment, tax, or legal advice — if asked, gently say so and redirect to budgeting help.
- If the data doesn't support an answer, say what you'd need rather than inventing numbers.`

  const o = snap.overview
  const overview = `Current money overview (this calendar month):
- Budget: $${o.totalBudget} · Spent: $${o.totalSpent} · Remaining: $${o.remaining}
- ${o.usedPct}% of budget used, ${o.elapsedPct}% of the month elapsed — pace: ${o.paceStatus}; projected month-end total $${o.projectedTotal}.
- Guilt-free money left this month (non-essential budgets): $${o.guiltFree}.
${o.safeToSpendPerDay != null ? `- Safe to spend: $${o.safeToSpendPerDay}/day, $${o.periodRemaining} left over ${o.daysToPayday} days until next payday (${o.nextPayday}).` : '- Safe-to-Spend is not set up yet (no payday/bills profile).'}
- Subscriptions: ${snap.subscriptions.items.length} detected, $${snap.subscriptions.monthlyTotal}/mo total, $${snap.subscriptions.foundMoney}/mo could be freed by cancelling non-essentials.
- Categories: ${snap.categories.map((c) => `${c.name} $${c.spent}/$${c.budget}`).join(', ') || 'none'}.
${snap.goals.length ? `- Goals: ${snap.goals.map((g) => `${g.name} $${g.current}/$${g.target}`).join(', ')}.` : ''}`

  return [
    { type: 'text', text: persona, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: overview },
  ]
}

async function callAnthropic(
  apiKey: string,
  system: ReturnType<typeof buildSystem>,
  messages: AnthropicMessage[],
): Promise<AnthropicResponse> {
  const resp = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages,
      tools: TOOLS,
      // Extended thinking, sized adaptively to the question; effort caps the budget.
      thinking: { type: 'adaptive' },
      output_config: { effort: EFFORT },
    }),
  })

  if (!resp.ok) {
    const detail = await resp.text().catch(() => '')
    throw new Error(`Anthropic ${resp.status}: ${detail.slice(0, 500)}`)
  }
  return (await resp.json()) as AnthropicResponse
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'not_configured' })

  const body = req.body as { messages?: AnthropicMessage[]; snapshot?: CoachSnapshot }
  const snapshot = body?.snapshot
  const incoming = body?.messages
  if (!snapshot || !Array.isArray(incoming) || incoming.length === 0) {
    return res.status(400).json({ error: 'messages and snapshot are required' })
  }

  try {
    const system = buildSystem(snapshot)
    const messages: AnthropicMessage[] = [...incoming]

    let response: AnthropicResponse | null = null
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      response = await callAnthropic(apiKey, system, messages)

      // Preserve the full assistant content verbatim (text + tool_use +
      // thinking blocks with signatures) so multi-turn context stays valid.
      messages.push({ role: 'assistant', content: response.content })

      if (response.stop_reason !== 'tool_use') break

      const toolResults = response.content
        .filter((b): b is ContentBlock & { id: string; name: string; input: Record<string, unknown> } =>
          b.type === 'tool_use',
        )
        .map((b) => ({
          type: 'tool_result' as const,
          tool_use_id: b.id,
          content: JSON.stringify(runTool(b.name, b.input ?? {}, snapshot)),
        }))

      if (toolResults.length === 0) break
      messages.push({ role: 'user', content: toolResults })
    }

    const text = (response?.content ?? [])
      .filter((b) => b.type === 'text')
      .map((b) => (b as { text: string }).text)
      .join('\n')
      .trim()

    // Return the full message history so the client can resend it next turn,
    // keeping thinking-block signatures intact across questions.
    return res.status(200).json({
      text: text || "I couldn't put that into words — mind rephrasing?",
      messages,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('coach error:', msg)
    return res.status(502).json({ error: 'upstream_error' })
  }
}
