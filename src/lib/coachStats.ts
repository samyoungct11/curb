import { subDays } from 'date-fns'
import type { Category, Transaction } from '@/lib/types'
import { money } from '@/lib/utils'

/**
 * Focused, live computations for the Coach screen's "soft" insights — the
 * streaks, weekend pattern, and recent-wins that used to be hardcoded.
 * Pure functions over the user's real transactions; no services.
 */

function dayKey(d: Date): string {
  // Local calendar day (not UTC) so streaks line up with the user's days.
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ---------------------------------------------------------------------------
// Streaks
// ---------------------------------------------------------------------------

export interface CoachStreaks {
  /** Consecutive days (ending today) with no spending at all. */
  noSpend: number
  /** Consecutive days (ending today) with no Coffee-category spend. */
  noCoffee: number
  /** Dollars currently under the straight-line monthly pace (0 if over). */
  underPace: number
}

/** Count of trailing days (from today backwards) whose key isn't in `days`. */
function trailingStreak(days: Set<string>, now: Date, max = 90): number {
  let n = 0
  for (let i = 0; i < max; i++) {
    if (days.has(dayKey(subDays(now, i)))) break
    n++
  }
  return n
}

export function computeStreaks(
  transactions: Transaction[],
  categories: Category[],
  now: Date = new Date(),
): CoachStreaks {
  const spendDays = new Set(transactions.map((t) => dayKey(new Date(t.date))))

  const coffeeCat = categories.find((c) => c.name === 'Coffee')
  const coffeeDays = new Set(
    coffeeCat
      ? transactions
          .filter((t) => t.categoryId === coffeeCat.id)
          .map((t) => dayKey(new Date(t.date)))
      : [],
  )

  // Under-pace: budget × month-elapsed-fraction − spent so far this month.
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const elapsedFraction = Math.min(1, now.getDate() / totalDays)
  const totalBudget = categories.reduce((s, c) => s + c.monthlyBudget, 0)
  const spentThisMonth = transactions
    .filter((t) => {
      const d = new Date(t.date)
      return d >= monthStart && d <= now
    })
    .reduce((s, t) => s + t.amount, 0)
  const underPace = Math.max(
    0,
    Math.round(totalBudget * elapsedFraction - spentThisMonth),
  )

  return {
    noSpend: trailingStreak(spendDays, now),
    noCoffee: trailingStreak(coffeeDays, now),
    underPace,
  }
}

// ---------------------------------------------------------------------------
// Weekend pattern
// ---------------------------------------------------------------------------

export interface WeekendPattern {
  /** Weekend avg daily spend ÷ weekday avg daily spend. */
  ratio: number
  weekendAvg: number
  weekdayAvg: number
  /** Category that drives the most weekend spend, if any. */
  topCategory: string | null
}

/**
 * Compare average daily spend on weekends vs. weekdays over a trailing window.
 * Returns null when there isn't enough signal to say anything honest.
 */
export function computeWeekendPattern(
  transactions: Transaction[],
  categories: Category[],
  now: Date = new Date(),
  windowDays = 28,
): WeekendPattern | null {
  const start = subDays(now, windowDays)
  const inWindow = transactions.filter((t) => {
    const d = new Date(t.date)
    return d >= start && d <= now
  })
  if (inWindow.length < 6) return null

  let weekendSpend = 0
  let weekdaySpend = 0
  const weekendByCat: Record<string, number> = {}
  for (const t of inWindow) {
    const dow = new Date(t.date).getDay() // 0 = Sun, 6 = Sat
    if (dow === 0 || dow === 6) {
      weekendSpend += t.amount
      weekendByCat[t.categoryId] = (weekendByCat[t.categoryId] ?? 0) + t.amount
    } else {
      weekdaySpend += t.amount
    }
  }

  // Count actual weekend vs. weekday calendar days in the window.
  let weekendDays = 0
  let weekdayDays = 0
  for (let i = 0; i < windowDays; i++) {
    const dow = subDays(now, i).getDay()
    if (dow === 0 || dow === 6) weekendDays++
    else weekdayDays++
  }
  if (weekendDays === 0 || weekdayDays === 0) return null

  const weekendAvg = weekendSpend / weekendDays
  const weekdayAvg = weekdaySpend / weekdayDays
  if (weekdayAvg <= 0 || weekendAvg <= 0) return null

  const topCatId = Object.entries(weekendByCat).sort((a, b) => b[1] - a[1])[0]?.[0]
  const topCategory = categories.find((c) => c.id === topCatId)?.name ?? null

  return {
    ratio: weekendAvg / weekdayAvg,
    weekendAvg,
    weekdayAvg,
    topCategory,
  }
}

/** A finished sentence for the weekend-pattern card, or null to hide it. */
export function weekendPatternBody(p: WeekendPattern | null): string | null {
  if (!p) return null
  const food = p.topCategory ? ` Mostly ${p.topCategory.toLowerCase()}.` : ''
  if (p.ratio >= 1.25) {
    return `You spend ${p.ratio.toFixed(1)}× more per day on weekends than weekdays.${food}`
  }
  if (p.ratio <= 0.8) {
    const inv = 1 / p.ratio
    return `Weekdays are your spendier days — ${inv.toFixed(1)}× a typical weekend day.`
  }
  return `Weekend and weekday spending are about even — no big swing.`
}

// ---------------------------------------------------------------------------
// Recent wins
// ---------------------------------------------------------------------------

function sumBetween(txns: Transaction[], start: Date, end: Date): number {
  return txns.reduce((s, t) => {
    const d = new Date(t.date)
    return d >= start && d < end ? s + t.amount : s
  }, 0)
}

/**
 * The strongest genuine positive right now, phrased as a sentence — or null
 * when there's nothing honestly worth celebrating.
 */
export function recentWin(
  transactions: Transaction[],
  categories: Category[],
  now: Date = new Date(),
): string | null {
  const streaks = computeStreaks(transactions, categories, now)

  if (streaks.noSpend >= 2) {
    return `No spending in ${streaks.noSpend} days — your longest quiet stretch lately.`
  }

  const thisWeek = sumBetween(transactions, subDays(now, 7), now)
  const lastWeek = sumBetween(transactions, subDays(now, 14), subDays(now, 7))
  if (lastWeek > 0) {
    const deltaPct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
    if (deltaPct <= -15) {
      return `Spending's down ${Math.abs(deltaPct)}% from last week. That counts.`
    }
  }

  if (streaks.underPace > 0) {
    return `You're ${money(streaks.underPace)} under your pace for the month. Keep it going.`
  }

  if (streaks.noCoffee >= 3) {
    return `${streaks.noCoffee} days without a coffee run — small wins add up.`
  }

  return null
}
