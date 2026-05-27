import { differenceInHours, endOfMonth, isAfter, startOfMonth, subDays, subWeeks } from 'date-fns'
import type { AppState } from '@/store/useAppStore'
import { getNotificationCopy } from '@/lib/notificationCopy'
import type { NotificationItem, NotificationType, Transaction } from '@/lib/types'

/**
 * Evaluate a freshly-added transaction. Returns the highest-priority
 * notification it triggers, or null if none. Caller is responsible for
 * pushing into store + toast surface.
 */
export function evaluateTransaction(
  txn: Transaction,
  state: Pick<AppState, 'categories' | 'transactions' | 'notifications' | 'user'>,
): NotificationItem | null {
  const category = state.categories.find((c) => c.id === txn.categoryId)
  if (!category || !state.user) return null

  const txnDate = new Date(txn.date)
  const monthStart = startOfMonth(txnDate)
  const monthEnd = endOfMonth(txnDate)
  const tone = state.user.notificationTone

  // Spending in this category, this month, INCLUDING the just-added txn
  const monthTxns = state.transactions.filter(
    (t) =>
      t.categoryId === txn.categoryId &&
      isAfter(new Date(t.date), subDays(monthStart, 1)) &&
      !isAfter(new Date(t.date), txnDate),
  )
  const monthSpent = monthTxns.reduce((s, t) => s + t.amount, 0)
  const monthSpentBefore = monthSpent - txn.amount
  const pct = monthSpent / category.monthlyBudget
  const pctBefore = monthSpentBefore / category.monthlyBudget
  const remaining = Math.max(0, category.monthlyBudget - monthSpent)
  const over = Math.max(0, monthSpent - category.monthlyBudget)
  const daysLeft = Math.max(
    1,
    Math.ceil((monthEnd.getTime() - txnDate.getTime()) / (1000 * 60 * 60 * 24)),
  )

  const baseCtx = {
    amount: txn.amount,
    merchant: txn.merchant,
    category: category.name,
    remaining,
    spent: monthSpent,
    budget: category.monthlyBudget,
    pct: Math.round(pct * 100),
    over,
    days_left: daysLeft,
  }

  // ──────────────────────────────────────────────────────────────
  // Rule priority (first match wins, except SAFE which is sampled last)

  // 1. OVER
  if (pct > 1.0 && !alertedRecently(state.notifications, 'over', category.id, 24)) {
    return build('over', txn, category.id, baseCtx, tone)
  }

  // 2. AT_LIMIT
  if (
    pct >= 0.95 &&
    pct <= 1.0 &&
    !alertedRecently(state.notifications, 'at_limit', category.id, 24)
  ) {
    return build('at_limit', txn, category.id, baseCtx, tone)
  }

  // 3. APPROACHING (just crossed 70%)
  if (
    pct >= 0.7 &&
    pctBefore < 0.7 &&
    !alertedRecently(state.notifications, 'approaching', category.id, 24)
  ) {
    return build('approaching', txn, category.id, baseCtx, tone)
  }

  // 4. PATTERN — 3+ same category in 48h
  const recent = state.transactions.filter(
    (t) =>
      t.categoryId === txn.categoryId &&
      differenceInHours(txnDate, new Date(t.date)) >= 0 &&
      differenceInHours(txnDate, new Date(t.date)) <= 48,
  )
  if (
    recent.length >= 3 &&
    !alertedRecently(state.notifications, 'pattern', category.id, 24)
  ) {
    return build(
      'pattern',
      txn,
      category.id,
      {
        ...baseCtx,
        count: recent.length,
        total: recent.reduce((s, t) => s + t.amount, 0),
      },
      tone,
    )
  }

  // 5. IMPULSE — 2× user avg + over $25
  const avgTxn = avgCategoryTxn(state.transactions, category.id, txnDate, 30)
  if (avgTxn > 0 && txn.amount >= 2 * avgTxn && txn.amount > 25) {
    return build('impulse', txn, category.id, baseCtx, tone)
  }

  // 6. TREND — weekly >20% above 4-week avg
  const thisWeekSpend = sumSince(state.transactions, category.id, subDays(txnDate, 7), txnDate)
  const fourWeekAvg = avgWeeklySpend(state.transactions, category.id, txnDate, 4)
  if (
    fourWeekAvg > 0 &&
    thisWeekSpend > 1.2 * fourWeekAvg &&
    !alertedRecently(state.notifications, 'trend', category.id, 24 * 7)
  ) {
    const deltaPct = Math.round((thisWeekSpend / fourWeekAvg - 1) * 100)
    return build('trend', txn, category.id, { ...baseCtx, delta_pct: deltaPct }, tone)
  }

  // 7. SAFE — sampled at 30%
  if (Math.random() < 0.3) {
    return build('safe', txn, category.id, baseCtx, tone)
  }

  return null
}

// ──────────────────────────────────────────────────────────────
// Helpers

function build(
  type: NotificationType,
  txn: Transaction,
  categoryId: string,
  ctx: Parameters<typeof getNotificationCopy>[1],
  tone: Parameters<typeof getNotificationCopy>[2],
): NotificationItem {
  const copy = getNotificationCopy(type, ctx, tone)
  return {
    id: crypto.randomUUID(),
    type,
    title: copy.title,
    body: copy.body,
    transactionId: txn.id,
    categoryId,
    read: false,
    createdAt: new Date().toISOString(),
  }
}

function alertedRecently(
  notifications: NotificationItem[],
  type: NotificationType,
  categoryId: string,
  withinHours: number,
): boolean {
  const cutoff = Date.now() - withinHours * 60 * 60 * 1000
  return notifications.some(
    (n) =>
      n.type === type &&
      n.categoryId === categoryId &&
      new Date(n.createdAt).getTime() > cutoff,
  )
}

function avgCategoryTxn(
  transactions: Transaction[],
  categoryId: string,
  asOf: Date,
  days: number,
): number {
  const cutoff = subDays(asOf, days)
  const txns = transactions.filter(
    (t) =>
      t.categoryId === categoryId &&
      isAfter(new Date(t.date), cutoff) &&
      !isAfter(new Date(t.date), asOf),
  )
  if (!txns.length) return 0
  return txns.reduce((s, t) => s + t.amount, 0) / txns.length
}

function sumSince(
  transactions: Transaction[],
  categoryId: string,
  since: Date,
  until: Date,
): number {
  return transactions
    .filter(
      (t) =>
        t.categoryId === categoryId &&
        isAfter(new Date(t.date), since) &&
        !isAfter(new Date(t.date), until),
    )
    .reduce((s, t) => s + t.amount, 0)
}

function avgWeeklySpend(
  transactions: Transaction[],
  categoryId: string,
  asOf: Date,
  weeks: number,
): number {
  let total = 0
  for (let i = 1; i <= weeks; i++) {
    const end = subWeeks(asOf, i - 1)
    const start = subWeeks(end, 1)
    total += sumSince(transactions, categoryId, start, end)
  }
  return total / weeks
}
