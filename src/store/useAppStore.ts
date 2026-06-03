import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AgeRange,
  Bill,
  Category,
  Challenge,
  Contribution,
  NotificationItem,
  PayProfile,
  PrimaryGoal,
  SavingsGoal,
  ThemeMode,
  ToneMode,
  Transaction,
  User,
} from '@/lib/types'
import {
  seedBills,
  seedCategories,
  seedChallenges,
  seedContributions,
  seedGoals,
  seedNotifications,
  seedPayProfile,
  seedTransactions,
  seedUser,
} from '@/lib/seed'
import {
  buildWelcomeNotification,
  generateCategories,
} from '@/lib/onboardingDefaults'
import { uid } from '@/lib/utils'

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

  // Safe-to-Spend (cash-flow profile)
  payProfile: PayProfile | null
  bills: Bill[]

  // Plaid / bank connection
  plaidUserId: string | null
  plaidConnected: boolean

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
  startChallenge: (tpl: Omit<Challenge, 'active' | 'startedAt' | 'completedAt'>) => void
  leaveChallenge: (id: string) => void
  completeChallenge: (id: string) => void

  // safe-to-spend
  setPayProfile: (p: PayProfile | null) => void
  upsertBill: (b: Bill) => void
  removeBill: (id: string) => void

  // theme + lifecycle
  setTheme: (t: ThemeMode) => void
  setHydrated: (v: boolean) => void

  // onboarding / demo
  completeOnboarding: (input: OnboardingInput) => void
  loadDemo: () => void
  resetAll: () => void

  // Plaid
  setPlaidUserId: (id: string) => void
  importPlaidTransactions: (raw: PlaidTransaction[]) => void
}

/** Shape returned by /api/sync-transactions */
export interface PlaidTransaction {
  id: string
  amount: number        // positive = money out (Plaid convention)
  date: string          // 'YYYY-MM-DD'
  merchant: string
  category: string      // already mapped to Curb category name
  raw_category: string
}

export interface OnboardingInput {
  name: string
  ageRange: AgeRange
  monthlyIncome: number
  isStudent: boolean
  primaryGoal: PrimaryGoal
  categories: string[]
  notificationTone: ToneMode
}

/** Truly empty state — no user, no data. App routes to /welcome from here. */
const emptyState = () => ({
  user: null as User | null,
  categories: [] as Category[],
  transactions: [] as Transaction[],
  notifications: [] as NotificationItem[],
  goals: [] as SavingsGoal[],
  contributions: [] as Contribution[],
  challenges: [] as Challenge[],
  payProfile: null as PayProfile | null,
  bills: [] as Bill[],
  plaidUserId: null as string | null,
  plaidConnected: false,
})

