import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Bell, ChevronRight, Sparkles, Wallet } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { CurbLogo } from '@/components/CurbLogo'
import { ProgressRing } from '@/components/ProgressRing'
import { CategoryCard } from '@/components/CategoryCard'
import { TransactionRow } from '@/components/TransactionRow'
import { Card } from '@/components/ui/Card'
import {
  categorySpentThisMonth,
  daysLeftInMonth,
  noSpendDays,
  spentLastWeek,
  spentThisWeek,
  totalBudget,
  totalSpentThisMonth,
} from '@/lib/selectors'
import { computeSafeToSpend } from '@/lib/safeToSpend'
import { cn, money, signedMoney } from '@/lib/utils'

export function Home() {
  const navigate = useNavigate()
  const { user, categories, transactions, notifications, payProfile, bills } =
    useAppStore()

  const now = new Date()
  const budget = totalBudget(categories)
  const spent = totalSpentThisMonth(transactions, now)
  const remaining = Math.max(0, budget - spent)
  // The dial shows budget *remaining* as a green arc over a gray track, so it
  // starts as a full green ring and depletes into gray as you spend.
  const remainingPct = budget > 0 ? remaining / budget : 1
  const week = spentThisWeek(transactions, now)
  const lastWeek = spentLastWeek(transactions, now)
  const weekDelta = week - lastWeek
  const dleft = daysLeftInMonth(now)
  const nsd = noSpendDays(transactions, now)
  const safe = payProfile
    ? computeSafeToSpend(
        { user, profile: payProfile, bills, categories, transactions },
        now,
      )
    : null
  const unread = notifications.filter((n) => !n.read).length
  const recent = [...transactions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 4)
  const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]))

  const firstName = user?.name?.split(' ')[0] ?? 'friend'

  return (
    <div className="px-5 pt-5 pb-8 space-y-6">
      {/* Header */}
      <header className="space-y-4">
        {/* Brand bar */}
        <div className="flex items-center justify-between">
          <CurbLogo size="sm" />
          <Link
            to="/inbox"
            className="relative h-10 w-10 rounded-full bg-card flex items-center justify-center tap shadow-[var(--shadow-card)]"
          >
            <Bell size={17} strokeWidth={1.75} className="text-ink" />
            {unread > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-alert ring-2 ring-[var(--surface)]" />
            )}
          </Link>
        </div>
        {/* Greeting */}
        <div>
          <div className="text-[11px] text-soft uppercase tracking-[0.16em] font-medium">
            {format(now, 'EEEE, MMM d')}
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight mt-0.5">
            {firstName}
          </h1>
        </div>
      </header>

      {/* Hero ring */}
      <Card className="flex flex-col items-center py-8 px-4">
        <div className="text-[10px] text-soft uppercase tracking-[0.2em] font-semibold mb-4">
          {format(now, 'MMMM yyyy')}
        </div>
        <ProgressRing
          value={remainingPct}
          size={196}
          stroke={9}
          color="var(--color-brand)"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.35 }}
            className="text-center"
          >
            <div className="display num text-[44px] font-bold">
              {money(remaining)}
            </div>
            <div className="text-[12px] text-soft mt-2">
              left of {money(budget)}
            </div>
          </motion.div>
        </ProgressRing>
      </Card>

      {/* Safe to spend today — compact, links to Coach for the full breakdown */}
      {safe && (
        <Link to="/coach" className="block">
          <Card className="flex items-center justify-between py-4 px-5 tap">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                <Wallet size={17} strokeWidth={1.75} />
              </div>
              <div>
                <div className="text-[11px] text-soft uppercase tracking-[0.14em] font-semibold">
                  Safe to spend
                </div>
                <div className="mt-0.5">
                  <span
                    className={cn(
                      'num text-[19px] font-bold tracking-tight',
                      safe.negative && 'text-[var(--color-alert)]',
                    )}
                  >
                    {money(safe.periodRemaining)}
                  </span>
                  <span className="text-[12px] text-soft ml-1">
                    until {format(safe.period.end, 'MMM d')}
                  </span>
                </div>
              </div>
            </div>
            <ChevronRight size={18} strokeWidth={1.75} className="text-soft shrink-0" />
          </Card>
        </Link>
      )}

      {/* Affordability CTA */}
      <button
        type="button"
        onClick={() => navigate('/check')}
        className="w-full h-[52px] rounded-2xl bg-ink dark:bg-white text-white dark:text-ink font-semibold inline-flex items-center justify-center gap-2 tap tracking-tight"
      >
        <Sparkles size={16} strokeWidth={1.75} />
        Can I afford this?
      </button>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold tracking-tight uppercase text-soft">
            Categories
          </h2>
          <Link to="/transactions" className="text-[12px] text-ink font-semibold tap">
            See all
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5">
          {categories.length === 0 ? (
            <div className="text-sm text-soft py-4">No categories yet.</div>
          ) : (
            categories.map((c, i) => (
              <CategoryCard
                key={c.id}
                category={c}
                spent={categorySpentThisMonth(transactions, c.id, now)}
                index={i}
              />
            ))
          )}
        </div>
      </section>

      {/* This week */}
      <Card className="py-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-semibold tracking-tight uppercase text-soft">
            This week
          </h3>
          <span className="text-[11px] text-soft">
            {dleft} days left in {format(now, 'MMM')}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Spent" value={money(week)} />
          <Stat
            label="vs last week"
            value={signedMoney(weekDelta)}
            valueClassName={
              weekDelta > 0
                ? 'text-[var(--color-alert)]'
                : 'text-[var(--color-brand-strong)]'
            }
          />
          <Stat label="No-spend days" value={String(nsd)} />
        </div>
      </Card>

      {/* Recent */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold tracking-tight uppercase text-soft">
            Recent
          </h2>
          <Link to="/transactions" className="text-[12px] text-ink font-semibold tap">
            View all
          </Link>
        </div>
        <Card className="py-1">
          {recent.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-sm text-soft">
                No spending yet — tap{' '}
                <Link to="/transactions" className="text-ink font-semibold">
                  Activity
                </Link>{' '}
                to log your first one.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {recent.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  category={categoryById[t.categoryId]}
                  onClick={() => navigate(`/transactions`)}
                />
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div>
      <div className={cn('num text-[15px] font-semibold tracking-tight', valueClassName)}>
        {value}
      </div>
      <div className="text-[11px] text-soft mt-1">{label}</div>
    </div>
  )
}
