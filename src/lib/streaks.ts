import { differenceInCalendarDays, format, subDays } from 'date-fns'
import type { Challenge, Transaction } from '@/lib/types'

const dayKey = (d: Date) => format(d, 'yyyy-MM-dd')

/** Set of day-keys (yyyy-MM-dd) that have at least one transaction. */
function spendDaySet(transactions: Transaction[]): Set<string> {
  return new Set(transactions.map((t) => dayKey(new Date(t.date))))
}

/**
 * Current run of consecutive no-spend days ending at `asOf` (today counts as
 * in-progress). Returns 0 if there's spending today.
 */
export function currentNoSpendStreak(
  transactions: Transaction[],
  asOf: Date = new Date(),
): number {
  const spend = spendDaySet(transactions)
  let streak = 0
  for (let i = 0; i <= 365; i++) {
    if (spend.has(dayKey(subDays(asOf, i)))) break
    streak++
  }
  return streak
}

/** Longest no-spend run within the last `lookback` days (inclusive of today). */
export function bestNoSpendStreak(
  transactions: Transaction[],
  asOf: Date = new Date(),
  lookback = 90,
): number {
  const spend = spendDaySet(transactions)
  let best = 0
  let run = 0
  for (let i = lookback - 1; i >= 0; i--) {
    if (spend.has(dayKey(subDays(asOf, i)))) {
      run = 0
    } else {
      run++
      if (run > best) best = run
    }
  }
  return best
}

/** No-spend days in the window [since, asOf] (inclusive). */
function noSpendDaysSince(
  transactions: Transaction[],
  since: Date,
  asOf: Date = new Date(),
): number {
  const spend = spendDaySet(transactions)
  const span = Math.max(0, differenceInCalendarDays(asOf, since))
  let count = 0
  for (let i = 0; i <= span; i++) {
    if (!spend.has(dayKey(subDays(asOf, i)))) count++
  }
  return count
}

export interface ChallengeStatus {
  current: number
  target: number
  pct: number // 0..1
  done: boolean
  unit: string
}

/**
 * Live progress for a challenge, derived from transactions. All supported
 * metrics count up toward `target`, so progress is simply current/target.
 */
export function challengeProgress(
  ch: Challenge,
  transactions: Transaction[],
  asOf: Date = new Date(),
): ChallengeStatus {
  const target = ch.target ?? 1
  let current = 0
  let unit = ''

  switch (ch.metric) {
    case 'no_spend_days': {
      const since = ch.startedAt ? new Date(ch.startedAt) : asOf
      current = noSpendDaysSince(transactions, since, asOf)
      unit = 'no-spend days'
      break
    }
    case 'streak': {
      current = currentNoSpendStreak(transactions, asOf)
      unit = 'day streak'
      break
    }
    case 'log_count': {
      const since = ch.startedAt ? new Date(ch.startedAt) : new Date(0)
      current = transactions.filter((t) => new Date(t.date) >= since).length
      unit = 'logged'
      break
    }
  }

  const pct = target > 0 ? Math.min(1, current / target) : 0
  return { current, target, pct, done: current >= target, unit }
}
