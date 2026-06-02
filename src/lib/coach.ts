import { subDays } from 'date-fns'
import type {
  Category,
  SavingsGoal,
  ToneMode,
  Transaction,
  User,
} from '@/lib/types'
import { money } from '@/lib/utils'

/**
 * Coach engine — pure computation + tone-aware phrasing.
 *
 * Everything the Coach screen shows is derived here from the user's real
 * data (budgets, goals, transactions). No external services required.
 *
 * What's intentionally NOT here, because it needs infrastructure Curb's demo
 * data layer doesn't have yet:
 *  - pre-purchase check-in / true blocking  -> needs card-auth webhooks / an issuing partner
 *  - contextual promos & cashback           -> needs an offers / affiliate network
 *  - bill negotiation                       -> needs a negotiation partner
 *  - round-up sweeps                        -> needs a savings vault / banking partner
 *  - price-drop watch                       -> needs a retailer price API
 *  - anonymous benchmarking                 -> needs a multi-user cohort dataset
 *  - free-form LLM Q&A                      -> needs a model with tool access to this data
 * The deterministic "Ask the Coach" answers below are the no-LLM stand-in for that last one.
 */

// ---------------------------------------------------------------------------
// Tone / voice (mirrors notificationCopy.ts so the Coach sounds like the app)
// ---------------------------------------------------------------------------

export type Voice = 'factual' | 'encouraging' | 'playful'

const VOICE_WEIGHTS: Record<ToneMode, Record<Voice, number>> = {
  strict: { factual: 0.7, encouraging: 0.2, playful: 0.1 },
  balanced: { factual: 0.3, encouraging: 0.4, playful: 0.3 },
  chill: { factual: 0.1, encouraging: 0.3, playful: 0.6 },
}

/** FNV-1a — small, stable hash so phrasing doesn't flicker between renders. */
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pickVoice(tone: ToneMode, seed: string): Voice {
  const w = VOICE_WEIGHTS[tone]
  const r = (hash(seed) % 1000) / 1000
  let acc = 0
  for (const v of ['factual', 'encouraging', 'playful'] as Voice[]) {
    acc += w[v]
    if (r < acc) return v
  }
  return 'encouraging'
}

function pick<T>(arr: T[], seed: string): T {
  return arr[hash(seed) % arr.length]
}

/** Pick a voice (by tone), then a variant within that voice — both deterministic. */
function phrase(
  tone: ToneMode,
  seed: string,
  variants: Record<Voice, string[]>,
): string {
  const v = pickVoice(tone, seed)
  return pick(variants[v], `${seed}:${v}`)
}

// ---------------------------------------------------------------------------
// Date / spend math
// ---------------------------------------------------------------------------

function monthBounds(now: Date) {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dayOfMonth = now.getDate()
  const daysLeft = Math.max(1, daysInMonth - dayOfMonth + 1)
  const elapsedFraction = dayOfMonth / daysInMonth
  return { monthStart, daysInMonth, dayOfMonth, daysLeft, elapsedFraction }
}

function spentByCategory(txns: Transaction[], since: Date): Record<string, number> {
  const map: Record<string, number> = {}
  for (const t of txns) {
    if (new Date(t.date) >= since) map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount
  }
  return map
}

function sumBetween(txns: Transaction[], start: Date, end: Date): number {
  return txns.reduce((s, t) => {
    const d = new Date(t.date)
    return d >= start && d < end ? s + t.amount : s
  }, 0)
}

/** Categories we never treat as "fun money" / discretionary. */
const ESSENTIAL = new Set([
  'Groceries',
  'Rent & Bills',
  'Bills',
  'Rent',
  'Transport',
  'Health',
  'Education',
])

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface CoachAction {
  label: string
  to?: string // optional route to deep-link to
}

export type InsightKind =
  | 'pace'
  | 'top_category'
  | 'frequency'
  | 'trend'
  | 'impulse'
  | 'win'
  | 'neutral'

