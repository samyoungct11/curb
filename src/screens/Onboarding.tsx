import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/Button'
import type { AgeRange, PrimaryGoal, ToneMode } from '@/lib/types'
import { cn } from '@/lib/utils'

const AGES: { value: AgeRange; label: string }[] = [
  { value: '12-14', label: '12–14' },
  { value: '15-17', label: '15–17' },
  { value: '18-22', label: '18–22' },
  { value: '23-25', label: '23–25' },
]

const GOALS: { value: PrimaryGoal; label: string; emoji: string }[] = [
  { value: 'spend_less', label: 'Spend less', emoji: '💸' },
  { value: 'save_for_goal', label: 'Save for something', emoji: '🎯' },
  { value: 'stop_impulse', label: 'Stop impulse shopping', emoji: '🛑' },
  { value: 'track_food', label: 'Track food spending', emoji: '🍔' },
  { value: 'stay_under', label: 'Stay under budget', emoji: '📊' },
  { value: 'build_habits', label: 'Build better habits', emoji: '🌱' },
]

const CATS = [
  'Restaurants',
  'Coffee',
  'Shopping',
  'Fun',
  'Subscriptions',
  'Transport',
  'Beauty',
  'Gaming',
  'School',
  'Sports',
  'Gifts',
  'Other',
]

const TONES: { value: ToneMode; label: string; emoji: string; body: string }[] = [
  { value: 'strict', label: 'Strict', emoji: '🎯', body: 'Ping me early, ping me often.' },
  { value: 'balanced', label: 'Balanced', emoji: '⚖️', body: 'Tell me when it matters.' },
  { value: 'chill', label: 'Chill', emoji: '🌊', body: 'Just the big stuff.' },
]

