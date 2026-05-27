import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { useAppStore } from '@/store/useAppStore'
import { ProgressRing } from '@/components/ProgressRing'
import { CategoryCard } from '@/components/CategoryCard'
import { TransactionRow } from '@/components/TransactionRow'
import { Card } from '@/components/ui/Card'
import {
  categorySpentThisMonth,
  daysLeftInMonth,
  spentLastWeek,
  spentThisWeek,
  totalBudget,
  totalSpentThisMonth,
} from '@/lib/selectors'
import { cn, money, signedMoney, statusColor } from '@/lib/utils'

export function Home() {
  const navigate = useNavigate()
  const { user, categories, transactions, notifications } = useAppStore()

  const now = new Date()
  const budget = totalBudget(categories)
  const spent = totalSpentThisMonth(transactions, now)
  const remaining = Math.max(0, budget - spent)
  const overall = spent / budget
  const status = statusColor(overall)
  const week = spentThisWeek(transactions, now)
  const lastWeek = spentLastWeek(transactions, now)
  const weekDelta = week - lastWeek
  const dleft = daysLeftInMonth(now)
  const unread = notifications.filter((n) => !n.read).length
  const recent = [...transactions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 4)
  const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]))

  const ringColor =
    status === 'green'
      ? 'var(--color-brand)'
      : status === 'amber'
        ? 'var(--color-warning)'
        : 'var(--color-alert)'

  return (
    <div className="px-5 pt-4 pb-6 space-y-5">
      {/* Top bar */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">
            Hey, {user?.name ?? 'friend'} 👋
          </h1>
          <span className="inline-block mt-1 text-[10px] uppercase tracking-wide bg-card-2 text-soft px-2 py-0.5 rounded-full">
            Demo mode
          </span>
        </div>
        <Link
          to="/inbox"
          className="relative h-10 w-10 rounded-full bg-card border border-line flex items-center justify-center tap"
        >
          <Bell size={18} className="text-ink" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-alert ring-2 ring-[var(--surface)]" />
          )}
        </Link>
      </header>

      {/* Hero ring */}
      <Card className="flex flex-col items-center py-7 px-4">
        <ProgressRing value={Math.min(1, overall)} size={196} stroke={12} color={ringColor}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-center"
          >
            <div className="num text-[40px] font-semibold leading-none tracking-tight">
              {money(remaining)}
            </div>
            <div className="text-xs text-soft mt-1.5">
              left for {format(now, 'MMMM')}
            </div>
          </motion.div>
        </ProgressRing>
        <div className="text-[13px] text-soft mt-3 num">
          out of {money(budget)} budgeted
        </div>
      </Card>

      {/* Affordability CTA */}
      <button
        type="button"
        onClick={() => navigate('/check')}
        className="w-full h-14 rounded-2xl bg-brand text-white font-semibold inline-flex items-center justify-center gap-2 tap shadow-[var(--shadow-card)]"
      >
        <Sparkles size={18} />
        Can I afford this?
      </button>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-[15px] font-semibold">Your categories</h2>
          <Link to="/transactions" className="text-xs text-brand font-medium tap">
            See all
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5">
          {categories.map((c, i) => (
            <CategoryCard
              key={c.id}
              category={c}
              spent={categorySpentThisMonth(transactions, c.id, now)}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* This week */}
      <Card className="py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold">This week</h3>
          <span className="text-xs text-soft">{dleft} days left in {format(now, 'MMM')}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Spent" value={money(week)} />
          <Stat
            label="vs. last week"
            value={signedMoney(weekDelta)}
            valueClassName={weekDelta > 0 ? 'text-alert' : 'text-[var(--color-brand-strong)]'}
          />
          <Stat label="Day streak" value="3 🔥" />
        </div>
      </Card>

      {/* Recent activity */}
      <section>
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-[15px] font-semibold">Recent activity</h2>
          <Link to="/transactions" className="text-xs text-brand font-medium tap">
            View all
          </Link>
        </div>
        <Card className="py-1 divide-y divide-line">
          {recent.map((t) => (
            <TransactionRow
              key={t.id}
              transaction={t}
              category={categoryById[t.categoryId]}
              onClick={() => navigate(`/transactions`)}
            />
          ))}
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
    <div className="bg-card-2 rounded-xl p-3">
      <div className={cn('num text-base font-semibold', valueClassName)}>{value}</div>
      <div className="text-[11px] text-soft mt-0.5">{label}</div>
    </div>
  )
}