export interface CoachInsight {
  id: string
  kind: InsightKind
  severity: 'alert' | 'info' | 'positive'
  title: string
  body: string
  action?: CoachAction
}

export interface SafeToSpend {
  today: number
  remaining: number
  daysLeft: number
  totalBudget: number
  totalSpent: number
  elapsedPct: number
  usedPct: number
  projectedTotal: number
}

export interface SubItem {
  id: string
  merchant: string
  amount: number
}

export interface GoalNudge {
  goal: SavingsGoal
  pct: number
  remaining: number
  weeksLeft: number | null
  perWeek: number | null
  suggested: number
}

export interface Streaks {
  noSpendStreak: number
  noCoffeeStreak: number
  underPace: number // $ under the straight-line pace (0 if over)
}

export interface WhatIf {
  category: Category
  monthlySpend: number
}

export interface CoachData {
  greetingSub: string
  safe: SafeToSpend
  guiltFree: number
  headline: CoachInsight
  insights: CoachInsight[]
  subscriptions: { items: SubItem[]; monthlyTotal: number }
  recap: { title: string; body: string }
  goalNudge: GoalNudge | null
  streaks: Streaks
  whatIf: WhatIf | null
  answers: { afford: string; going: string; track: string; cut: string }
}

export interface CoachInput {
  user: User | null
  categories: Category[]
  transactions: Transaction[]
  goals: SavingsGoal[]
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export function buildCoach(input: CoachInput, now: Date = new Date()): CoachData {
  const { categories, transactions, goals } = input
  const tone: ToneMode = input.user?.notificationTone ?? 'balanced'
  const { monthStart, daysLeft, dayOfMonth, elapsedFraction } = monthBounds(now)
  const seedDay = String(dayOfMonth)

  const spent = spentByCategory(transactions, monthStart)
  const totalBudget = categories.reduce((s, c) => s + c.monthlyBudget, 0)
  const totalSpent = Object.values(spent).reduce((s, n) => s + n, 0)
  const remaining = totalBudget - totalSpent
  const elapsedPct = Math.round(elapsedFraction * 100)
  const usedPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
  const projectedTotal = elapsedFraction > 0 ? totalSpent / elapsedFraction : totalSpent

  const safe: SafeToSpend = {
    today: Math.max(0, remaining / daysLeft),
    remaining,
    daysLeft,
    totalBudget,
    totalSpent,
    elapsedPct,
    usedPct,
    projectedTotal,
  }

  // Guilt-free allowance: what's left in non-essential categories this month.
  const guiltFree = categories
    .filter((c) => !ESSENTIAL.has(c.name))
    .reduce((s, c) => s + Math.max(0, c.monthlyBudget - (spent[c.id] ?? 0)), 0)

  // Per-category pace stats
  const catStats = categories.map((c) => {
    const sp = spent[c.id] ?? 0
    const projected = elapsedFraction > 0 ? sp / elapsedFraction : sp
    return { c, spent: sp, projected, over: projected - c.monthlyBudget }
  })

  const hour = now.getHours()
  const greetingSub =
    totalBudget === 0
      ? 'Let’s set up your money.'
      : hour < 12
        ? 'Here’s your money today.'
        : hour < 18
          ? 'Here’s where you stand.'
          : 'How the day’s shaping up.'

  // ---- Insights -----------------------------------------------------------
  const candidates: CoachInsight[] = []

  // 1) Pace / over-budget (most severe)
  const overNow = catStats
    .filter((s) => s.c.monthlyBudget > 0 && s.spent > s.c.monthlyBudget)
    .sort((a, b) => b.spent - b.c.monthlyBudget - (a.spent - a.c.monthlyBudget))[0]
  const projectedOver = catStats
    .filter(
      (s) =>
        s.spent > 0 &&
        s.c.monthlyBudget > 0 &&
        s.spent <= s.c.monthlyBudget &&
        s.projected > s.c.monthlyBudget * 1.1,
    )
    .sort((a, b) => b.over - a.over)[0]

  if (overNow) {
    const over = overNow.spent - overNow.c.monthlyBudget
    candidates.push({
      id: 'pace',
      kind: 'pace',
      severity: 'alert',
      title: phrase(tone, `${seedDay}-paceT`, {
        factual: ['Over budget'],
        encouraging: ['Past the line'],
        playful: ['Welp'],
      }),
      body: phrase(tone, `${seedDay}-paceB`, {
        factual: [`${overNow.c.name} is ${money(over)} over for the month.`],
        encouraging: [
          `${overNow.c.name}’s ${money(over)} over. Worth a small reset — no drama.`,
        ],
        playful: [`${overNow.c.name} tapped out — ${money(over)} over. We’ve got options.`],
      }),
      action: { label: `See ${overNow.c.name}`, to: '/insights' },
    })
  } else if (projectedOver) {
    const pUsed = Math.round((projectedOver.spent / projectedOver.c.monthlyBudget) * 100)
    const overBy = Math.round(projectedOver.over)
    candidates.push({
      id: 'pace',
      kind: 'pace',
      severity: 'alert',
      title: phrase(tone, `${seedDay}-paceT`, {
        factual: ['On pace to overspend'],
        encouraging: ['Heads up'],
        playful: ['Eye on it'],
      }),
      body: phrase(tone, `${seedDay}-paceB`, {
        factual: [
          `${projectedOver.c.name} is at ${pUsed}% with ${daysLeft} days left — on pace to go ~${money(overBy)} over.`,
        ],
        encouraging: [
          `${projectedOver.c.name} is running hot (${pUsed}%). Ease up and you finish on budget.`,
        ],
        playful: [
          `${projectedOver.c.name} is speedrunning the budget — ${pUsed}% already. ~${money(overBy)} over at this pace.`,
        ],
      }),
      action: { label: `See ${projectedOver.c.name}`, to: '/insights' },
    })
  }

  // 2) Top category this month
  const top = [...catStats].sort((a, b) => b.spent - a.spent)[0]
  if (top && top.spent > 0) {
    const share = totalSpent > 0 ? Math.round((top.spent / totalSpent) * 100) : 0
    candidates.push({
      id: 'top_category',
      kind: 'top_category',
      severity: 'info',
      title: phrase(tone, `${seedDay}-topT`, {
        factual: ['Where it’s going'],
        encouraging: ['Biggest bucket'],
        playful: ['The main character'],
      }),
      body: phrase(tone, `${seedDay}-topB`, {
        factual: [`${top.c.name} is your biggest category — ${money(top.spent)}, ${share}% of spending.`],
        encouraging: [`Most of your money went to ${top.c.name} (${money(top.spent)}, ${share}%). Good to know.`],
        playful: [`${top.c.name} is carrying the spending — ${money(top.spent)}, ${share}% of the total.`],
      }),
      action: { label: `See ${top.c.name}`, to: '/insights' },
    })
  }

  // 3) Frequency pattern (coffee / food cadence)
  for (const name of ['Coffee', 'Restaurants']) {
    const cat = categories.find((c) => c.name === name)
    if (!cat) continue
    const week = transactions.filter(
      (t) => t.categoryId === cat.id && new Date(t.date) >= subDays(now, 7),
    )
    if (week.length >= 4) {
      const wkSpend = week.reduce((s, t) => s + t.amount, 0)
      const monthly = Math.round(wkSpend * 4.3)
      candidates.push({
        id: 'frequency',
        kind: 'frequency',
        severity: 'info',
        title: phrase(tone, `${seedDay}-freqT`, {
          factual: [`${name} check-in`],
          encouraging: [`${name} rhythm`],
          playful: [`${name} streak (the spendy kind)`],
        }),
        body: phrase(tone, `${seedDay}-freqB`, {
          factual: [
            `${week.length} ${name.toLowerCase()} runs in 7 days — ${money(wkSpend)}. That’s ~${money(monthly)}/mo at this pace.`,
          ],
          encouraging: [
            `${week.length} ${name.toLowerCase()} buys this week (${money(wkSpend)}). Trimming one or two adds up fast.`,
          ],
          playful: [
            `${week.length} ${name.toLowerCase()} runs in a week — ${money(wkSpend)}, ~${money(monthly)}/mo if it keeps up.`,
          ],
        }),
        action: { label: `Set a ${name} cap` },
      })
      break // one frequency insight is enough
    }
  }

  // 4) Week-over-week trend
  const thisWeek = sumBetween(transactions, subDays(now, 7), now)
  const lastWeek = sumBetween(transactions, subDays(now, 14), subDays(now, 7))
  if (lastWeek > 0) {
    const deltaPct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
    if (Math.abs(deltaPct) >= 15) {
      const up = deltaPct > 0
      candidates.push({
        id: 'trend',
        kind: 'trend',
        severity: up ? 'info' : 'positive',
        title: phrase(tone, `${seedDay}-trendT`, {
          factual: [up ? 'Trending up' : 'Trending down'],
          encouraging: [up ? 'A bit higher' : 'Nice dip'],
          playful: [up ? 'Line goes up' : 'Line goes down'],
        }),
        body: phrase(tone, `${seedDay}-trendB`, {
          factual: [`You spent ${money(thisWeek)} this week — ${Math.abs(deltaPct)}% ${up ? 'above' : 'below'} last week.`],
          encouraging: [
            up
              ? `This week’s ${Math.abs(deltaPct)}% higher than last. Worth a glance.`
              : `This week’s ${Math.abs(deltaPct)}% lower than last. That counts.`,
          ],
          playful: [
            up
              ? `Spending’s up ${Math.abs(deltaPct)}% from last week. Having a moment.`
              : `Down ${Math.abs(deltaPct)}% from last week. Quietly winning.`,
          ],
        }),
      })
    }
  }

  // 5) Impulse / bigger-than-usual (most recent outlier in last 5 days)
  const impulse = (() => {
    const recent = transactions
      .filter((t) => new Date(t.date) >= subDays(now, 5))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    for (const t of recent) {
      const monthTxns = transactions.filter(
        (x) => x.categoryId === t.categoryId && new Date(x.date) >= monthStart,
      )
      if (monthTxns.length < 3) continue
      const avg = monthTxns.reduce((s, x) => s + x.amount, 0) / monthTxns.length
      if (avg > 0 && t.amount >= avg * 2) {
        const cat = categories.find((c) => c.id === t.categoryId)
        return { t, avg, catName: cat?.name ?? 'that category' }
      }
    }
    return null
  })()
  if (impulse) {
    candidates.push({
      id: 'impulse',
      kind: 'impulse',
      severity: 'info',
      title: phrase(tone, `${seedDay}-impT`, {
        factual: ['Bigger than usual'],
        encouraging: ['Quick check'],
        playful: ['A moment'],
      }),
      body: phrase(tone, `${seedDay}-impB`, {
        factual: [
          `${money(impulse.t.amount)} at ${impulse.t.merchant} — about 2× your usual ${impulse.catName}.`,
        ],
        encouraging: [
          `${money(impulse.t.amount)} at ${impulse.t.merchant} was bigger than your usual ${impulse.catName}. All good — just flagging.`,
        ],
        playful: [
          `${money(impulse.t.amount)} at ${impulse.t.merchant} — that’s a moment, not your usual ${impulse.catName} run.`,
        ],
      }),
    })
  }

  // 6) Win (only when nothing's on fire)
  const noAlert = !overNow && !projectedOver
  if (noAlert && totalBudget > 0 && projectedTotal < totalBudget) {
    const underBy = Math.round(totalBudget - projectedTotal)
    candidates.push({
      id: 'win',
      kind: 'win',
      severity: 'positive',
      title: phrase(tone, `${seedDay}-winT`, {
        factual: ['On pace'],
        encouraging: ['Nice rhythm'],
        playful: ['Behaving'],
      }),
      body: phrase(tone, `${seedDay}-winB`, {
        factual: [`At this pace you finish ~${money(underBy)} under budget this month.`],
        encouraging: [`You’re trending ${money(underBy)} under for the month. Keep it going.`],
        playful: [`This month’s looking clean — ~${money(underBy)} under and you’re not even trying.`],
      }),
    })
  }

  // Headline = first alert, else first positive, else a neutral on-pace line.
  const headline: CoachInsight =
    candidates.find((c) => c.severity === 'alert') ??
    candidates.find((c) => c.severity === 'positive') ??
    candidates.find((c) => c.kind === 'top_category') ?? {
      id: 'neutral',
      kind: 'neutral',
      severity: 'info',
      title: totalBudget === 0 ? 'Welcome to Coach' : 'All quiet',
      body:
        totalBudget === 0
          ? 'Add a few categories and log a spend or two — the coaching starts the moment there’s data.'
          : 'Nothing notable yet this month. Log spends as they happen and I’ll flag patterns here.',
    }

  // Feed = everything except the headline, deduped by kind, capped.
  const seen = new Set<string>([headline.id])
  const insights = candidates.filter((c) => !seen.has(c.id) && (seen.add(c.id), true)).slice(0, 5)

  // ---- Subscriptions audit ------------------------------------------------
  const subsCat = categories.find((c) => c.name === 'Subscriptions')
  const subMap = new Map<string, SubItem>()
  if (subsCat) {
    for (const t of transactions.filter((x) => x.categoryId === subsCat.id)) {
      // keep one row per merchant (latest amount wins)
      subMap.set(t.merchant, { id: t.id, merchant: t.merchant, amount: t.amount })
    }
  }
  const subItems = [...subMap.values()].sort((a, b) => b.amount - a.amount)
  const subscriptions = {
    items: subItems,
    monthlyTotal: subItems.reduce((s, t) => s + t.amount, 0),
  }

  // ---- Streaks ------------------------------------------------------------
  const spendDays = new Set(transactions.map((t) => new Date(t.date).toISOString().slice(0, 10)))
  const coffeeCat = categories.find((c) => c.name === 'Coffee')
  const coffeeDays = new Set(
    coffeeCat
      ? transactions
          .filter((t) => t.categoryId === coffeeCat.id)
          .map((t) => new Date(t.date).toISOString().slice(0, 10))
      : [],
  )
  const streakFrom = (days: Set<string>) => {
    let n = 0
    for (let i = 0; i <= 60; i++) {
      const key = subDays(now, i).toISOString().slice(0, 10)
      if (days.has(key)) break
      n++
    }
    return n
  }
  const streaks: Streaks = {
    noSpendStreak: streakFrom(spendDays),
    noCoffeeStreak: streakFrom(coffeeDays),
    underPace: Math.max(0, Math.round(totalBudget * elapsedFraction - totalSpent)),
  }

  // ---- Goal nudge ---------------------------------------------------------
  let goalNudge: GoalNudge | null = null
  if (goals.length > 0) {
    // The goal that needs the most attention: lowest % complete.
    const goal = [...goals].sort(
      (a, b) => a.currentAmount / a.targetAmount - b.currentAmount / b.targetAmount,
    )[0]
    const gRemaining = Math.max(0, goal.targetAmount - goal.currentAmount)
    const pct = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0
    let weeksLeft: number | null = null
    let perWeek: number | null = null
    if (goal.targetDate) {
      const ms = new Date(goal.targetDate).getTime() - now.getTime()
      if (ms > 0) {
        weeksLeft = Math.max(1, Math.round(ms / (7 * 86_400_000)))
        perWeek = Math.ceil(gRemaining / weeksLeft)
      }
    }
    const suggested = Math.max(5, Math.min(gRemaining, Math.round(safe.today)))
    goalNudge = { goal, pct, remaining: gRemaining, weeksLeft, perWeek, suggested }
  }

  // ---- What-if ------------------------------------------------------------
  const topDisc = catStats
    .filter((s) => !ESSENTIAL.has(s.c.name) && s.spent > 0)
    .sort((a, b) => b.spent - a.spent)[0]
  const whatIf: WhatIf | null = topDisc
    ? { category: topDisc.c, monthlySpend: topDisc.spent }
    : null

  // ---- Weekly recap -------------------------------------------------------
  const recapTopCat = (() => {
    const map: Record<string, number> = {}
    for (const t of transactions) {
      if (new Date(t.date) >= subDays(now, 7))
        map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount
    }
    const id = Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0]
    return categories.find((c) => c.id === id)?.name ?? null
  })()
  const recapDelta = lastWeek > 0 ? thisWeek - lastWeek : 0
  const recap = {
    title: phrase(tone, `${seedDay}-recapT`, {
      factual: ['Week recap'],
      encouraging: ['Your week'],
      playful: ['Week wrapped'],
    }),
    body: phrase(tone, `${seedDay}-recapB`, {
      factual: [
        `${money(thisWeek)} spent this week${lastWeek > 0 ? `, ${money(Math.abs(recapDelta))} ${recapDelta >= 0 ? 'more' : 'less'} than last` : ''}.${recapTopCat ? ` ${recapTopCat} led.` : ''}`,
      ],
      encouraging: [
        `${money(thisWeek)} this week${recapDelta < 0 ? `, ${money(Math.abs(recapDelta))} less than last — that counts` : ''}.${recapTopCat ? ` Mostly ${recapTopCat}.` : ''}`,
      ],
      playful: [
        `${money(thisWeek)} out the door this week.${recapTopCat ? ` ${recapTopCat} won again.` : ''}`,
      ],
    }),
  }

