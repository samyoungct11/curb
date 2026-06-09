import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Repeat, Sparkles } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Card } from '@/components/ui/Card'
import { Switch } from '@/components/ui/Switch'
import { cadenceLabel, detectSubscriptions } from '@/lib/subscriptions'
import { money } from '@/lib/utils'

/**
 * Real subscription audit: runs the recurring-charge detector over the user's
 * transactions, surfaces price hikes, and lets them sweep for found money by
 * toggling which recurring charges they'd cancel.
 */
export function SubscriptionAuditCard() {
  const { transactions, categories } = useAppStore()
  const audit = useMemo(
    () => detectSubscriptions(transactions, categories),
    [transactions, categories],
  )

  // Which subs the user has marked to cancel (local sweep, not persisted).
  const [cancel, setCancel] = useState<Record<string, boolean>>({})

  if (audit.subs.length === 0) return null

  const savings = audit.subs
    .filter((s) => cancel[s.key])
    .reduce((sum, s) => sum + s.monthly, 0)
  const cancelCount = audit.subs.filter((s) => cancel[s.key]).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-card-2 text-ink flex items-center justify-center shrink-0">
            <Repeat size={17} strokeWidth={1.75} />
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-semibold tracking-tight">
              Subscription audit
            </div>
            <div className="text-[12px] text-soft mt-0.5 num">
              {audit.subs.length} recurring · {money(audit.monthlyTotal)}/mo detected
            </div>
          </div>
        </div>

        {/* Found-money headline */}
        {audit.foundMoney > 0 && (
          <div className="mt-4 rounded-xl bg-brand/10 px-3.5 py-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-brand/15 text-brand flex items-center justify-center shrink-0">
              <Sparkles size={16} strokeWidth={1.75} />
            </div>
            <div className="leading-tight">
              <div className="num text-[16px] font-bold text-brand">
                {money(audit.foundMoney)}/mo
              </div>
              <div className="text-[12px] text-soft">
                up for grabs — that's {money(audit.foundMoney * 12)} a year
              </div>
            </div>
          </div>
        )}

        {/* Subscription list */}
        <ul className="space-y-2 mt-4">
          {audit.subs.map((s) => {
            const marked = !!cancel[s.key]
            return (
              <li
                key={s.key}
                className="flex items-center justify-between bg-card-2 rounded-xl px-3.5 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[13px] font-semibold truncate ${
                        marked ? 'line-through text-soft' : ''
                      }`}
                    >
                      {s.merchant}
                    </span>
                    {s.priceChange && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[var(--color-warning)] bg-[var(--color-warning-soft)] rounded-full px-1.5 py-0.5 shrink-0">
                        <ArrowUpRight size={10} strokeWidth={2.5} />
                        {s.priceChange.pct}%
                      </span>
                    )}
                  </div>
                  <div className="num text-[11px] text-soft mt-0.5">
                    {money(s.amount)}
                    {cadenceLabel(s.cadence)}
                    {s.priceChange && (
                      <span className="text-[var(--color-warning)]">
                        {' '}· was {money(s.priceChange.from)}
                      </span>
                    )}
                    {s.essential && <span> · essential</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-soft uppercase tracking-wide">
                    {marked ? 'Cancel' : 'Keep'}
                  </span>
                  <Switch
                    checked={marked}
                    onCheckedChange={(v) =>
                      setCancel((m) => ({ ...m, [s.key]: v }))
                    }
                  />
                </div>
              </li>
            )
          })}
        </ul>

        {/* Sweep footer */}
        {cancelCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center justify-between rounded-xl bg-brand px-3.5 py-3"
          >
            <span className="text-[13px] font-semibold text-white">
              Cancel {cancelCount} → save
            </span>
            <span className="num text-[15px] font-bold text-white">
              {money(savings)}/mo
            </span>
          </motion.div>
        )}
      </Card>
    </motion.div>
  )
}