export function Onboarding() {
  const navigate = useNavigate()
  const { updateUser } = useAppStore()
  const [step, setStep] = useState(0)
  const [age, setAge] = useState<AgeRange>('18-22')
  const [income, setIncome] = useState('600')
  const [student, setStudent] = useState<'yes' | 'no' | 'sometimes'>('yes')
  const [goal, setGoal] = useState<PrimaryGoal>('track_food')
  const [picked, setPicked] = useState<string[]>(['Restaurants', 'Coffee', 'Shopping', 'Fun'])
  const [tone, setTone] = useState<ToneMode>('balanced')
  const [done, setDone] = useState(false)

  const togglePick = (c: string) => {
    setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))
  }

  const next = () => setStep((s) => s + 1)
  const prev = () => setStep((s) => Math.max(0, s - 1))

  const canContinue = useMemo(() => {
    if (step === 1 && (!income || parseFloat(income) <= 0)) return false
    if (step === 4 && picked.length < 3) return false
    return true
  }, [step, income, picked])

  const finish = () => {
    updateUser({
      ageRange: age,
      monthlyIncome: parseFloat(income),
      isStudent: student === 'yes',
      primaryGoal: goal,
      notificationTone: tone,
    })
    setDone(true)
    setTimeout(() => navigate('/'), 1400)
  }

  const steps = [
    {
      title: 'How old are you?',
      sub: 'We tune the experience to your life stage.',
      content: (
        <div className="grid grid-cols-2 gap-3">
          {AGES.map((a) => (
            <PickerCard
              key={a.value}
              active={age === a.value}
              onClick={() => setAge(a.value)}
              label={a.label}
            />
          ))}
        </div>
      ),
    },
    {
      title: 'What do you have to spend?',
      sub: 'Allowance, job, parents — anything counts.',
      content: (
        <div>
          <div className="text-xs text-soft uppercase tracking-wide mb-1">Per month</div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl text-soft">$</span>
            <input
              type="number"
              inputMode="decimal"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="num w-full h-16 pl-9 pr-3 bg-card-2 rounded-2xl text-3xl font-semibold focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Are you a student?',
      sub: '',
      content: (
        <div className="space-y-2">
          {(['yes', 'no', 'sometimes'] as const).map((v) => (
            <PickerCard
              key={v}
              active={student === v}
              onClick={() => setStudent(v)}
              label={v[0].toUpperCase() + v.slice(1)}
              variant="row"
            />
          ))}
        </div>
      ),
    },
    {
      title: 'What\'s your main goal?',
      sub: 'Pick one. You can change it anytime.',
      content: (
        <div className="space-y-2">
          {GOALS.map((g) => (
            <PickerCard
              key={g.value}
              active={goal === g.value}
              onClick={() => setGoal(g.value)}
              label={g.label}
              emoji={g.emoji}
              variant="row"
            />
          ))}
        </div>
      ),
    },
    {
      title: 'What do you spend on?',
      sub: `Pick at least 3. (${picked.length} selected)`,
      content: (
        <div className="grid grid-cols-3 gap-2">
          {CATS.map((c) => (
            <PickerCard
              key={c}
              active={picked.includes(c)}
              onClick={() => togglePick(c)}
              label={c}
              variant="chip"
            />
          ))}
        </div>
      ),
    },
    {
      title: 'How loud should we be?',
      sub: 'You can change this anytime.',
      content: (
        <div className="space-y-2">
          {TONES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTone(t.value)}
              className={cn(
                'w-full text-left p-4 rounded-2xl border tap',
                tone === t.value
                  ? 'bg-brand-soft border-brand'
                  : 'bg-card border-line',
              )}
            >
              <div className="flex items-center gap-2 text-[15px] font-semibold">
                <span className="text-xl">{t.emoji}</span> {t.label}
              </div>
              <div className="text-sm text-soft mt-1">{t.body}</div>
            </button>
          ))}
        </div>
      ),
    },
  ]

  if (done) {
    return (
      <div className="min-h-screen md:min-h-[844px] flex flex-col items-center justify-center text-center px-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 16 }}
          className="h-20 w-20 rounded-full bg-brand text-white flex items-center justify-center mb-4"
        >
          <Check size={40} strokeWidth={3} />
        </motion.div>
        <h1 className="text-2xl font-semibold">You're set.</h1>
        <p className="text-sm text-soft mt-1">Loading your dashboard…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen md:min-h-[844px] flex flex-col px-5 pt-4 pb-6">
      {/* Top bar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={step === 0 ? () => navigate('/') : prev}
          className="h-10 w-10 rounded-full bg-card border border-line flex items-center justify-center tap"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 flex gap-1.5 px-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'flex-1 h-1 rounded-full transition-colors',
                idx <= step ? 'bg-brand' : 'bg-[var(--surface-2)]',
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            <h1 className="text-[26px] font-semibold tracking-tight">
              {steps[step].title}
            </h1>
            {steps[step].sub && (
              <p className="text-sm text-soft mt-1">{steps[step].sub}</p>
            )}
            <div className="mt-6">{steps[step].content}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      <Button
        size="lg"
        disabled={!canContinue}
        onClick={step === steps.length - 1 ? finish : next}
      >
        {step === steps.length - 1 ? "Let's go" : 'Continue'}
        <ArrowRight size={18} />
      </Button>
    </div>
  )
}

function PickerCard({
  active,
  onClick,
  label,
  emoji,
  variant = 'card',
}: {
  active: boolean
  onClick: () => void
  label: string
  emoji?: string
  variant?: 'card' | 'row' | 'chip'
}) {
  if (variant === 'chip') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'h-12 rounded-xl text-sm font-medium tap border',
          active
            ? 'bg-brand-soft border-brand text-[var(--color-brand-strong)]'
            : 'bg-card border-line text-ink',
        )}
      >
        {label}
      </button>
    )
  }
  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-full text-left p-4 rounded-2xl border tap flex items-center gap-3',
          active ? 'bg-brand-soft border-brand' : 'bg-card border-line',
        )}
      >
        {emoji && <span className="text-xl">{emoji}</span>}
        <span className="text-[15px] font-semibold">{label}</span>
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-20 rounded-2xl text-lg font-semibold tap border',
        active
          ? 'bg-brand-soft border-brand text-[var(--color-brand-strong)]'
          : 'bg-card border-line text-ink',
      )}
    >
      {label}
    </button>
  )
}
