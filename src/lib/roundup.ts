import type { RoundUpRule, Transaction } from '@/lib/types'

/** Spare change to round a single spend up to the next `multiple` dollars. */
export function roundUpFor(amount: number, multiple: number): number {
  if (amount <= 0 || multiple <= 0) return 0
  const rounded = Math.ceil(amount / multiple) * multiple
  return Math.round((rounded - amount) * 100) / 100
}

/** The timestamp after which round-ups are still pending (not yet swept). */
function pendingSince(rule: RoundUpRule): number {
  return new Date(rule.sweptThrough ?? rule.since).getTime()
}

/**
 * Total spare change accrued but not yet swept into a goal — summed over every
 * purchase logged since the rule was enabled (or last swept).
 */
export function accruedRoundUps(
  transactions: Transaction[],
  rule: RoundUpRule | null,
): number {
  if (!rule || !rule.enabled) return 0
  const anchor = pendingSince(rule)
  const total = transactions.reduce((sum, t) => {
    if (t.amount <= 0) return sum
    if (new Date(t.date).getTime() <= anchor) return sum
    return sum + roundUpFor(t.amount, rule.multiple)
  }, 0)
  return Math.round(total * 100) / 100
}
