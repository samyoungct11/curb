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
  emoji: string
  monthlyBudget: number
}

export interface Transaction {
  id: string
  merchant: string
  amount: number
  categoryId: string
  date: string // ISO
  isManual: boolean
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
  emoji: string
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

export interface Challenge {
  id: string
  title: string
  description: string
  active: boolean
  startedAt?: string
}
