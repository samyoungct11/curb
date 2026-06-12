export type AgeRange = '12-14' | '15-17' | '18-22' | '23-25'

export type PrimaryGoal =
  | 'spend_less'
  | 'save_for_goal'
  | 'stop_impulse'
  | 'track_food'
  | 'stay_under'
  | 'build_habits'

export type ToneMode = 'strict' | 'balanced' | 'chill'
export type ThemeMode = 'light' | 'dark' | 'system'

export interface User {
  id: string
  name: string
  ageRange: AgeRange
  monthlyIncome: number
  isStudent: boolean
  primaryGoal: PrimaryGoal
  notificationTone: ToneMode
  createdAt: string
}

export interface Category {
  id: string
  name: string
  icon: string // lucide icon name
  emoji?: string // deprecated — kept optional for legacy stored data
  monthlyBudget: number
}

export interface Transaction {
  id: string
  merchant: string
  amount: number
  categoryId: string
  date: string // ISO
  note?: string
  isManual?: boolean
  source?: 'manual' | 'plaid'  // 'plaid' = synced from bank
}

export type NotificationType =
  | 'safe'
  | 'approaching'
  | 'at_limit'
  | 'over'
  | 'pattern'
  | 'trend'
  | 'positive'
  | 'no_spend'
  | 'impulse'
  | 'weekly_summary'
  | 'monthly_reset'
  | 'savings_milestone'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  body: string
  transactionId?: string
  categoryId?: string
  read: boolean
  createdAt: string
}

export interface SavingsGoal {
  id: string
  name: string
  icon: string // lucide icon name
  emoji?: string // deprecated
  targetAmount: number
  currentAmount: number
  targetDate?: string
}

export interface Contribution {
  id: string
  goalId: string
  amount: number
  date: string
  note?: string
}

/** What a challenge measures. All count up toward `target`. */
export type ChallengeMetric = 'no_spend_days' | 'streak' | 'log_count'

export interface Challenge {
  id: string
  title: string
  description: string
  active: boolean
  startedAt?: string
  completedAt?: string
  icon?: string // lucide icon name
  metric?: ChallengeMetric
  target?: number // e.g. 5 no-spend days, 7-day streak, log 10 spends
}

/**
 * Round-up auto-save rule. Spare change from each purchase (rounded up to the
 * next `multiple` dollars) accrues into a vault the user can sweep into a goal.
 */
export interface RoundUpRule {
  enabled: boolean
  /** Round each spend up to the next multiple of this many dollars (1 or 5). */
  multiple: number
  /** Goal that swept round-ups flow into. */
  goalId: string | null
  /** ISO timestamp the rule was enabled — round-ups only count from here. */
  since: string
  /** ISO timestamp of the last sweep; round-ups after this are still pending. */
  sweptThrough?: string
}

/**
 * Campus meal plan — a prepaid, use-it-or-lose-it balance with a hard expiry.
 * v1 is manual: the student enters the plan once and refreshes the balance
 * in seconds whenever they want updated burn-rate math. Portal sync later.
 */
export interface MealPlan {
  school: string
  planName?: string
  /** Dining dollars balance when tracking began. */
  diningDollarsStart: number
  /**
   * When `diningDollarsStart` was recorded. Burn rate measures from here,
   * not term start — students often add a plan mid-term.
   */
  baselineDate: string // ISO date
  /** Current dining dollars balance (student-updated). */
  diningDollars: number
  /** Meal swipes left this term, if the plan has them. */
  swipesRemaining?: number | null
  /** Door price of one swipe in dollars; defaults applied in lib/mealPlan. */
  swipeValue?: number | null
  termStart: string // ISO date
  termEnd: string // ISO date
  /** Last time the student updated the balance. */
  updatedAt: string
}

/** How often the user gets paid — drives the Safe-to-Spend pay period. */
export type PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'

/** A recurring bill the user owes on a fixed day of the month. */
export interface Bill {
  id: string
  name: string
  amount: number
  dueDay: number // day of month, 1–31
}

/**
 * Lightweight cash-flow profile powering Safe-to-Spend.
 * The minimum we need beyond `User.monthlyIncome` to know what's truly
 * spendable between now and the next payday.
 */
export interface PayProfile {
  frequency: PayFrequency
  /** ISO date of a known/most-recent payday — the cycle anchor. */
  anchorDate: string
  /** Monthly amount to set aside before money counts as spendable. */
  monthlySavingsTarget?: number
}
