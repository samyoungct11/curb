import { startOfMonth } from 'date-fns'
import type { AppState } from '@/store/useAppStore'
import { detectSubscriptions, type Cadence } from '@/lib/subscriptions'
import { computeSafeToSpend, computeVelocity } from '@/lib/safeToSpend'
import { mealPlanStatus, swipeMath } from '@/lib/mealPlan'

/**
 * Compact, model-friendly snapshot of the user's money.
 *
 * This is the payload the client POSTs to /api/coach. The serverless function
 * never touches localStorage or a bank — everything the LLM reasons about (and
 * the data its tools slice) comes from this object. Keeping it small keeps the
 * request cheap and the prompt cache-friendly.
 */

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

export interface SnapshotCategory {
  name: string
  budget: number
  spent: number
  remaining: number
}

export interface SnapshotTransaction {
  date: string // yyyy-MM-dd
  merchant: string
  amount: number
  category: string
}

export interface SnapshotSub {
  merchant: string
  amount: number
  cadence: Cadence
  monthly: number
  /** Percent price increase since the first observed charge, if any. */
  priceChangePct?: number
  essential: boolean
}

export interface CoachSnapshot {
  today: string
  currency: string
  user: {
    name: string
    monthlyIncome: number
    isStudent: boolean
    ageRange: string
    tone: string
  }
  overview: {
    totalBudget: number
    totalSpent: number
    remaining: number
    /** % of budget used (0–100+). */
    usedPct: number
    /** % of the calendar month elapsed (0–100). */
    elapsedPct: number
    projectedTotal: number
    paceStatus: 'under' | 'watch' | 'over'
    /** Money left in non-essential budgets this month. */
    guiltFree: number
    safeToSpendPerDay: number | null
    periodRemaining: number | null
    daysToPayday: number | null
    nextPayday: string | null
  }
  categories: SnapshotCategory[]
  subscriptions: { items: SnapshotSub[]; monthlyTotal: number; foundMoney: number }
  /** Most recent transactions, newest-first (capped). */
  transactions: SnapshotTransaction[]
  goals: { name: string; target: number; current: number; targetDate?: string }[]
  /**
   * Campus meal plan — prepaid, use-it-or-lose-it money the coach should
   * steer the student toward before cash. Null when no plan is set up.
   */
  mealPlan: {
    school: string
    diningDollars: number
    dailyAllowance: number
    burnPerDay: number
    paceStatus: 'ahead' | 'on_track' | 'behind'
    /** Date the balance runs out at current pace; null = lasts to term end. */
    projectedRunOut: string | null
    termEnd: string
    swipesRemaining: number | null
    swipeValue: number | null
  } | null
}

const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`

const round2 = (n: number) => Math.round(n * 100) / 100

export function buildCoachSnapshot(
  state: Pick<
    AppState,
    'user' | 'categories' | 'transactions' | 'goals' | 'payProfile' | 'bills' | 'mealPlan'
  >,
  now: Date = new Date(),
  txnLimit = 60,
): CoachSnapshot {
  const { user, categories, transactions, goals, payProfile, bills, mealPlan } = state
  const monthStart = startOfMonth(now)

  const catById = Object.fromEntries(categories.map((c) => [c.id, c]))
  const spentByCat: Record<string, number> = {}
  for (const t of transactions) {
    const d = new Date(t.date)
    if (d >= monthStart && d <= now) {
      spentByCat[t.categoryId] = (spentByCat[t.categoryId] ?? 0) + t.amount
    }
  }

  const snapCategories: SnapshotCategory[] = categories.map((c) => {
    const spent = spentByCat[c.id] ?? 0
    return {
      name: c.name,
      budget: c.monthlyBudget,
      spent: round2(spent),
      remaining: round2(c.monthlyBudget - spent),
    }
  })

  const velocity = computeVelocity(categories, transactions, now)
  const guiltFree = categories
    .filter((c) => !ESSENTIAL.has(c.name))
    .reduce((s, c) => s + Math.max(0, c.monthlyBudget - (spentByCat[c.id] ?? 0)), 0)

  const safe = payProfile
    ? computeSafeToSpend({ user, profile: payProfile, bills, categories, transactions }, now)
    : null

  const audit = detectSubscriptions(transactions, categories)

  const snapTransactions: SnapshotTransaction[] = [...transactions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, txnLimit)
    .map((t) => ({
      date: isoDay(new Date(t.date)),
      merchant: t.merchant,
      amount: t.amount,
      category: catById[t.categoryId]?.name ?? 'Other',
    }))

  return {
    today: isoDay(now),
    currency: 'USD',
    user: {
      name: user?.name ?? 'there',
      monthlyIncome: user?.monthlyIncome ?? 0,
      isStudent: user?.isStudent ?? false,
      ageRange: user?.ageRange ?? '18-22',
      tone: user?.notificationTone ?? 'balanced',
    },
    overview: {
      totalBudget: round2(velocity.budget),
      totalSpent: round2(velocity.spent),
      remaining: round2(velocity.budget - velocity.spent),
      usedPct: Math.round(velocity.usedPct * 100),
      elapsedPct: Math.round(velocity.elapsedPct * 100),
      projectedTotal: round2(velocity.projectedTotal),
      paceStatus: velocity.status,
      guiltFree: round2(guiltFree),
      safeToSpendPerDay: safe ? round2(safe.perDay) : null,
      periodRemaining: safe ? round2(safe.periodRemaining) : null,
      daysToPayday: safe ? safe.period.daysRemaining : null,
      nextPayday: safe ? isoDay(safe.period.end) : null,
    },
    categories: snapCategories,
    subscriptions: {
      items: audit.subs.map((s) => ({
        merchant: s.merchant,
        amount: round2(s.amount),
        cadence: s.cadence,
        monthly: round2(s.monthly),
        priceChangePct: s.priceChange?.pct,
        essential: s.essential,
      })),
      monthlyTotal: round2(audit.monthlyTotal),
      foundMoney: round2(audit.foundMoney),
    },
    transactions: snapTransactions,
    goals: goals.map((g) => ({
      name: g.name,
      target: g.targetAmount,
      current: g.currentAmount,
      targetDate: g.targetDate,
    })),
    mealPlan: mealPlan
      ? (() => {
          const s = mealPlanStatus(mealPlan, now)
          const sw = swipeMath(mealPlan)
          return {
            school: mealPlan.school,
            diningDollars: round2(mealPlan.diningDollars),
            dailyAllowance: round2(s.dailyAllowance),
            burnPerDay: round2(s.burnPerDay),
            paceStatus: s.pace,
            projectedRunOut: s.runOutDate ? isoDay(s.runOutDate) : null,
            termEnd: mealPlan.termEnd,
            swipesRemaining: sw?.remaining ?? null,
            swipeValue: sw ? round2(sw.value) : null,
          }
        })()
      : null,
  }
}
