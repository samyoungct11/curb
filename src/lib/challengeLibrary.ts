import type { Challenge } from '@/lib/types'

/** A joinable challenge template. Becomes a live Challenge once started. */
export type ChallengeTemplate = Pick<
  Challenge,
  'id' | 'title' | 'description' | 'icon' | 'metric' | 'target'
>

/**
 * Curated challenges users can join. Kept short and achievable — the point is
 * momentum, not a chore list. IDs are stable so progress survives re-renders.
 */
export const CHALLENGE_LIBRARY: ChallengeTemplate[] = [
  {
    id: 'ch-no-spend-3',
    title: '3 no-spend days',
    description: 'Stack three days this week without spending a cent.',
    icon: 'Flame',
    metric: 'no_spend_days',
    target: 3,
  },
  {
    id: 'ch-streak-7',
    title: '7-day streak',
    description: 'Build a week-long no-spend streak — one slip resets it.',
    icon: 'Zap',
    metric: 'streak',
    target: 7,
  },
  {
    id: 'ch-no-spend-10',
    title: '10 no-spend days',
    description: 'Go for ten no-spend days this month.',
    icon: 'Flame',
    metric: 'no_spend_days',
    target: 10,
  },
  {
    id: 'ch-log-10',
    title: 'Log 10 spends',
    description: 'Track ten purchases so the coach can spot patterns.',
    icon: 'Receipt',
    metric: 'log_count',
    target: 10,
  },
]
