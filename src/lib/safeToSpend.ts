import type { Bill, Category, PayProfile, Transaction, User } from '@/lib/types'

/**
 * Safe-to-Spend + Velocity engine — pure arithmetic, no services.
 *
 * Safe-to-Spend answers "what can I spend today without breaking the month?"
 *   safe (period) = income this period
 *                 − bills due before next payday
 *                 − savings target this period
 *                 − discretionary already spent this period
 *   safe today    = max(0, safe period) ÷ days remaining until next payday
 *
 * Velocity answers "am I on pace to overspend?" by comparing how much of the
 * monthly budget is used vs. how much of the month has elapsed, then
 * projecting the finish (spent ÷ elapsed-fraction).
 */

const MS_PER_DAY = 86_400_000
const DAYS_PER_MONTH = 30.44 // average — used to prorate monthly figures

/** Categories that are never "fun money" and shouldn't count as discretionary. */
const ESSENTIAL = new Set([
  'Groceries',
  'Rent & Bills',
  'Bills',
  'Rent',
  'Transport',
  'Health',
  'Education',
  'School',
])

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * MS_PER_DAY)
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

export interface PayPeriod {
  start: Date
  /** Exclusive end — i.e. the next payday. */
  end: Date
  /** Whole days in the period. */
  daysTotal: number
  /** Days from the start of today through the next payday (min 1). */
  daysRemaining: number
}

/**
 * Resolve the pay period containing `now` from an anchor payday + frequency.
 * Handles anchors in the past or the future.
 */
export function resolvePayPeriod(profile: PayProfile, now: Date = new Date()): PayPeriod {
  const today = startOfDay(now)
  const anchor = startOfDay(new Date(profile.anchorDate))

  let start: Date
  let end: Date

  if (profile.frequency === 'weekly' || profile.frequency === 'biweekly') {
    const interval = profile.frequency === 'weekly' ? 7 : 14
    const diffDays = Math.floor((today.getTime() - anchor.getTime()) / MS_PER_DAY)
    const k = Math.floor(diffDays / interval)
    start = addDays(anchor, k * interval)
    end = addDays(start, interval)
  } else if (profile.frequency === 'semimonthly') {
    // Paydays on the 1st and 15th.
    const y = today.getFullYear()
    const m = today.getMonth()
    if (today.getDate() < 15) {
      start = new Date(y, m, 1)
      end = new Date(y, m, 15)
    } else {
      start = new Date(y, m, 15)
      end = new Date(y, m + 1, 1)
    }
  } else {
    // monthly — anchored on the anchor's day-of-month.
    const payDay = anchor.getDate()
    const clamp = (y: number, m: number) => Math.min(payDay, daysInMonth(y, m))
    start = new Date(today.getFullYear(), today.getMonth(), clamp(today.getFullYear(), today.getMonth()))
    if (start > today) {
      const pm = today.getMonth() - 1
      start = new Date(today.getFullYear(), pm, clamp(today.getFullYear(), pm))
    }
    end = new Date(start.getFullYear(), start.getMonth() + 1, clamp(start.getFullYear(), start.getMonth() + 1))
  }

  const daysTotal = Math.max(1, Math.round((end.getTime() - start.getTime()) / MS_PER_DAY))
  const daysRemaining = Math.max(1, Math.ceil((end.getTime() - today.getTime()) / MS_PER_DAY))
  return { start, end, daysTotal, daysRemaining }
}

/** Next calendar occurrence of `dueDay` on or after `from`. */
function nextDueDate(dueDay: number, from: Date): Date {
  const y = from.getFullYear()
  const m = from.getMonth()
  let d = new Date(y, m, Math.min(dueDay, daysInMonth(y, m)))
  if (d < startOfDay(from)) {
    d = new Date(y, m + 1, Math.min(dueDay, daysInMonth(y, m + 1)))
  }
  return d
}

export interface SafeToSpend {
  /** Spendable per day from now through the next payday. */
  perDay: number
  /** Total spendable for the rest of this period. */
  periodRemaining: number
  /** Whether the period math went negative (over-committed). */
  negative: boolean
  period: PayPeriod
  // Breakdown components (all positive magnitudes):
  income: number
  billsDue: number
  savings: number
  discretionarySpent: number
  /** Bills counted as due before the next payday. */
  upcomingBills: Bill[]
}

export interface SafeToSpendInput {
  user: User | null
  profile: PayProfile
  bills: Bill[]
  categories: Category[]
  transactions: Transaction[]
}

