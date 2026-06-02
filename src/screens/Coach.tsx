import { motion } from 'framer-motion'
import { Coffee, Flame, Sparkles, Sun, Wallet } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SafeToSpendCard } from '@/components/SafeToSpendCard'
import { SubscriptionAuditCard } from '@/components/SubscriptionAuditCard'
import { AskCoachCard } from '@/components/AskCoachCard'
import { subDays } from 'date-fns'
import { money } from '@/lib/utils'
import {
  computeStreaks,
  computeWeekendPattern,
  recentWin,
  weekendPatternBody,
} from '@/lib/coachStats'

export function Coach() {
  const { categories, transactions, challenges, toggleChallenge } = useAppStore()
  const now = new Date()

  const coffeeCat = categories.find((c) => c.name === 'Coffee')
  const coffeeWeek = coffeeCat
    ? transactions.filter(
        (t) =>
          t.categoryId === coffeeCat.id &&
          new Date(t.date) >= subDays(now, 7),
      )
    : []
  const coffeeSpend = coffeeWeek.reduce((s, t) => s + t.amount, 0)

  // Live "soft" insights — replaces the old hardcoded copy.
  const streaks = computeStreaks(transactions, categories, now)
  const weekend = computeWeekendPattern(transactions, categories, now)
  const weekendBody = weekendPatternBody(weekend)
  const win = recentWin(transactions, categories, now)

  return (
    <div className="px-5 pt-5 pb-8 space-y-4">
      <header>
        <h1 className="font-display text-[28px] tracking-tight">Coach</h1>
        <p className="text-[13px] text-soft mt-1">
          Patterns we noticed. No lectures.
        </p>
      </header>

      <AskCoachCard />

      <SafeToSpendCard />

      {coffeeCat && (
        <InsightCard
          icon={<Coffee size={17} strokeWidth={1.75} />}
          title="Coffee check-in"
          body={`You've bought coffee ${coffeeWeek.length} of the last 7 days. ${money(coffeeSpend)} total — that's ${money(coffeeSpend * 4.3)}/month at this pace.`}
          action="Set a coffee cap"
        />
      )}

      <SubscriptionAuditCard />

      {weekendBody && (
        <InsightCard
          icon={<Sun size={17} strokeWidth={1.75} />}
          title="Weekend pattern"
          body={weekendBody}
          action={
            weekend && weekend.ratio >= 1.25 ? 'Try a no-delivery weekend' : undefined
          }
        />
      )}

      {win && (
        <InsightCard
          icon={<Sparkles size={17} strokeWidth={1.75} />}
          title="Recent wins"
          body={win}
        />
      )}

      <section>
        <h2 className="text-[13px] font-semibold tracking-tight uppercase text-soft mt-2 mb-2">
          Challenges
        </h2>
        {challenges.length === 0 && (
          <Card className="text-center py-6">
            <div className="text-sm text-soft">No challenges yet.</div>
          </Card>
        )}
        {challenges.map((c) => (
          <Card key={c.id} className="mb-2">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-card-2 text-ink flex items-center justify-center shrink-0">
                <Flame size={17} strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-semibold tracking-tight">
                  {c.title}
                </div>
                <div className="text-[13px] text-soft mt-1 leading-relaxed">
                  {c.description}
                </div>
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

      <section>
        <h2 className="text-[13px] font-semibold tracking-tight uppercase text-soft mt-2 mb-2">
          Streaks
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <StreakTile
            icon={<Flame size={16} strokeWidth={1.75} />}
            label="Under pace"
            value={streaks.underPace > 0 ? money(streaks.underPace) : 'Over'}
          />
          <StreakTile
            icon={<Coffee size={16} strokeWidth={1.75} />}
            label="No coffee"
            value={`${streaks.noCoffee}d`}
          />
          <StreakTile
            icon={<Wallet size={16} strokeWidth={1.75} />}
            label="No spend"
            value={`${streaks.noSpend}d`}
          />
        </div>
      </section>
    </div>
  )
}

function InsightCard({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode
  title: string
  body: string
  action?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-card-2 text-ink flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-semibold tracking-tight">
              {title}
            </div>
            <div className="text-[13px] text-soft mt-1 leading-relaxed">{body}</div>
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
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="bg-card rounded-[18px] p-4 shadow-[var(--shadow-card)] dark:ring-1 dark:ring-[var(--line)]">
      <div className="text-soft">{icon}</div>
      <div className="num text-[18px] font-semibold mt-2 tracking-tight">{value}</div>
      <div className="text-[11px] text-soft mt-0.5 leading-tight">{label}</div>
    </div>
  )
}
