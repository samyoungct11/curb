import { useState } from 'react'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { ProgressRing } from '@/components/ProgressRing'
import { money } from '@/lib/utils'

export function Goals() {
  const { goals, contributions, addContribution } = useAppStore()
  const [addOpen, setAddOpen] = useState(false)
  const [addAmount, setAddAmount] = useState('')

  const goal = goals[0]
  if (!goal) {
    return (
      <div className="p-5">
        <Card className="text-center py-10">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-[15px] font-semibold">No goal yet</div>
        </Card>
      </div>
    )
  }

  const pct = Math.min(1, goal.currentAmount / goal.targetAmount)
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
  const goalContribs = contributions
    .filter((c) => c.goalId === goal.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  const monthly = goalContribs.length
    ? goalContribs.reduce((s, c) => s + c.amount, 0) / Math.max(1, goalContribs.length)
    : 0
  const monthsToFinish = monthly > 0 ? Math.ceil(remaining / monthly) : null

  const submitAdd = () => {
    const v = parseFloat(addAmount)
    if (!Number.isFinite(v) || v <= 0) return
    addContribution(goal.id, v, 'Manual add')
    setAddAmount('')
    setAddOpen(false)
  }

  return (
    <div className="px-5 pt-4 pb-6 space-y-4">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">Goals</h1>
      </header>

      {/* Hero */}
      <Card className="text-center py-8 flex flex-col items-center">
        <div className="text-5xl mb-3">{goal.emoji}</div>
        <ProgressRing value={pct} size={180} stroke={12}>
          <div className="text-center">
            <div className="num text-[28px] font-semibold leading-none">
              {money(goal.currentAmount)}
            </div>
            <div className="text-xs text-soft mt-1.5">of {money(goal.targetAmount)}</div>
          </div>
        </ProgressRing>
        <div className="mt-4 text-[15px] font-semibold">{goal.name}</div>
        <div className="text-sm text-soft mt-1">
          {money(remaining)} to go
          {monthsToFinish !== null &&
            monthsToFinish > 0 &&
            ` · ~${monthsToFinish} months at your pace`}
        </div>
        <Button size="md" className="mt-4 w-auto" onClick={() => setAddOpen(true)}>
          <Plus size={16} />
          Add funds
        </Button>
      </Card>

      {/* History */}
      <section>
        <h2 className="text-[15px] font-semibold mb-2">Contributions</h2>
        <Card className="py-1">
          {goalContribs.length === 0 && (
            <div className="text-center text-sm text-soft py-4">No contributions yet</div>
          )}
          <ul className="divide-y divide-line">
            {goalContribs.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium">{c.note ?? 'Added'}</div>
                  <div className="text-xs text-soft">
                    {format(new Date(c.date), 'MMM d, yyyy')}
                  </div>
                </div>
                <div className="num text-[15px] font-semibold text-[var(--color-brand-strong)]">
                  +{money(c.amount)}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <Button variant="secondary" size="md" className="w-full">
        Create another goal
      </Button>

      <Sheet open={addOpen} onOpenChange={setAddOpen} title="Add funds">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-soft font-medium uppercase tracking-wide">
              Amount
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-soft">
                $
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="20"
                className="num w-full h-12 pl-7 pr-3 bg-card-2 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-brand"
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
