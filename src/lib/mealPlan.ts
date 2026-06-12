import { differenceInCalendarDays, format } from 'date-fns'
import type { MealPlan, NotificationItem } from '@/lib/types'
import { uid } from '@/lib/utils'

/**
 * Meal plan math — the burn-rate engine behind the Campus Card screen.
 *
 * A meal plan is a prepaid, use-it-or-lose-it balance with a hard expiry
 * (term end). Everything here derives from four numbers the student enters
 * once: starting balance, current balance, term start, term end.
 */

export type MealPlanPace = 'ahead' | 'on_track' | 'behind'

export interface MealPlanStatus {
  /** Days since tracking began (≥ 0) — the burn-rate window. */
  daysTracked: number
  /** Days from today until term end (≥ 0). */
  daysRemaining: number
  /** 0–1 share of the term that has passed. */
  termElapsedPct: number
  /** 0–1 share of the tracked starting balance already spent. */
  spentPct: number
  /** Dollars spent per tracked day. */
  burnPerDay: number
  /** Dollars per remaining day that exactly lands on $0 at term end. */
  dailyAllowance: number
  /** Projected date the balance hits $0 at the current burn rate; null = lasts past term end. */
  runOutDate: Date | null
  /** Days short of term end the money runs out. */
  runOutGapDays: number | null
  pace: MealPlanPace
  /** Dollars projected unspent at term end (stranded) — 0 when pace is behind. */
  projectedLeftover: number
  /** True until there's enough observed spending to trust the pace math. */
  needsBaseline: boolean
}

export function mealPlanStatus(plan: MealPlan, now: Date = new Date()): MealPlanStatus {
  const start = new Date(plan.termStart)
  const end = new Date(plan.termEnd)
  // Older persisted plans may predate baselineDate — fall back to term start.
  const baseline = new Date(plan.baselineDate ?? plan.termStart)
  const daysTracked = Math.max(0, differenceInCalendarDays(now, baseline))
  const daysRemaining = Math.max(0, differenceInCalendarDays(end, now))
  const termDays = Math.max(1, differenceInCalendarDays(end, start))
  const termElapsed = Math.max(0, differenceInCalendarDays(now, start))

  const spent = Math.max(0, plan.diningDollarsStart - plan.diningDollars)
  const burnPerDay = daysTracked > 0 ? spent / daysTracked : 0
  const dailyAllowance = daysRemaining > 0 ? plan.diningDollars / daysRemaining : plan.diningDollars

  // Burn math needs a real observation window: a few tracked days AND some
  // spending recorded. Until then the screen shows a "check back" state.
  const needsBaseline = daysTracked < 5 || spent <= 0

  let runOutDate: Date | null = null
  let runOutGapDays: number | null = null
  if (burnPerDay > 0) {
    const daysOfRunway = plan.diningDollars / burnPerDay
    const projected = new Date(now.getTime() + daysOfRunway * 86_400_000)
    if (projected < end) {
      runOutDate = projected
      runOutGapDays = differenceInCalendarDays(end, projected)
    }
  }

  const projectedSpendToEnd = burnPerDay * daysRemaining
  const projectedLeftover = Math.max(0, plan.diningDollars - projectedSpendToEnd)

  // Pace derives from the projection (works for mid-term baselines too):
  // behind = runs out early; ahead = meaningful money stranded at term end.
  const pace: MealPlanPace = needsBaseline
    ? 'on_track'
    : runOutDate && (runOutGapDays ?? 0) >= 3
      ? 'behind'
      : projectedLeftover > Math.max(40, plan.diningDollarsStart * 0.1)
        ? 'ahead'
        : 'on_track'

  return {
    daysTracked,
    daysRemaining,
    termElapsedPct: Math.min(1, termElapsed / termDays),
    spentPct: plan.diningDollarsStart > 0 ? spent / plan.diningDollarsStart : 0,
    burnPerDay,
    dailyAllowance,
    runOutDate,
    runOutGapDays,
    pace,
    projectedLeftover,
    needsBaseline,
  }
}

export interface SwipeMath {
  remaining: number
  /** Dollar value of one swipe (user-set door price or sensible default). */
  value: number
  /** Total dollar value sitting in unused swipes. */
  strandedValue: number
}

/** Average campus door price for a dining-hall meal — used when the student skips the field. */
export const DEFAULT_SWIPE_VALUE = 9.4

export function swipeMath(plan: MealPlan): SwipeMath | null {
  if (plan.swipesRemaining == null || plan.swipesRemaining <= 0) return null
  const value = plan.swipeValue && plan.swipeValue > 0 ? plan.swipeValue : DEFAULT_SWIPE_VALUE
  return {
    remaining: plan.swipesRemaining,
    value,
    strandedValue: plan.swipesRemaining * value,
  }
}

/**
 * Pace alert for the inbox — called after a balance update. Returns null when
 * there is nothing actionable (on track, term over, or not enough data yet).
 */
export function evaluateMealPlan(plan: MealPlan, now: Date = new Date()): NotificationItem | null {
  const s = mealPlanStatus(plan, now)
  if (s.needsBaseline || s.daysTracked < 7 || s.daysRemaining <= 0) return null

  if (s.pace === 'behind' && s.runOutDate) {
    return {
      id: uid(),
      type: 'trend',
      title: 'Dining dollars running hot',
      body: `At your pace they run out ${format(s.runOutDate, 'MMM d')} — ${s.runOutGapDays} days before term ends. Keep it under $${s.dailyAllowance.toFixed(2)}/day to coast to the finish.`,
      read: false,
      createdAt: now.toISOString(),
    }
  }

  // Money likely to be stranded: worth surfacing when it's real money (> $40).
  if (s.pace === 'ahead' && s.projectedLeftover > 40) {
    return {
      id: uid(),
      type: 'positive',
      title: `~$${Math.round(s.projectedLeftover)} of your meal plan may go unused`,
      body: `Dining dollars usually expire at term end. You can spend $${s.dailyAllowance.toFixed(2)}/day on campus — use it before you lose it.`,
      read: false,
      createdAt: now.toISOString(),
    }
  }

  return null
}
