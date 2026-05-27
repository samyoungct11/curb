import { motion } from 'framer-motion'
import { Coffee, Flame, Repeat, Sparkles, Sun } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { subDays } from 'date-fns'
import { cn, money } from '@/lib/utils'
import { useState } from 'react'

export function Coach() {
  const { categories, transactions, challenges, toggleChallenge } = useAppStore()
  const now = new Date()

  // Coffee streak
  const coffeeCat = categories.find((c) => c.name === 'Coffee')
  const coffeeWeek = coffeeCat
    ? transactions.filter(
        (t) =>
          t.categoryId === coffeeCat.id &&
          new Date(t.date) >= subDays(now, 7),
      )
    : []
  const coffeeSpend = coffeeWeek.reduce((s, t) => s + t.amount, 0)

  // Subscriptions
  const subsCat = categories.find((c) => c.name === 'Subscriptions')
  const subs = subsCat
    ? transactions.filter((t) => t.categoryId === subsCat.id)
    : []
  const [subMutes, setSubMutes] = useState<Record<string, boolean>>({})

  return (
    <div className="px-5 pt-4 pb-6 space-y-4">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">Coach</h1>
        <p className="text-sm text-soft mt-1">
          Patterns we noticed. No lectures.
        </p>
      </header>

      {/* Insight 1: Coffee streak */}
      <InsightCard
        icon={<Coffee size={18} />}
        emoji="☕"
        title="Coffee check-in"
        body={`You've bought coffee ${coffeeWeek.length} of the last 7 days. ${money(coffeeSpend)} total — that's ${money(coffeeSpend * 4.3)}/month at this pace.`}
        action="Set a coffee cap"
      />

      {/* Insight 2: Subscription review */}
      <Card>
        <div className="flex items-start gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-brand-soft text-[var(--color-brand-strong)] flex items-center justify-center shrink-0">
            <Repeat size={18} />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold">Subscription review</div>
            <div className="text-sm text-soft mt-0.5">
              {subs.length} active subs · {money(subs.reduce((s, t) => s + t.amount, 0))}/mo
            </div>
          </div>
        </div>
        <ul className="space-y-2">
          {subs.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between bg-card-2 rounded-xl px-3 py-2.5"
            >
              <div>
                <div className="text-sm font-medium">{s.merchant}</div>
                <div className="num text-xs text-soft">{money(s.amount)}/mo</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-soft uppercase tracking-wide">
                  {subMutes[s.id] ? 'Unused' : 'Keep'}
                </span>
                <Switch
                  checked={!!subMutes[s.id]}
                  onCheckedChange={(v) =>
                    setSubMutes((m) => ({ ...m, [s.id]: v }))
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* Insight 3: Weekend trend */}
      <InsightCard
        icon={<Sun size={18} />}
        emoji="🌞"
        title="Weekend pattern"
        body="You spend 2.4× more on weekends than weekdays. Mostly food."
        action="Try a no-delivery weekend"
      />

      {/* Insight 4: Positive */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-soft text-[var(--color-brand-strong)] flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold">Nice 🎉</div>
            <div className="text-sm text-soft mt-0.5">
              No impulse shopping in 8 days. That's a record this month.
            </div>
          </div>
        </div>
      </Card>

      {/* Challenges */}
      <section>
        <h2 className="text-[15px] font-semibold mb-2">Challenges</h2>
        {challenges.map((c) => (
          <Card key={c.id} className="mb-2">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🎯</div>
              <div className="flex-1">
                <div className="text-[15px] font-semibold">{c.title}</div>
                <div className="text-sm text-soft mt-0.5">{c.description}</div>
                <Button
                  size="sm"
                  variant={c.active ? 'secondary' : 'primary'}
                  className="mt-3"
                  onClick={() => toggleChallenge(c.id)}
                >
                  {c.active ? 'Active · Tap to end' : 'Accept challenge'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </section>

      {/* Streaks */}
      <section>
        <h2 className="text-[15px] font-semibold mb-2">Streaks</h2>
        <div className="grid grid-cols-3 gap-2">
          <StreakTile emoji="🔥" label="Under-budget weeks" value="2" />
          <StreakTile emoji="☕" label="No-coffee days" value="1" />
          <StreakTile emoji="💰" label="No-spend days" value="3" />
        </div>
      </section>
    </div>
  )
}

function InsightCard({
  icon,
  emoji,
  title,
  body,
  action,
}: {
  icon: React.ReactNode
  emoji: string
  title: string
  body: string
  action?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-soft text-[var(--color-brand-strong)] flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold">
              {title} <span className="ml-0.5">{emoji}</span>
            </div>
            <div className="text-sm text-soft mt-0.5 leading-relaxed">{body}</div>
            {action && (
              <Button size="sm" variant="secondary" className="mt-3">
                {action}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function StreakTile({
  emoji,
  label,
  value,
}: {
  emoji: string
  label: string
  value: string
}) {
  return (
    <div className="bg-card border border-line rounded-2xl p-3 text-center">
      <div className="text-xl">{emoji}</div>
      <div className={cn('num text-lg font-semibold mt-1 flex items-center justify-center gap-1')}>
        {value}
        <Flame size={14} className="text-warning" />
      </div>
      <div className="text-[10px] text-soft mt-0.5 leading-tight">{label}</div>
    </div>
  )
}
