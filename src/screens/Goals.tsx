import { useState } from 'react'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { ProgressRing } from '@/components/ProgressRing'
import { Icon } from '@/components/Icon'
import { StreakCard } from '@/components/StreakCard'
import { RoundUpCard } from '@/components/RoundUpCard'
import { ChallengesSection } from '@/components/ChallengesSection'
import { money } from '@/lib/utils'

export function Goals() {
  const { goals, contributions, addContribution } = useAppStore()
  const [addOpen, setAddOpen] = useState(false)
  const [addAmount, setAddAmount] = useState('')

  const goal = goals[0]

  const pct = goal ? Math.min(1, goal.currentAmount / goal.targetAmount) : 0
  const remaining = goal ? Math.max(0, goal.targetAmount - goal.currentAmount) : 0
  const goalContribs = goal
    ? contributions
        .filter((c) => c.goalId === goal.id)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
    : []

  const monthly = goalContribs.length
    ? goalContribs.reduce((s, c) => s + c.amount, 0) / Math.max(1, goalContribs.length)
    : 0
  const monthsToFinish = monthly > 0 ? Math.ceil(remaining / monthly) : null

  const submitAdd = () => {
    if (!goal) return
    const v = parseFloat(addAmount)
    if (!Number.isFinite(v) || v <= 0) return
    addContribution(goal.id, v, 'Manual add')
    setAddAmount('')
    setAddOpen(false)
  }

  return (
    <div className="px-5 pt-5 pb-8 space-y-4">
      <header>
        <h1 className="font-display text-[28px] tracking-tight">Goals</h1>
      </header>

      <StreakCard />

      {goal ? (
        <>
          <Card className="text-center py-8 flex flex-col items-center">
            <div className="h-14 w-14 rounded-2xl bg-card-2 text-ink flex items-center justify-center mb-4">
              <Icon name={goal.icon} size={26} strokeWidth={1.75} />
            </div>
            <ProgressRing value={pct} size={180} stroke={9}>
              <div className="text-center">
                <div className="num display text-[30px] font-bold">
                  {money(goal.currentAmount)}
                </div>
                <div className="text-[12px] text-soft mt-2 num">
                  of {money(goal.targetAmount)}
                </div>
              </div>
            </ProgressRing>
            <div className="mt-5 text-[15px] font-semibold tracking-tight">{goal.name}</div>
            <div className="text-[12px] text-soft mt-1 num">
              {money(remaining)} to go
              {monthsToFinish !== null &&
                monthsToFinish > 0 &&
                ` · ~${monthsToFinish} months at your pace`}
            </div>
            <Button size="md" className="mt-4 w-auto" onClick={() => setAddOpen(true)}>
              <Plus size={15} strokeWidth={1.75} />
              Add funds
            </Button>
          </Card>

          <section>
            <h2 className="text-[13px] font-semibold tracking-tight uppercase text-soft mb-2 mt-2">
              Contributions
            </h2>
            <Card className="py-1">
              {goalContribs.length === 0 && (
                <div className="text-center text-[13px] text-soft py-4">
                  No contributions yet
                </div>
              )}
              <ul className="divide-y divide-line">
                {goalContribs.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-[13px] font-semibold">{c.note ?? 'Added'}</div>
                      <div className="text-[11px] text-soft">
                        {format(new Date(c.date), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div className="num text-[14px] font-semibold text-[var(--color-brand-strong)]">
                      +{money(c.amount)}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        </>
      ) : (
        <Card className="text-center py-10">
          <div className="h-12 w-12 rounded-2xl bg-card-2 text-ink flex items-center justify-center mx-auto mb-3">
            <Icon name="Target" size={20} />
          </div>
          <div className="text-[15px] font-semibold tracking-tight">No goal yet</div>
          <div className="text-[13px] text-soft mt-1">
            Create one to start tracking progress.
          </div>
          <Button size="md" className="mt-4 mx-auto w-auto">
            Create a goal
          </Button>
        </Card>
      )}

      <RoundUpCard />

      <ChallengesSection />

      {goal && (
        <Button variant="secondary" size="md" className="w-full">
          Create another goal
        </Button>
      )}

      <Sheet open={addOpen} onOpenChange={setAddOpen} title="Add funds">
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-soft uppercase tracking-[0.16em] font-semibold">
              Amount
            </label>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-soft">
                $
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="20"
                className="num w-full h-12 pl-7 pr-3 bg-card-2 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-ink/20"
              />
            </div>
          </div>
          <Button size="lg" onClick={submitAdd}>
            Add to goal
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