  // ---- Ask-the-Coach (deterministic answers) ------------------------------
  const secondCat = [...catStats].sort((a, b) => b.spent - a.spent)[1]
  const answers = {
    afford:
      totalBudget === 0
        ? 'Set up your budget first and I’ll tell you exactly what’s safe to spend.'
        : `You’ve got ${money(safe.today)} safe to spend today and ${money(guiltFree)} of guilt-free money left this month. Anything under that won’t set off a nudge.`,
    going:
      top && top.spent > 0
        ? `${top.c.name} is your biggest category at ${money(top.spent)}${secondCat && secondCat.spent > 0 ? `, then ${secondCat.c.name} at ${money(secondCat.spent)}` : ''}. ${money(totalSpent)} spent of your ${money(totalBudget)} budget so far.`
        : 'Nothing logged this month yet — once you spend, I’ll break down where it goes.',
    track:
      totalBudget === 0
        ? 'Add categories to start tracking against a budget.'
        : usedPct <= elapsedPct
          ? `On track — you’ve used ${usedPct}% of budget and ${elapsedPct}% of the month has passed. Projected to finish around ${money(projectedTotal)}.`
          : `A little ahead of pace — ${usedPct}% of budget used with ${elapsedPct}% of the month gone. Projected finish: ${money(projectedTotal)} vs. your ${money(totalBudget)} budget.`,
    cut:
      subscriptions.monthlyTotal > 0
        ? `Quickest win: your subscriptions run ${money(subscriptions.monthlyTotal)}/mo across ${subscriptions.items.length}. Cancel one you don’t use below.${topDisc ? ` After that, ${topDisc.c.name} (${money(topDisc.spent)}) is your biggest discretionary spend.` : ''}`
        : topDisc
          ? `${topDisc.c.name} is your biggest discretionary spend at ${money(topDisc.spent)} this month — the easiest place to trim.`
          : 'Nothing obvious to cut yet — you’re running lean.',
  }

  return {
    greetingSub,
    safe,
    guiltFree,
    headline,
    insights,
    subscriptions,
    recap,
    goalNudge,
    streaks,
    whatIf,
    answers,
  }
}
