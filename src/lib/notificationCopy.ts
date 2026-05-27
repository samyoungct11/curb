import type { NotificationType, ToneMode } from '@/lib/types'

export type Voice = 'factual' | 'encouraging' | 'playful'

interface Template {
  title: string
  body: string
}

export const COPY: Record<NotificationType, Record<Voice, Template[]>> = {
  safe: {
    factual: [
      { title: 'Logged', body: '{amount} at {merchant}. {remaining} left in {category} this month.' },
      { title: 'Logged', body: '{amount} at {merchant}. {category} is at {pct}%.' },
    ],
    encouraging: [
      { title: 'Cruising', body: "{amount} at {merchant} — you've still got {remaining} in {category}." },
      { title: 'Still on track', body: '{amount} at {merchant}. Solid — well inside {category}.' },
    ],
    playful: [
      { title: 'Logged ✓', body: '{amount} at {merchant}. {category} has {remaining} left to play with.' },
      { title: 'Noted', body: '{amount} at {merchant}. {category} budget is living its best life.' },
    ],
  },
  approaching: {
    factual: [
      { title: 'Heads up', body: 'That {amount} puts {category} at {pct}% — {remaining} left for the month.' },
      { title: 'Heads up', body: '{category} is at {pct}% after that {amount}. {days_left} days left in the month.' },
    ],
    encouraging: [
      { title: 'Just so you know', body: '{category} just hit {pct}%. Still room — just on your radar.' },
      { title: 'FYI', body: "You're at {pct}% on {category}. Not over, just a check-in." },
    ],
    playful: [
      { title: 'Worth a glance', body: '{category} tipped past {pct}% with that {amount} 👀' },
      { title: 'Eye on it', body: '{category} vibing at {pct}%. Some runway — not endless.' },
    ],
  },
  at_limit: {
    factual: [
      { title: 'At the limit', body: "You're at {pct}% of {category}. {remaining} left for the month." },
      { title: 'At the limit', body: '{category} is at 100% for the month. Next purchase tips you over.' },
    ],
    encouraging: [
      { title: 'Almost there', body: '{category} is at {pct}% used. Decide where the last bit goes.' },
      { title: 'Heads up', body: '{category} just hit its limit. Your call from here.' },
    ],
    playful: [
      { title: 'Cutting it close', body: '{category} is {pct}% full. {remaining} to last {days_left} days 😬' },
      { title: 'Tapped', body: '{category} budget: maxed. Anything more eats into another category.' },
    ],
  },
  over: {
    factual: [
      { title: 'Over budget', body: '{category} is {over} over for the month.' },
      { title: 'Over budget', body: 'That {amount} put {category} {over} over budget.' },
    ],
    encouraging: [
      { title: 'Past the line', body: "{category}'s {over} over. Tap to see how to rebalance — no drama." },
      { title: 'Crossed the line', body: '{category} just went {over} over. Want to shift things around?' },
    ],
    playful: [
      { title: 'Welp', body: "{category} is {over} over. We've got options though 👀" },
      { title: 'Past it', body: '{category} budget tapped out — {over} over. Tap to fix it.' },
    ],
  },
  pattern: {
    factual: [
      { title: 'Pattern noted', body: "That's your {count}th {category} purchase in 48h — {total} total." },
      { title: 'Pattern noted', body: '{count} {category} purchases this week. {total} so far.' },
    ],
    encouraging: [
      { title: 'Check-in', body: '{category} #{count} this week. {total} so far — still room, just flagging.' },
      { title: 'Worth a beat', body: '{count} {category} purchases in 48h. Worth a pause?' },
    ],
    playful: [
      { title: 'Speedrun', body: '{category} speedrun continues — {count} in 48 hrs, {total} deep.' },
      { title: 'Big fan moment', body: "{category}'s biggest fan: {count} purchases, {total}. Just noting it." },
    ],
  },
  trend: {
    factual: [
      { title: 'Trending up', body: '{category} spend is {delta_pct}% above your usual week.' },
      { title: 'Trending up', body: "You're {delta_pct}% above your weekly average on {category}." },
    ],
    encouraging: [
      { title: 'Trending up', body: '{category} is {delta_pct}% above normal this week. Not over yet.' },
      { title: 'FYI', body: '{category} is running higher than usual this week. Worth knowing.' },
    ],
    playful: [
      { title: 'Moment alert', body: '{category} having a *moment* this week — {delta_pct}% above usual.' },
      { title: 'Line goes up', body: '{category} chart: up and to the right 📈 ({delta_pct}% above normal)' },
    ],
  },
  positive: {
    factual: [
      { title: 'On pace', body: '{category} at {pct}% with {days_left} days left. On pace to finish under.' },
      { title: 'On pace', body: "You're {remaining} under pace for the month overall." },
    ],
    encouraging: [
      { title: 'Nice rhythm', body: 'Trending to finish under on {category}. Keep it going.' },
      { title: 'Solid month', body: 'Solid month so far — {remaining} under pace overall.' },
    ],
    playful: [
      { title: 'Behaving', body: '{category} is *behaving* this month. Currently {remaining} under pace 🎯' },
      { title: 'Looking clean', body: "This month's looking clean — {remaining} under and you're not even trying 🧹" },
    ],
  },
  no_spend: {
    factual: [
      { title: 'Streak: {streak}d', body: '{streak} days no {category} purchases.' },
      { title: 'Streak: {streak}d', body: '{streak}-day no-{category} streak. Longest this month.' },
    ],
    encouraging: [
      { title: 'Nice rhythm', body: '{streak}-day {category} streak going. Quietly winning.' },
      { title: 'Best run', body: 'No {category} for {streak} days. That\'s your best run this month.' },
    ],
    playful: [
      { title: 'Streak 🔥', body: "{streak} days {category}-free and the world hasn't ended." },
      { title: 'Who are you', body: '{streak} days, zero {category}. Who is this 👀' },
    ],
  },
  impulse: {
    factual: [
      { title: 'Bigger than usual', body: '{amount} at {merchant} — bigger than your usual {category}. Still in budget.' },
      { title: 'Bigger than usual', body: '{amount} at {merchant} — 2× your average {category} txn this month.' },
    ],
    encouraging: [
      { title: 'Quick check', body: 'Heads up — that {amount} is bigger than usual. Still inside budget though.' },
      { title: 'Quick check', body: 'Bigger purchase than usual ({amount}). All good — just a flag.' },
    ],
    playful: [
      { title: 'A moment', body: '{amount} is a *moment*, not a typical {category} run for you 👀' },
      { title: 'Big spender', body: '{amount} at {merchant} — bigger than your usual. Just noting it.' },
    ],
  },
  weekly_summary: {
    factual: [
      { title: 'Week recap', body: '{week_total} spent this week. {week_delta} vs. last week. Tap for breakdown.' },
      { title: 'Week recap', body: 'Last week: {week_total} total. {week_delta} from the week before.' },
    ],
    encouraging: [
      { title: 'Week done', body: '{week_total} this week. {week_delta} — recap inside.' },
      { title: 'Week wrapped', body: '{week_total} spent, {week_delta} less than last week. That counts.' },
    ],
    playful: [
      { title: 'Your week 📊', body: '{week_total} out the door. Food won (again) 🍔' },
      { title: 'Week wrapped', body: '{week_total} spent, {week_delta} less than last week. Quietly winning.' },
    ],
  },
  monthly_reset: {
    factual: [
      { title: 'New month', body: '{budget} budgeted across your categories. Fresh start.' },
      { title: 'New month', body: 'Fresh month. Budgets reset, streaks reset, you know the drill.' },
    ],
    encouraging: [
      { title: 'New month', body: "{budget} to work with. Let's make it a good one." },
      { title: 'Clean slate', body: 'New month, clean slate. {budget} ready to be put to work.' },
    ],
    playful: [
      { title: 'New month 🎯', body: "{budget} in the chamber. Let's go." },
      { title: 'New month ✨', body: "It's the 1st. Budget got a haircut and a refresh." },
    ],
  },
  savings_milestone: {
    factual: [
      { title: '{goal_pct}% there', body: '{goal_name}: {goal_pct}% funded. {goal_remaining} to go.' },
      { title: '{goal_pct}% there', body: '{goal_pct}% of the way to {goal_name}.' },
    ],
    encouraging: [
      { title: 'Keep going', body: '{goal_pct}% to {goal_name}. {goal_remaining} left.' },
      { title: 'Closer', body: '{goal_name} is {goal_pct}% real. {goal_remaining} to make it official.' },
    ],
    playful: [
      { title: 'Closer 🌴', body: '{goal_name}: {goal_pct}% there. Closer than yesterday.' },
      { title: 'Unlocked 🎉', body: '{goal_name} is {goal_pct}% funded — {goal_remaining} to the finish line.' },
    ],
  },
}

