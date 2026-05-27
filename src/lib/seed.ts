import type {
  Category,
  Contribution,
  NotificationItem,
  SavingsGoal,
  Transaction,
  User,
} from '@/lib/types'

/** Stable IDs so demo data is deterministic. */
const CAT = {
  restaurants: 'cat-restaurants',
  coffee: 'cat-coffee',
  shopping: 'cat-shopping',
  fun: 'cat-fun',
  subs: 'cat-subs',
  transport: 'cat-transport',
}

export const seedUser: User = {
  id: 'demo-maya',
  name: 'Maya',
  ageRange: '18-22',
  monthlyIncome: 600,
  isStudent: true,
  primaryGoal: 'track_food',
  notificationTone: 'balanced',
  createdAt: '2026-05-01T00:00:00.000Z',
}

export const seedCategories: Category[] = [
  { id: CAT.restaurants, name: 'Restaurants', icon: 'UtensilsCrossed', emoji: '🍔', monthlyBudget: 150 },
  { id: CAT.coffee, name: 'Coffee', icon: 'Coffee', emoji: '☕', monthlyBudget: 40 },
  { id: CAT.shopping, name: 'Shopping', icon: 'ShoppingBag', emoji: '🛍️', monthlyBudget: 80 },
  { id: CAT.fun, name: 'Fun', icon: 'Ticket', emoji: '🎬', monthlyBudget: 50 },
  { id: CAT.subs, name: 'Subscriptions', icon: 'Repeat', emoji: '📺', monthlyBudget: 25 },
  { id: CAT.transport, name: 'Transport', icon: 'Car', emoji: '🚗', monthlyBudget: 40 },
]

export const seedTransactions: Transaction[] = [
  { id: 't-01', merchant: 'Chipotle',      amount: 12.40, categoryId: CAT.restaurants, date: '2026-05-01T12:14:00Z', isManual: false },
  { id: 't-02', merchant: 'Blue Bottle',   amount: 6.50,  categoryId: CAT.coffee,      date: '2026-05-02T08:32:00Z', isManual: false },
  { id: 't-03', merchant: 'Spotify',       amount: 11.00, categoryId: CAT.subs,        date: '2026-05-03T00:01:00Z', isManual: false },
  { id: 't-04', merchant: 'Uber',          amount: 8.20,  categoryId: CAT.transport,   date: '2026-05-03T18:45:00Z', isManual: false },
  { id: 't-05', merchant: 'Sweetgreen',    amount: 14.75, categoryId: CAT.restaurants, date: '2026-05-04T19:12:00Z', isManual: false },
  { id: 't-06', merchant: 'Target',        amount: 42.18, categoryId: CAT.shopping,    date: '2026-05-05T15:03:00Z', isManual: false },
  { id: 't-07', merchant: 'Blue Bottle',   amount: 6.50,  categoryId: CAT.coffee,      date: '2026-05-06T08:47:00Z', isManual: false },
  { id: 't-08', merchant: 'Netflix',       amount: 7.00,  categoryId: CAT.subs,        date: '2026-05-07T00:01:00Z', isManual: false },
  { id: 't-09', merchant: 'DoorDash',      amount: 22.30, categoryId: CAT.restaurants, date: '2026-05-08T20:15:00Z', isManual: false },
  { id: 't-10', merchant: 'Blue Bottle',   amount: 7.25,  categoryId: CAT.coffee,      date: '2026-05-09T08:51:00Z', isManual: false },
  { id: 't-11', merchant: 'AMC Theater',   amount: 16.50, categoryId: CAT.fun,         date: '2026-05-10T21:02:00Z', isManual: false },
  { id: 't-12', merchant: 'DoorDash',      amount: 19.80, categoryId: CAT.restaurants, date: '2026-05-11T19:38:00Z', isManual: false },
  { id: 't-13', merchant: 'Blue Bottle',   amount: 6.50,  categoryId: CAT.coffee,      date: '2026-05-12T08:42:00Z', isManual: false },
  { id: 't-14', merchant: 'Amazon',        amount: 38.99, categoryId: CAT.shopping,    date: '2026-05-13T13:24:00Z', isManual: false },
  { id: 't-15', merchant: 'Sweetgreen',    amount: 13.20, categoryId: CAT.restaurants, date: '2026-05-14T12:51:00Z', isManual: false },
  { id: 't-16', merchant: 'Blue Bottle',   amount: 7.25,  categoryId: CAT.coffee,      date: '2026-05-17T09:14:00Z', isManual: false },
  { id: 't-17', merchant: 'Sweetgreen',    amount: 11.40, categoryId: CAT.restaurants, date: '2026-05-19T12:33:00Z', isManual: false },
  { id: 't-18', merchant: 'Uber',          amount: 5.80,  categoryId: CAT.transport,   date: '2026-05-21T18:02:00Z', isManual: false },
  { id: 't-19', merchant: 'Amazon',        amount: 12.99, categoryId: CAT.shopping,    date: '2026-05-22T20:41:00Z', isManual: false },
  { id: 't-20', merchant: 'Chipotle',      amount: 14.20, categoryId: CAT.restaurants, date: '2026-05-24T19:15:00Z', isManual: false },
]

export const seedGoals: SavingsGoal[] = [
  {
    id: 'goal-spring-break',
    name: 'Spring Break Trip',
    emoji: '🌴',
    targetAmount: 400,
    currentAmount: 180,
    targetDate: '2027-03-15',
  },
]

export const seedContributions: Contribution[] = [
  { id: 'c-1', goalId: 'goal-spring-break', amount: 60, date: '2026-03-30', note: 'March under-budget' },
  { id: 'c-2', goalId: 'goal-spring-break', amount: 75, date: '2026-04-28', note: 'April under-budget' },
  { id: 'c-3', goalId: 'goal-spring-break', amount: 45, date: '2026-05-12', note: 'Week under budget' },
]

export const seedNotifications: NotificationItem[] = [
  {
    id: 'n-1',
    type: 'pattern',
    title: 'Coffee check-in',
    body: "That's coffee #3 this week — $20 total. You've got $20 left for the month ☕",
    transactionId: 't-07',
    categoryId: CAT.coffee,
    read: false,
    createdAt: '2026-05-06T08:48:00Z',
  },
  {
    id: 'n-2',
    type: 'approaching',
    title: 'Heads up',
    body: "You're at 55% of restaurants and it's only the 8th. Just so you know.",
    transactionId: 't-09',
    categoryId: CAT.restaurants,
    read: false,
    createdAt: '2026-05-08T20:16:00Z',
  },
  {
    id: 'n-3',
    type: 'at_limit',
    title: 'Coffee budget hit',
    body: "You've used your coffee budget for May. Anything more eats into another category.",
    transactionId: 't-13',
    categoryId: CAT.coffee,
    read: true,
    createdAt: '2026-05-12T08:43:00Z',
  },
  {
    id: 'n-4',
    type: 'safe',
    title: 'Still on track',
    body: 'That $38.99 at Amazon puts shopping at 82% — 2 weeks to go. You\'re fine.',
    transactionId: 't-14',
    categoryId: CAT.shopping,
    read: true,
    createdAt: '2026-05-13T13:25:00Z',
  },
]

export const seedChallenges = [
  {
    id: 'ch-no-delivery',
    title: 'No delivery this week',
    description: 'Skip DoorDash / UberEats for 7 days. You usually save ~$40.',
    active: false,
  },
]
