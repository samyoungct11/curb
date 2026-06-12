import { useState } from 'react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { CreditCard, Flame, RefreshCw, Utensils } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { mealPlanStatus, swipeMath, DEFAULT_SWIPE_VALUE } from '@/lib/mealPlan'
import { money, cn } from '@/lib/utils'
import type { MealPlan } from '@/lib/types'

export function CampusCard() {
  const { mealPlan, setMealPlan } = useAppStore()

  return (
    <div className="px-5 pt-5 pb-8 space-y-4">
      <header>
        <h1 className="font-display text-[28px] tracking-tight">Campus card</h1>
        <p className="text-[13px] text-soft mt-1">your meal plan, decoded</p>
      </header>

      {mealPlan ? <PlanDashboard plan={mealPlan} /> : <PlanSetup onSave={setMealPlan} />}

      {mealPlan && (
        <button
          type="button"
          onClick={() => setMealPlan(null)}
          className="block mx-auto text-[12px] text-soft underline-offset-2 hover:underline tap"
        >
          Remove plan
        </button>
      )}
    </div>
  )
}

function PlanDashboard({ plan }: { plan: MealPlan }) {
  const { user, updateMealPlanBalance } = useAppStore()
  const [updateOpen, setUpdateOpen] = useState(false)
  const [balance, setBalance] = useState('')
  const [swipes, setSwipes] = useState('')

  const s = mealPlanStatus(plan)
  const sw = swipeMath(plan)

    const submitUpdate = () => {
      const v = parseFloat(balance)
      if (!Number.isFinite(v) || v < 0) return
      const sv = swipes === '' ? undefined : Math.max(0, parseInt(swipes, 10) || 0)
      updateMealPlanBalance(v, sv)
      setBalance('')
      setSwipes('')
      setUpdateOpen(false)
    }

    return (
      <>
        {/* The card itself — the brand-green object you own */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 160, damping: 20 }}
          className="rounded-3xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-strong)] p-6 text-white shadow-lg"
        >
          <div className="flex items-start justify-between">
            <span className="font-display text-lg">{plan.school}</span>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
              {plan.planName ?? 'dining'}
            </span>
          </div>
          <p className="mt-7 font-display text-[44px] leading-none num">
            {money(plan.diningDollars)}
          </p>
          <p className="mt-1 text-sm text-white/70">dining dollars left</p>
          <div className="mt-6 flex items-end justify-between">
            <span className="text-sm font-medium text-white/80">{user?.name}</span>
            <span className="text-xs text-white/50">
              updated {format(new Date(plan.updatedAt), 'MMM d')}
            </span>
          </div>
        </motion.div>

        {/* Burn rate */}
        <Card className="py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold tracking-tight uppercase text-soft">
              Burn rate
            </h2>
            <Flame
              size={17}
              strokeWidth={1.75}
              className={cn(
                s.pace === 'behind' ? 'text-[var(--color-alert)]' : 'text-brand',
              )}
            />
          </div>

          <p className="mt-3 text-[14px] leading-relaxed">
            {s.needsBaseline ? (
              <>
                Tracking started — update your balance after a few days of spending
                and the burn-rate math kicks in.
              </>
            ) : s.runOutDate ? (
              <>
                At your pace, dining dollars run out{' '}
                <span className="font-semibold">{format(s.runOutDate, 'MMM d')}</span>
                {s.runOutGapDays != null && s.runOutGapDays > 0 && (
                  <>
                    {' '}— <span className="font-semibold">{s.runOutGapDays} days</span> before
                    the term ends
                  </>
                )}
                .
              </>
            ) : (
              <>
                At your pace your balance lasts past{' '}
                <span className="font-semibold">{format(new Date(plan.termEnd), 'MMM d')}</span>
                {s.projectedLeftover > 20 && (
                  <>
                    {' '}with about{' '}
                    <span className="font-semibold">{money(s.projectedLeftover)}</span> unspent —
                    most plans don't refund it
                  </>
                )}
                .
              </>
            )}
          </p>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-card-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.round(s.spentPct * 100))}%` }}
              transition={{ type: 'spring', stiffness: 60, damping: 18 }}
              className={cn(
                'h-full rounded-full',
                s.pace === 'behind' ? 'bg-[var(--color-alert)]' : 'bg-brand',
              )}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-soft num">
            <span>{Math.round(s.spentPct * 100)}% spent</span>
            <span>{Math.round(s.termElapsedPct * 100)}% of term gone</span>
          </div>

          {s.daysRemaining > 0 && (
            <p className="mt-3 text-[13px] text-brand font-medium">
              keep it under {money(s.dailyAllowance)}/day and you coast to the finish
            </p>
          )}
        </Card>

        {/* Swipe math */}
        {sw && (
          <Card className="py-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold tracking-tight uppercase text-soft">
                Swipe math
              </h2>
              <Utensils size={17} strokeWidth={1.75} className="text-brand" />
            </div>
            <p className="mt-3 text-[14px] leading-relaxed">
              You've got <span className="font-semibold num">{sw.remaining} swipes</span> worth{' '}
              <span className="font-semibold num">≈ {money(sw.value)}</span> each — that's{' '}
              <span className="font-semibold num">{money(sw.strandedValue)}</span> on the table.
              Swipes expire, dollars don't: burn the swipes first.
            </p>
          </Card>
        )}

        <Button size="lg" onClick={() => setUpdateOpen(true)}>
          <RefreshCw size={15} strokeWidth={1.75} />
          Update balance
        </Button>
        <p className="text-center text-[11px] text-soft -mt-1">
          grab the number from your campus portal — takes 10 seconds
        </p>

        <Sheet open={updateOpen} onOpenChange={setUpdateOpen} title="Update balance">
          <div className="space-y-3">
            <Field label="Dining dollars now">
              <MoneyInput value={balance} onChange={setBalance} placeholder={String(plan.diningDollars)} />
            </Field>
            {plan.swipesRemaining != null && (
              <Field label="Swipes left (optional)">
                <PlainInput
                  value={swipes}
                  onChange={setSwipes}
                  placeholder={String(plan.swipesRemaining)}
                  mode="numeric"
                />
              </Field>
            )}
            <Button size="lg" onClick={submitUpdate}>
              Save
            </Button>
          </div>
      </Sheet>
    </>
  )
}

function PlanSetup({ onSave }: { onSave: (p: MealPlan) => void }) {
  const [school, setSchool] = useState('')
  const [dollars, setDollars] = useState('')
  const [swipes, setSwipes] = useState('')
  const [termStart, setTermStart] = useState('')
  const [termEnd, setTermEnd] = useState('')

  const dollarsNum = parseFloat(dollars)
  const ready =
    school.trim().length > 0 &&
    Number.isFinite(dollarsNum) &&
    dollarsNum > 0 &&
    termStart !== '' &&
    termEnd !== '' &&
    termStart < termEnd

  const submit = () => {
    if (!ready) return
    onSave({
      school: school.trim(),
      diningDollarsStart: dollarsNum,
      baselineDate: new Date().toISOString(),
      diningDollars: dollarsNum,
      swipesRemaining: swipes === '' ? null : Math.max(0, parseInt(swipes, 10) || 0),
      swipeValue: DEFAULT_SWIPE_VALUE,
      termStart,
      termEnd,
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <Card className="py-6">
      <div className="h-12 w-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-4">
        <CreditCard size={20} strokeWidth={1.75} />
      </div>
      <h2 className="text-[16px] font-semibold tracking-tight">Add your meal plan</h2>
      <p className="text-[13px] text-soft mt-1 leading-relaxed">
        The average plan costs $5,656 a year and no bank app can see it. Enter it once —
        Curb tracks the burn rate so nothing expires unused.
      </p>

      <div className="mt-5 space-y-3">
        <Field label="School">
          <PlainInput value={school} onChange={setSchool} placeholder="State U" />
        </Field>
        <Field label="Dining dollars balance">
          <MoneyInput value={dollars} onChange={setDollars} placeholder="280" />
        </Field>
        <Field label="Meal swipes left (optional)">
          <PlainInput value={swipes} onChange={setSwipes} placeholder="23" mode="numeric" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Term start">
            <DateInput value={termStart} onChange={setTermStart} />
          </Field>
          <Field label="Term end">
            <DateInput value={termEnd} onChange={setTermEnd} />
          </Field>
        </div>
        <Button size="lg" disabled={!ready} onClick={submit}>
          Start tracking
        </Button>
      </div>
    </Card>
  )
}

// ── tiny form primitives (match Goals/Settings idiom) ─────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] text-soft uppercase tracking-[0.16em] font-semibold">
        {label}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  )
}

const inputCls =
  'w-full h-12 px-3 bg-card-2 rounded-xl text-[15px] font-semibold focus:outline-none focus:ring-2 focus:ring-ink/20'

function PlainInput({
  value,
  onChange,
  placeholder,
  mode,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mode?: 'numeric'
}) {
  return (
    <input
      type={mode === 'numeric' ? 'number' : 'text'}
      inputMode={mode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(inputCls, mode === 'numeric' && 'num')}
    />
  )
}

function MoneyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-soft">$</span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(inputCls, 'num pl-7')}
      />
    </div>
  )
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(inputCls, 'num')}
    />
  )
}
