import { endOfMonth, format, isSameDay, startOfMonth, subDays } from 'date-fns'
import type { Category, Transaction } from '@/lib/types'

export function categorySpentThisMonth(
  transactions: Transaction[],
  categoryId: string,
  asOf: Date = new Date(),
): number {
  const start = startOfMonth(asOf)
  return transactions
    .filter(
      (t) =>
        t.categoryId === categoryId &&
        new Date(t.date) >= start &&
        new Date(t.date) <= asOf,
    )
    .reduce((s, t) => s + t.amount, 0)
}

export function totalSpentThisMonth(
  transactions: Transaction[],
  asOf: Date = new Date(),
): number {
  const start = startOfMonth(asOf)
  return transactions
    .filter((t) => new Date(t.date) >= start && new Date(t.date) <= asOf)
    .reduce((s, t) => s + t.amount, 0)
}

export function totalBudget(categories: Category[]): number {
  return categories.reduce((s, c) => s + c.monthlyBudget, 0)
}

export function spentInDateRange(
  transactions: Transaction[],
  start: Date,
  end: Date,
): number {
  return transactions
    .filter((t) => {
      const d = new Date(t.date)
      return d >= start && d <= end
    })
    .reduce((s, t) => s + t.amount, 0)
}

export function spentThisWeek(
  transactions: Transaction[],
  asOf: Date = new Date(),
): number {
  return spentInDateRange(transactions, subDays(asOf, 7), asOf)
}

export function spentLastWeek(
  transactions: Transaction[],
  asOf: Date = new Date(),
): number {
  return spentInDateRange(transactions, subDays(asOf, 14), subDays(asOf, 7))
}

/** Number of the last `days` calendar days (incl. today) with zero spending. */
export function noSpendDays(
  transactions: Transaction[],
  asOf: Date = new Date(),
  days = 7,
): number {
  const spendDays = new Set(
    transactions.map((t) => format(new Date(t.date), 'yyyy-MM-dd')),
  )
  let count = 0
  for (let i = 0; i < days; i++) {
    const d = subDays(asOf, i)
    if (!spendDays.has(format(d, 'yyyy-MM-dd'))) count++
  }
  return count
}

export function daysLeftInMonth(asOf: Date = new Date()): number {
  const end = endOfMonth(asOf)
  return Math.max(
    0,
    Math.ceil((end.getTime() - asOf.getTime()) / (1000 * 60 * 60 * 24)),
  )
}

export function groupTransactionsByDate(transactions: Transaction[]) {
  const groups: Record<string, Transaction[]> = {}
  for (const t of transactions) {
    const key = format(new Date(t.date), 'yyyy-MM-dd')
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([dateKey, items]) => ({
      dateKey,
      label: formatDateLabel(new Date(dateKey)),
      items: items.sort((a, b) => (a.date < b.date ? 1 : -1)),
    }))
}

export function formatDateLabel(d: Date, today: Date = new Date()): string {
  if (isSameDay(d, today)) return 'Today'
  if (isSameDay(d, subDays(today, 1))) return 'Yesterday'
  if (today.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000) {
    return format(d, 'EEEE')
  }
  return format(d, 'EEE, MMM d')
}

/** Sum of all spending in last N days, grouped by day. Returns Recharts-ready array. */
export function dailyCumulativeForCategory(
  transactions: Transaction[],
  categoryId: string,
  asOf: Date = new Date(),
) {
  const start = startOfMonth(asOf)
  const days = Math.ceil(
    (asOf.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  )
  const result: { day: number; spent: number; pace: number }[] = []
  for (let i = 0; i <= days; i++) {
    const dayDate = new Date(start)
    dayDate.setDate(start.getDate() + i)
    const dayEnd = new Date(dayDate)
    dayEnd.setHours(23, 59, 59, 999)
    const cum = transactions
      .filter(
        (t) =>
          t.categoryId === categoryId &&
          new Date(t.date) >= start &&
          new Date(t.date) <= dayEnd,
      )
      .reduce((s, t) => s + t.amount, 0)
    result.push({ day: i + 1, spent: cum, pace: 0 })
  }
  return result
}
