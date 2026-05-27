import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Category,
  Challenge,
  Contribution,
  NotificationItem,
  SavingsGoal,
  ThemeMode,
  Transaction,
  User,
} from '@/lib/types'
import {
  seedCategories,
  seedChallenges,
  seedContributions,
  seedGoals,
  seedNotifications,
  seedTransactions,
  seedUser,
} from '@/lib/seed'

export interface AppState {
  user: User | null
  categories: Category[]
  transactions: Transaction[]
  notifications: NotificationItem[]
  goals: SavingsGoal[]
  contributions: Contribution[]
  challenges: Challenge[]
  theme: ThemeMode
  hydrated: boolean

  // user
  setUser: (u: User) => void
  updateUser: (patch: Partial<User>) => void

  // categories
  setCategoryBudget: (id: string, budget: number) => void
  upsertCategory: (c: Category) => void

  // transactions
  addTransaction: (t: Transaction) => void
  updateTransaction: (id: string, patch: Partial<Transaction>) => void
  removeTransaction: (id: string) => void

  // notifications
  addNotification: (n: NotificationItem) => void
  markNotificationRead: (id: string) => void
  markAllRead: () => void

  // goals
  addContribution: (goalId: string, amount: number, note?: string) => void
  upsertGoal: (g: SavingsGoal) => void

  // challenges
  toggleChallenge: (id: string) => void

  // theme + demo
  setTheme: (t: ThemeMode) => void
  resetDemo: () => void
  setHydrated: (v: boolean) => void
}

const initialDemo = () => ({
  user: seedUser,
  categories: seedCategories,
  transactions: seedTransactions,
  notifications: seedNotifications,
  goals: seedGoals,
  contributions: seedContributions,
  challenges: seedChallenges as Challenge[],
})

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialDemo(),
      theme: 'system' as ThemeMode,
      hydrated: false,

      setUser: (u) => set({ user: u }),
      updateUser: (patch) =>
        set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),

      setCategoryBudget: (id, budget) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, monthlyBudget: budget } : c
          ),
        })),
      upsertCategory: (c) =>
        set((s) => {
          const exists = s.categories.some((x) => x.id === c.id)
          return {
            categories: exists
              ? s.categories.map((x) => (x.id === c.id ? c : x))
              : [...s.categories, c],
          }
        }),

      addTransaction: (t) =>
        set((s) => ({ transactions: [t, ...s.transactions] })),
      updateTransaction: (id, patch) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, ...patch } : t
          ),
        })),
      removeTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

      addNotification: (n) =>
        set((s) => ({ notifications: [n, ...s.notifications] })),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      addContribution: (goalId, amount, note) =>
        set((s) => ({
          contributions: [
            {
              id: crypto.randomUUID(),
              goalId,
              amount,
              date: new Date().toISOString(),
              note,
            },
            ...s.contributions,
          ],
          goals: s.goals.map((g) =>
            g.id === goalId
              ? { ...g, currentAmount: g.currentAmount + amount }
              : g
          ),
        })),
      upsertGoal: (g) =>
        set((s) => {
          const exists = s.goals.some((x) => x.id === g.id)
          return {
            goals: exists ? s.goals.map((x) => (x.id === g.id ? g : x)) : [...s.goals, g],
          }
        }),

      toggleChallenge: (id) =>
        set((s) => ({
          challenges: s.challenges.map((c) =>
            c.id === id
              ? { ...c, active: !c.active, startedAt: !c.active ? new Date().toISOString() : c.startedAt }
              : c
          ),
        })),

      setTheme: (t) => set({ theme: t }),
      setHydrated: (v) => set({ hydrated: v }),
      resetDemo: () =>
        set({ ...initialDemo(), theme: 'system' as ThemeMode, hydrated: true }),
    }),
    {
      name: 'pocket-store-v1',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