export function computeSafeToSpend(
  input: SafeToSpendInput,
  now: Date = new Date(),
): SafeToSpend {
  const { user, profile, bills, categories, transactions } = input
  const period = resolvePayPeriod(profile, now)

  // Income allocated to this period (prorate monthly income by period length).
  const monthlyIncome = Math.max(0, user?.monthlyIncome ?? 0)
  const income = monthlyIncome * (period.daysTotal / DAYS_PER_MONTH)

  // Bills due between today and the next payday.
  const upcomingBills = bills.filter(
    (b) => nextDueDate(b.dueDay, now) < period.end,
  )
  const billsDue = upcomingBills.reduce((s, b) => s + b.amount, 0)

  // Savings target prorated to this period.
  const savings =
    (profile.monthlySavingsTarget ?? 0) * (period.daysTotal / DAYS_PER_MONTH)

  // Discretionary already spent this period (non-essential categories).
  const catById = Object.fromEntries(categories.map((c) => [c.id, c]))
  const discretionarySpent = transactions
    .filter((t) => {
      const d = new Date(t.date)
      if (d < period.start || d > now) return false
      const name = catById[t.categoryId]?.name ?? ''
      return !ESSENTIAL.has(name)
    })
    .reduce((s, t) => s + t.amount, 0)

  const periodRemaining = income - billsDue - savings - discretionarySpent
  const perDay = Math.max(0, periodRemaining) / period.daysRemaining

  return {
    perDay,
    periodRemaining,
    negative: periodRemaining < 0,
    period,
    income,
    billsDue,
    savings,
    discretionarySpent,
    upcomingBills,
  }
}

export type VelocityStatus = 'under' | 'watch' | 'over'

export interface Velocity {
  spent: number
  budget: number
  /** Fraction of the calendar month elapsed (0–1). */
  elapsedPct: number
  /** Fraction of budget used (0–1+). */
  usedPct: number
  /** Projected month-end total at the current pace. */
  projectedTotal: number
  /** Projected overage vs. budget (negative = projected under). */
  projectedOver: number
  status: VelocityStatus
  /** Worst category by projected overage, if any is on pace to blow its budget. */
  worstCategory: {
    name: string
    spent: number
    budget: number
    projected: number
    over: number
  } | null
}

/** Alert threshold: projected finish above budget × this is "over pace". */
const OVER_THRESHOLD = 1.1

export function computeVelocity(
  categories: Category[],
  transactions: Transaction[],
  now: Date = new Date(),
): Velocity {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const totalDays = daysInMonth(now.getFullYear(), now.getMonth())
  // Elapsed fraction — include today so day 1 isn't a divide-by-zero.
  const elapsedFraction = Math.min(1, now.getDate() / totalDays)

  const spentByCat: Record<string, number> = {}
  for (const t of transactions) {
    const d = new Date(t.date)
    if (d >= monthStart && d <= now) {
      spentByCat[t.categoryId] = (spentByCat[t.categoryId] ?? 0) + t.amount
    }
  }

  const budget = categories.reduce((s, c) => s + c.monthlyBudget, 0)
  const spent = Object.values(spentByCat).reduce((s, n) => s + n, 0)
  const projectedTotal = elapsedFraction > 0 ? spent / elapsedFraction : spent
  const projectedOver = projectedTotal - budget

  const status: VelocityStatus =
    projectedTotal > budget * OVER_THRESHOLD
      ? 'over'
      : projectedTotal > budget
        ? 'watch'
        : 'under'

  // Worst category on pace to overshoot.
  let worstCategory: Velocity['worstCategory'] = null
  for (const c of categories) {
    if (c.monthlyBudget <= 0) continue
    const cSpent = spentByCat[c.id] ?? 0
    const cProjected = elapsedFraction > 0 ? cSpent / elapsedFraction : cSpent
    const over = cProjected - c.monthlyBudget
    if (cProjected > c.monthlyBudget * OVER_THRESHOLD && cSpent > 0) {
      if (!worstCategory || over > worstCategory.over) {
        worstCategory = {
          name: c.name,
          spent: cSpent,
          budget: c.monthlyBudget,
          projected: cProjected,
          over,
        }
      }
    }
  }

  return {
    spent,
    budget,
    elapsedPct: elapsedFraction,
    usedPct: budget > 0 ? spent / budget : 0,
    projectedTotal,
    projectedOver,
    status,
    worstCategory,
  }
}
