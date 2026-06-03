import { useEffect } from 'react'
import { Check } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/Icon'
import { challengeProgress } from '@/lib/streaks'
import { CHALLENGE_LIBRARY } from '@/lib/challengeLibrary'
import type { Challenge } from '@/lib/types'
import { cn } from '@/lib/utils'

export function ChallengesSection() {
  const { challenges, transactions, startChallenge, leaveChallenge, completeChallenge } =
    useAppStore()
  const now = new Date()

  // Auto-complete any active challenge that has hit its target.
  useEffect(() => {
    for (const c of challenges) {
      if (c.active && !c.completedAt && c.metric) {
        if (challengeProgress(c, transactions, now).done) completeChallenge(c.id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenges, transactions])

  const active = challenges.filter((c) => c.active && !c.completedAt && c.metric)
  const completed = challenges.filter((c) => c.completedAt)
  // Join list: templates that are neither active nor already completed
  // (covers never-started and previously-left challenges).
  const available = CHALLENGE_LIBRARY.filter((t) => {
    const existing = challenges.find((c) => c.id === t.id)
    return !existing || (!existing.active && !existing.completedAt)
  })

  return (
    <section className="space-y-3">
      <h2 className="text-[13px] font-semibold tracking-tight uppercase text-soft mt-2">
        Challenges
      </h2>

      {active.length > 0 && (
        <div className="space-y-3">
          {active.map((c) => (
            <ActiveChallengeRow
              key={c.id}
              challenge={c}
              onLeave={() => leaveChallenge(c.id)}
            />
          ))}
        </div>
      )}

      {available.length > 0 && (
        <Card className="py-1">
          <ul className="divide-y divide-line">
            {available.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <div className="h-9 w-9 rounded-xl bg-card-2 text-ink flex items-center justify-center shrink-0">
                  <Icon name={t.icon ?? 'Trophy'} size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold tracking-tight">{t.title}</div>
                  <div className="text-[12px] text-soft leading-tight">{t.description}</div>
                </div>
                <button
                  type="button"
                  onClick={() => startChallenge(t)}
                  className="shrink-0 h-8 px-3.5 rounded-full bg-brand text-white text-[12px] font-semibold tap"
                >
                  Start
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {completed.length > 0 && (
        <div className="space-y-2 pt-1">
          {completed.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 px-1 text-soft"
            >
              <div className="h-6 w-6 rounded-full bg-brand/15 text-brand flex items-center justify-center shrink-0">
                <Check size={13} strokeWidth={2.5} />
              </div>
              <span className="text-[13px]">
                <span className="font-semibold text-ink">{c.title}</span> — done
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function ActiveChallengeRow({
  challenge,
  onLeave,
}: {
  challenge: Challenge
  onLeave: () => void
}) {
  const { transactions } = useAppStore()
  const status = challengeProgress(challenge, transactions, new Date())

  return (
    <Card className="py-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
          <Icon name={challenge.icon ?? 'Trophy'} size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[14px] font-semibold tracking-tight">{challenge.title}</div>
            <button
              type="button"
              onClick={onLeave}
              className="text-[11px] text-soft font-semibold tap shrink-0"
            >
              Leave
            </button>
          </div>
          <div className="num text-[12px] text-soft mt-0.5">
            {status.current} / {status.target} {status.unit}
          </div>
        </div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-card-2 overflow-hidden">
        <div
          className={cn('h-full rounded-full bg-brand transition-all')}
          style={{ width: `${Math.round(status.pct * 100)}%` }}
        />
      </div>
    </Card>
  )
}
