import type { Category, Transaction } from '@/lib/types'

/**
 * Recurring-charge detector + found-money sweep — pure arithmetic, no services.
 *
 * Scans ALL transactions (not just a "Subscriptions" category) and finds
 * merchants that charge on a regular cadence for a consistent amount. For each
 * it reports:
 *   - cadence (weekly / monthly / yearly) inferred from the gap between charges
 *   - the normalized monthly cost
 *   - a price-change flag when the latest charge is higher than the first
 *
 * "Found money" = the monthly total of detected subscriptions you could
 * realistically cancel (i.e. excluding essential categories like Transport).
 */

const MS_PER_DAY = 86_400_000
const WEEKS_PER_MONTH = 4.345

/** Categories whose recurring charges aren't "cancelable" found money. */
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

export type Cadence = 'weekly' | 'monthly' | 'yearly'

export interface DetectedSub {
  /** Stable key derived from the normalized merchant name. */
  key: string
  merchant: string
  /** Most recent per-charge amount (reflects the current price). */
  amount: number
  cadence: Cadence
  /** Amount normalized to a monthly figure. */
  monthly: number
  occurrences: number
  /** ISO date of the most recent charge. */
  lastDate: string
  categoryId: string
  categoryName: string
  /** True when the category is essential → excluded from found money. */
  essential: boolean
  /** Set when the price rose across the observed charges. */
  priceChange: { from: number; to: number; pct: number } | null
}

export interface SubscriptionAudit {
  /** Detected subscriptions, sorted by monthly cost descending. */
  subs: DetectedSub[]
  /** Sum of monthly cost across all detected subscriptions. */
  monthlyTotal: number
  /** Monthly cost you could free up (non-essential subscriptions). */
  foundMoney: number
  /** Subscriptions whose price rose over time. */
  priceHikes: DetectedSub[]
}

const CADENCE_LABEL: Record<Cadence, string> = {
  weekly: '/wk',
  monthly: '/mo',
  yearly: '/yr',
}

export function cadenceLabel(c: Cadence): string {
  return CADENCE_LABEL[c]
}

function normalizeKey(merchant: string): string {
  return merchant.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

function classifyCadence(medianGapDays: number): Cadence | null {
  if (medianGapDays >= 5 && medianGapDays <= 10) return 'weekly'
  if (medianGapDays >= 24 && medianGapDays <= 38) return 'monthly'
  if (medianGapDays >= 330 && medianGapDays <= 400) return 'yearly'
  return null
}

function toMonthly(amount: number, cadence: Cadence): number {
  if (cadence === 'weekly') return amount * WEEKS_PER_MONTH
  if (cadence === 'yearly') return amount / 12
  return amount
}

/**
 * Detect recurring charges across the user's transactions.
 *
 * A merchant is treated as recurring when EITHER:
 *  - it lives in the "Subscriptions" category (the user has told us so), or
 *  - it has ≥3 charges on a regular cadence for a consistent amount
 *    (this is the "real detection" that works on synced bank data).
 */
export function detectSubscriptions(
  transactions: Transaction[],
  categories: Category[],
): SubscriptionAudit {
  const catById = new Map(categories.map((c) => [c.id, c]))

  // Group transactions by normalized merchant.
  const groups = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const key = normalizeKey(t.merchant)
    if (!key) continue
    const arr = groups.get(key)
    if (arr) arr.push(t)
    else groups.set(key, [t])
  }

  const subs: DetectedSub[] = []

  for (const [key, txnsRaw] of groups) {
    const txns = [...txnsRaw].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
    const latest = txns[txns.length - 1]
    const cat = catById.get(latest.categoryId)
    const inSubsCategory = cat?.name === 'Subscriptions'

    // Gaps (in days) between consecutive charges.
    const gaps: number[] = []
    for (let i = 1; i < txns.length; i++) {
      const days =
        (new Date(txns[i].date).getTime() - new Date(txns[i - 1].date).getTime()) /
        MS_PER_DAY
      gaps.push(days)
    }

    let cadence: Cadence | null = null
    if (gaps.length > 0) {
      const med = median(gaps)
      const minGap = Math.min(...gaps)
      const maxGap = Math.max(...gaps)
      // Regular spacing: the largest gap is no more than ~1.6× the smallest.
      const regular = minGap > 0 && maxGap <= minGap * 1.6
      if (regular) cadence = classifyCadence(med)
    }

    // Amount consistency (coefficient of variation).
    const amounts = txns.map((t) => t.amount)
    const mean = amounts.reduce((s, n) => s + n, 0) / amounts.length
    const variance =
      amounts.reduce((s, n) => s + (n - mean) ** 2, 0) / amounts.length
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 1
    const consistentAmount = cv <= 0.25

    // Detection decision.
    const detectedByPattern =
      txns.length >= 3 && cadence !== null && consistentAmount
    const recurring = inSubsCategory || detectedByPattern
    if (!recurring) continue

    const effectiveCadence: Cadence = cadence ?? 'monthly'
    const amount = latest.amount

    // Price-change flag: first vs. latest observed charge.
    let priceChange: DetectedSub['priceChange'] = null
    if (txns.length >= 2) {
      const first = txns[0].amount
      const last = latest.amount
      if (first > 0 && last - first >= 0.5 && (last - first) / first > 0.02) {
        priceChange = {
          from: first,
          to: last,
          pct: Math.round(((last - first) / first) * 100),
        }
      }
    }

    const categoryName = cat?.name ?? 'Other'
    subs.push({
      key,
      merchant: latest.merchant,
      amount,
      cadence: effectiveCadence,
      monthly: toMonthly(amount, effectiveCadence),
      occurrences: txns.length,
      lastDate: latest.date,
      categoryId: latest.categoryId,
      categoryName,
      essential: ESSENTIAL.has(categoryName),
      priceChange,
    })
  }

  subs.sort((a, b) => b.monthly - a.monthly)

  const monthlyTotal = subs.reduce((s, x) => s + x.monthly, 0)
  const foundMoney = subs
    .filter((x) => !x.essential)
    .reduce((s, x) => s + x.monthly, 0)
  const priceHikes = subs.filter((x) => x.priceChange)

  return { subs, monthlyTotal, foundMoney, priceHikes }
}
