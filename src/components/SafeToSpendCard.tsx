import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  ChevronDown,
  Gauge,
  PiggyBank,
  Receipt,
  SlidersHorizontal,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PayBillsSheet } from '@/components/PayBillsSheet'
import { computeSafeToSpend, computeVelocity } from '@/lib/safeToSpend'
import { money } from '@/lib/utils'

export function SafeToSpendCard() {
  const { user, payProfile, bills, categories, transactions } = useAppStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // No profile yet → invite the user to set it up.
  if (!payProfile) {
    return (
      <>
        <Card className="text-center py-7">
          <div className="h-11 w-11 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto">
            <Wallet size={20} strokeWidth={1.75} />
          </div>
          <div className="text-[15px] font-semibold tracking-tight mt-3">
            Know what's safe to spend
          </div>
          <p className="text-[13px] text-soft mt-1 leading-relaxed px-2">
            Add your payday and any bills, and Curb shows a live daily number you
            can spend guilt-free until your next paycheck.
          </p>
          <Button size="lg" className="mt-4" onClick={() => setSheetOpen(true)}>
            Set up Safe-to-Spend
          </Button>
        </Card>
        <PayBillsSheet open={sheetOpen} onOpenChange={setSheetOpen} />
      </>
    )
  }

  const sts = computeSafeToSpend(
    { user, profile: payProfile, bills, categories, transactions },
    new Date(),
  )
  const velocity = computeVelocity(categories, transactions, new Date())

  const ringText =
    sts.negative ? 'text-[var(--color-alert)]' : 'text-ink'

  return (
    <>
      <Card className="py-6 px-5">
        <div className="flex items-start justify-between">
          <div className="text-[11px] text-soft uppercase tracking-[0.16em] font-semibold">
            Safe to spend today
          </div>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="h-7 w-7 -mt-1 -mr-1 rounded-lg text-soft flex items-center justify-center tap"
            aria-label="Edit payday & bills"
          >
            <SlidersHorizontal size={15} strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-2 flex items-end gap-2">
          <span className={`display num text-[44px] font-bold leading-none ${ringText}`}>
            {money(sts.perDay)}
          </span>
          <span className="text-[13px] text-soft mb-1">/ day</span>
        </div>

        {sts.negative ? (
          <p className="text-[13px] text-[var(--color-alert)] mt-2 leading-relaxed">
            You're {money(Math.abs(sts.periodRemaining))} over for this stretch.
            Bills and savings eat the rest until {format(sts.period.end, 'MMM d')}.
          </p>
        ) : (
          <p className="text-[13px] text-soft mt-2 leading-relaxed">
            {money(sts.periodRemaining)} left to spend over {sts.period.daysRemaining}{' '}
            {sts.period.daysRemaining === 1 ? 'day' : 'days'} — next paycheck{' '}
            {format(sts.period.end, 'MMM d')}.
          </p>
        )}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-ink tap"
        >
          How we got this
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} strokeWidth={2} />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-line space-y-2.5">
                <BreakdownRow
                  icon={<Wallet size={14} strokeWidth={1.75} />}
                  label="Income this period"
                  value={money(sts.income)}
                  positive
                />
                <BreakdownRow
                  icon={<Receipt size={14} strokeWidth={1.75} />}
                  label={`Bills before ${format(sts.period.end, 'MMM d')}`}
                  value={`−${money(sts.billsDue)}`}
                />
                <BreakdownRow
                  icon={<PiggyBank size={14} strokeWidth={1.75} />}
                  label="Savings set aside"
                  value={`−${money(sts.savings)}`}
                />
                <BreakdownRow
                  icon={<TrendingUp size={14} strokeWidth={1.75} />}
                  label="Already spent this period"
                  value={`−${money(sts.discretionarySpent)}`}
                />
                <div className="flex items-center justify-between pt-2 border-t border-line">
                  <span className="text-[13px] font-semibold">Left to spend</span>
                  <span
                    className={`num text-[13px] font-semibold ${
                      sts.negative ? 'text-[var(--color-alert)]' : 'text-ink'
                    }`}
                  >
                    {money(sts.periodRemaining)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <VelocityCard
        spent={velocity.spent}
        budget={velocity.budget}
        elapsedPct={velocity.elapsedPct}
        usedPct={velocity.usedPct}
        projectedTotal={velocity.projectedTotal}
        projectedOver={velocity.projectedOver}
        status={velocity.status}
        worstCategory={velocity.worstCategory}
      />

      <PayBillsSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  )
}

function BreakdownRow({
  icon,
  label,
  value,
  positive,
}: {
  icon: React.ReactNode
  label: string
  value: string
  positive?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-[13px] text-soft">
        <span className="text-soft">{icon}</span>
        {label}
      </span>
      <span className={`num text-[13px] ${positive ? 'text-ink font-medium' : 'text-soft'}`}>
        {value}
      </span>
    </div>
  )
}

type VelocityProps = {
  spent: number
  budget: number
  elapsedPct: number
  usedPct: number
  projectedTotal: number
  projectedOver: number
  status: 'under' | 'watch' | 'over'
  worstCategory: {
    name: string
    spent: number
    budget: number
    projected: number
    over: number
  } | null
}

function VelocityCard(v: VelocityProps) {
  if (v.budget <= 0) return null

  const elapsed = Math.round(v.elapsedPct * 100)
  const used = Math.round(v.usedPct * 100)

  const accent =
    v.status === 'over'
      ? 'var(--color-alert)'
      : v.status === 'watch'
        ? 'var(--color-warning)'
        : 'var(--color-brand)'

  const title =
    v.status === 'over'
      ? 'On pace to overspend'
      : v.status === 'watch'
        ? 'Running a little hot'
        : 'On pace'

  const body =
    v.status === 'under'
      ? `You've used ${used}% of budget with ${elapsed}% of the month gone. At this rate you finish ~${money(Math.abs(v.projectedOver))} under.`
      : v.worstCategory
        ? `At this pace you'll finish ~${money(v.projectedOver)} over — ${v.worstCategory.name} is the biggest driver (${money(v.worstCategory.spent)} of ${money(v.worstCategory.budget)} already).`
        : `You've used ${used}% of budget but only ${elapsed}% of the month has passed. Projected finish ${money(v.projectedTotal)} vs. your ${money(v.budget)} budget.`

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <div className="flex items-start gap-3">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}
          >
            <Gauge size={17} strokeWidth={1.75} />
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-semibold tracking-tight">{title}</div>
            <div className="text-[13px] text-soft mt-1 leading-relaxed">{body}</div>

            {/* pace bar: spent vs. month-elapsed marker */}
            <div className="mt-3 relative h-2 rounded-full bg-card-2 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${Math.min(100, used)}%`, background: accent }}
              />
            </div>
            <div className="relative mt-1 h-3">
              <span
                className="absolute -translate-x-1/2 text-[10px] text-soft"
                style={{ left: `${Math.min(100, elapsed)}%` }}
              >
                today
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-soft mt-1">
              <span className="num">{money(v.spent)} spent</span>
              <span className="num">
                proj. {money(v.projectedTotal)} · {money(Math.abs(v.projectedOver))}{' '}
                {v.projectedOver > 0 ? 'over' : 'under'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