const VOICE_WEIGHTS: Record<ToneMode, Record<Voice, number>> = {
  strict: { factual: 0.7, encouraging: 0.2, playful: 0.1 },
  balanced: { factual: 0.3, encouraging: 0.4, playful: 0.3 },
  chill: { factual: 0.1, encouraging: 0.3, playful: 0.6 },
}

function pickVoice(tone: ToneMode): Voice {
  const weights = VOICE_WEIGHTS[tone]
  const r = Math.random()
  let acc = 0
  for (const [voice, w] of Object.entries(weights)) {
    acc += w
    if (r < acc) return voice as Voice
  }
  return 'encouraging'
}

const lastIdx: Record<string, number> = {}
function pickTemplate(type: NotificationType, voice: Voice): Template {
  const pool = COPY[type][voice]
  const key = `${type}:${voice}`
  const last = lastIdx[key] ?? -1
  const avail = pool.map((_, i) => i).filter((i) => i !== last)
  const idx = avail[Math.floor(Math.random() * avail.length)] ?? 0
  lastIdx[key] = idx
  return pool[idx]
}

interface Context {
  amount?: number
  merchant?: string
  category?: string
  remaining?: number
  spent?: number
  budget?: number
  pct?: number
  count?: number
  total?: number
  over?: number
  delta_pct?: number
  days_left?: number
  streak?: number
  week_total?: number
  week_delta?: number
  goal_pct?: number
  goal_name?: string
  goal_remaining?: number
}

const fmtMoney = (n: number) => {
  const abs = Math.abs(n)
  const formatted = abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(2)
  return `$${formatted}`
}

const fmtSignedMoney = (n: number) => {
  if (n === 0) return '$0'
  return (n > 0 ? '+' : '−') + fmtMoney(n)
}

const MONEY_KEYS = new Set([
  'amount',
  'remaining',
  'spent',
  'budget',
  'total',
  'over',
  'week_total',
  'goal_remaining',
])

function interpolate(template: string, ctx: Context): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = (ctx as Record<string, unknown>)[key]
    if (v === undefined || v === null) return ''
    if (key === 'week_delta' && typeof v === 'number') return fmtSignedMoney(v)
    if (MONEY_KEYS.has(key) && typeof v === 'number') return fmtMoney(v)
    return String(v)
  })
}

export function getNotificationCopy(
  type: NotificationType,
  ctx: Context,
  tone: ToneMode = 'balanced',
): { title: string; body: string } {
  const voice = pickVoice(tone)
  const tpl = pickTemplate(type, voice)
  return {
    title: interpolate(tpl.title, ctx),
    body: interpolate(tpl.body, ctx),
  }
}