/** Maya's pre-populated demo data. */
const demoState = () => ({
  user: seedUser,
  categories: seedCategories,
  transactions: seedTransactions,
  notifications: seedNotifications,
  goals: seedGoals,
  contributions: seedContributions,
  challenges: seedChallenges as Challenge[],
  payProfile: seedPayProfile,
  bills: seedBills,
})

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...emptyState(),
      theme: 'system' as ThemeMode,
      hydrated: false,

      setUser: (u) => set({ user: u }),
      updateUser: (patch) =>
        set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),

      setCategoryBudget: (id, budget) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, monthlyBudget: budget } : c,
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
            t.id === id ? { ...t, ...patch } : t,
          ),
        })),
      removeTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

      addNotification: (n) =>
        set((s) => ({ notifications: [n, ...s.notifications] })),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
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
              id: uid(),
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
              : g,
          ),
        })),
      upsertGoal: (g) =>
        set((s) => {
          const exists = s.goals.some((x) => x.id === g.id)
          return {
            goals: exists
              ? s.goals.map((x) => (x.id === g.id ? g : x))
              : [...s.goals, g],
          }
        }),

      toggleChallenge: (id) =>
        set((s) => ({
          challenges: s.challenges.map((c) =>
            c.id === id
              ? {
                  ...c,
                  active: !c.active,
                  startedAt: !c.active
                    ? new Date().toISOString()
                    : c.startedAt,
                }
              : c,
          ),
        })),

      // Join a challenge from the library (or restart a finished one).
      startChallenge: (tpl) =>
        set((s) => {
          const now = new Date().toISOString()
          const exists = s.challenges.some((c) => c.id === tpl.id)
          if (exists) {
            return {
              challenges: s.challenges.map((c) =>
                c.id === tpl.id
                  ? { ...c, ...tpl, active: true, startedAt: now, completedAt: undefined }
                  : c,
              ),
            }
          }
          return {
            challenges: [...s.challenges, { ...tpl, active: true, startedAt: now }],
          }
        }),
      leaveChallenge: (id) =>
        set((s) => ({
          challenges: s.challenges.map((c) =>
            c.id === id ? { ...c, active: false } : c,
          ),
        })),
      completeChallenge: (id) =>
        set((s) => ({
          challenges: s.challenges.map((c) =>
            c.id === id && !c.completedAt
              ? { ...c, active: false, completedAt: new Date().toISOString() }
              : c,
          ),
        })),

      setPayProfile: (p) => set({ payProfile: p }),
      upsertBill: (b) =>
        set((s) => {
          const exists = s.bills.some((x) => x.id === b.id)
          return {
            bills: exists
              ? s.bills.map((x) => (x.id === b.id ? b : x))
              : [...s.bills, b],
          }
        }),
      removeBill: (id) =>
        set((s) => ({ bills: s.bills.filter((b) => b.id !== id) })),

      setTheme: (t) => set({ theme: t }),
      setHydrated: (v) => set({ hydrated: v }),

      completeOnboarding: (input) => {
        const categories = generateCategories(input.categories, input.monthlyIncome)
        const totalBudget = categories.reduce((s, c) => s + c.monthlyBudget, 0)
        const user: User = {
          id: uid(),
          name: input.name || 'You',
          ageRange: input.ageRange,
          monthlyIncome: input.monthlyIncome,
          isStudent: input.isStudent,
          primaryGoal: input.primaryGoal,
          notificationTone: input.notificationTone,
          createdAt: new Date().toISOString(),
        }
        set({
          ...emptyState(),
          user,
          categories,
          notifications: [buildWelcomeNotification(totalBudget)],
          challenges: [
            {
              id: 'ch-starter',
              title: 'Log your first 3 spends',
              description: 'Get a feel for how the coach reacts.',
              active: false,
            },
          ],
        })
      },

      loadDemo: () =>
        set({
          ...demoState(),
          hydrated: true,
        }),

      resetAll: () =>
        set({
          ...emptyState(),
          hydrated: true,
        }),

      setPlaidUserId: (id) => set({ plaidUserId: id, plaidConnected: true }),

      importPlaidTransactions: (raw) =>
        set((s) => {
          // Build a lookup of our categories by name
          const catByName = Object.fromEntries(s.categories.map((c) => [c.name, c]))

          const incoming: Transaction[] = raw.map((r) => {
            // Match Plaid category → one of user's actual categories; fall back to first
            const cat = catByName[r.category] ?? s.categories[0]
            return {
              id: r.id,
              amount: r.amount,
              merchant: r.merchant,
              categoryId: cat?.id ?? '',
              date: new Date(r.date).toISOString(),
              note: '',
              source: 'plaid' as const,
            }
          })

          // Merge: keep manual transactions, replace/add plaid ones
          const existingIds = new Set(incoming.map((t) => t.id))
          const manual = s.transactions.filter(
            (t) => (t as { source?: string }).source !== 'plaid' || !existingIds.has(t.id),
          )

          const merged = [...incoming, ...manual].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )

          // Category spend is always derived from transactions (see selectors),
          // so we only need to persist the merged transaction list here.
          return { transactions: merged }
        }),
    }),
    {
      // bumped key — clears any old Maya-seeded state from v1
      name: 'pocket-store-v2',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    },
  ),
)
