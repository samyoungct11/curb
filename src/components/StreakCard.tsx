import { Flame } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Card } from '@/components/ui/Card'
import { bestNoSpendStreak, currentNoSpendStreak } from '@/lib/streaks'

export function StreakCard() {
  const { transactions } = useAppStore()
  const now = new Date()
  const current = currentNoSpendStreak(transactions, now)
  const best = bestNoSpendStreak(transactions, now)

  const hot = current > 0
  const label =
    current === 0
      ? 'No streak yet'
      : current === 1
        ? '1 no-spend day'
        : `${current} no-spend days`
  const sub =
    current === 0
      ? 'A day without spending starts your streak.'
      : best > current
        ? `Best run: ${best} days. Keep it going.`
        : 'This is your best run yet — nice.'

  return (
    <Card className="flex items-center gap-4 py-5">
      <div
        className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
        style={{
          background: hot
            ? 'color-mix(in srgb, var(--color-brand) 14%, transparent)'
            : 'var(--surface-2)',
          color: hot ? 'var(--color-brand)' : 'var(--soft)',
        }}
      >
        <Flame size={22} strokeWidth={1.75} />
      </div>
      <div className="flex-1">
        <div className="text-[11px] text-soft uppercase tracking-[0.16em] font-semibold">
          Current streak
        </div>
        <div className="num display text-[24px] font-bold leading-none mt-1">
          {label}
        </div>
        <div className="text-[12px] text-soft mt-1 leading-relaxed">{sub}</div>
      </div>
    </Card>
  )
}
