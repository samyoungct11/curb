import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCheck } from 'lucide-react'
import { format } from 'date-fns'
import { useAppStore } from '@/store/useAppStore'
import { Card } from '@/components/ui/Card'
import type { NotificationItem, NotificationType } from '@/lib/types'
import { cn } from '@/lib/utils'

const TYPE_EMOJI: Record<NotificationType, string> = {
  safe: '✅',
  approaching: '👀',
  at_limit: '⚠️',
  over: '🛑',
  pattern: '🔁',
  trend: '📈',
  positive: '🎉',
  no_spend: '🔥',
  impulse: '💡',
  weekly_summary: '📊',
  monthly_reset: '🗓️',
  savings_milestone: '🌴',
}

const TYPE_TINT: Record<NotificationType, string> = {
  safe: 'bg-brand-soft text-[var(--color-brand-strong)]',
  approaching: 'bg-warning-soft text-[#8a6a17]',
  at_limit: 'bg-warning-soft text-[#8a6a17]',
  over: 'bg-alert-soft text-[#9b3338]',
  pattern: 'bg-warning-soft text-[#8a6a17]',
  trend: 'bg-warning-soft text-[#8a6a17]',
  positive: 'bg-brand-soft text-[var(--color-brand-strong)]',
  no_spend: 'bg-brand-soft text-[var(--color-brand-strong)]',
  impulse: 'bg-warning-soft text-[#8a6a17]',
  weekly_summary: 'bg-brand-soft text-[var(--color-brand-strong)]',
  monthly_reset: 'bg-brand-soft text-[var(--color-brand-strong)]',
  savings_milestone: 'bg-brand-soft text-[var(--color-brand-strong)]',
}

export function Inbox() {
  const navigate = useNavigate()
  const { notifications, markAllRead, markNotificationRead } = useAppStore()

  const grouped = groupByDay(notifications)

  return (
    <div className="pb-8">
      <header className="px-5 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-full bg-card border border-line flex items-center justify-center tap"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-[18px] font-semibold tracking-tight">Updates</h1>
        </div>
        {notifications.some((n) => !n.read) && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-xs text-brand font-medium inline-flex items-center gap-1 tap"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </header>

      <div className="px-5 mt-5 space-y-4">
        {grouped.length === 0 && (
          <Card className="text-center py-10">
            <div className="text-3xl mb-2">🔕</div>
            <div className="text-[15px] font-semibold">All caught up</div>
            <div className="text-sm text-soft mt-1">
              You'll see spending updates here.
            </div>
          </Card>
        )}

        {grouped.map((g) => (
          <section key={g.label}>
            <div className="text-[11px] text-soft uppercase tracking-wide font-semibold px-1 mb-1.5">
              {g.label}
            </div>
            <div className="space-y-2">
              {g.items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markNotificationRead(n.id)}
                  className={cn(
                    'w-full text-left bg-card border border-line rounded-2xl p-4 tap flex gap-3 items-start',
                    !n.read && 'border-l-4',
                  )}
                  style={!n.read ? { borderLeftColor: 'var(--color-brand)' } : undefined}
                >
                  <div
                    className={cn(
                      'h-10 w-10 rounded-xl flex items-center justify-center text-base shrink-0',
                      TYPE_TINT[n.type],
                    )}
                  >
                    {TYPE_EMOJI[n.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[14px] font-semibold truncate">
                        {n.title}
                      </div>
                      <div className="text-[11px] text-soft shrink-0">
                        {format(new Date(n.createdAt), 'h:mm a')}
                      </div>
                    </div>
                    <div className="text-sm text-soft mt-0.5 leading-relaxed">
                      {n.body}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function groupByDay(notifications: NotificationItem[]) {
  const sorted = [...notifications].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  )
  const groups: { label: string; items: NotificationItem[] }[] = []
  for (const n of sorted) {
    const label = format(new Date(n.createdAt), 'EEE, MMM d')
    const existing = groups.find((g) => g.label === label)
    if (existing) existing.items.push(n)
    else groups.push({ label, items: [n] })
  }
  return groups
}
