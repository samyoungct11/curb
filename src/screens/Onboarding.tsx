import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { CurbLogo } from '@/components/CurbLogo'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/Button'
import {
  CATEGORY_DEFAULTS,
  ONBOARDING_CATEGORIES,
} from '@/lib/onboardingDefaults'
import type { AgeRange, PrimaryGoal, ToneMode } from '@/lib/types'
import { cn } from '@/lib/utils'

const AGES: { value: AgeRange; label: string }[] = [
  { value: '12-14', label: '12–14' },
  { value: '15-17', label: '15–17' },
  { value: '18-22', label: '18–22' },
  { value: '23-25', label: '23–25' },
]

const GOALS: { value: PrimaryGoal; label: string; icon: string }[] = [
  { value: 'spend_less',    label: 'Spend less',             icon: 'TrendingDown' },
  { value: 'save_for_goal', label: 'Save for something',     icon: 'Target' },
  { value: 'stop_impulse',  label: 'Stop impulse shopping',  icon: 'Hand' },
  { value: 'track_food',    label: 'Track food spending',    icon: 'UtensilsCrossed' },
  { value: 'stay_under',    label: 'Stay under budget',      icon: 'BarChart3' },
  { value: 'build_habits',  label: 'Build better habits',    icon: 'Sprout' },
]

const TONES: { value: ToneMode; label: string; icon: string; body: string }[] = [
  { value: 'strict',   label: 'Strict',   icon: 'Target', body: 'Ping me early, ping me often.' },
  { value: 'balanced', label: 'Balanced', icon: 'Equal',  body: 'Tell me when it matters.' },
  { value: 'chill',    label: 'Chill',    icon: 'Waves',  body: 'Just the big stuff.' },
]

export function Onboarding() {
  const navigate = useNavigate()
  const { completeOnboarding, loadDemo, user } = useAppStore()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [age, setAge] = useState<AgeRange>('18-22')
  const [income, setIncome] = useState('')
  const [student, setStudent] = useState<'yes' | 'no' | 'sometimes'>('yes')
  const [goal, setGoal] = useState<PrimaryGoal>('stay_under')
  const [picked, setPicked] = useState<string[]>([])
  const [tone, setTone] = useState<ToneMode>('balanced')
  const [done, setDone] = useState(false)

  const togglePick = (c: string) => {
    setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))
  }

  const next = () => setStep((s) => s + 1)
  const prev = () => setStep((s) => Math.max(0, s - 1))

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canContinue) {
      step === steps.length - 1 ? finish() : next()
    }
  }

  const steps = [
    {
      title: "What's your name?",
      sub: 'We use this to make things feel like yours.',
      content: (
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Your first name"
          enterKeyHint="next"
          autoComplete="given-name"
          className="w-full h-16 px-4 bg-card-2 rounded-2xl text-2xl font-semibold text-ink placeholder:text-soft focus:outline-none focus:ring-2 focus:ring-ink/20 tracking-tight"
        />
      ),
    },
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
          <div className="text-[11px] text-soft uppercase tracking-[0.16em] font-semibold mb-2">
            Per month
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-soft">
              $
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              onKeyDown={handleKey}
              placeholder="600"
              enterKeyHint="next"
              className="num display w-full h-16 pl-10 pr-3 bg-card-2 rounded-2xl text-3xl font-bold text-ink placeholder:text-soft focus:outline-none focus:ring-2 focus:ring-ink/20"
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
      title: "What's your main goal?",
      sub: 'Pick one. You can change it anytime.',
      content: (
        <div className="space-y-2">
          {GOALS.map((g) => (
            <PickerCard
              key={g.value}
              active={goal === g.value}
              onClick={() => setGoal(g.value)}
              label={g.label}
              icon={g.icon}
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
        <div className="grid grid-cols-3 gap-2.5">
          {ONBOARDING_CATEGORIES.map((c) => {
            const def = CATEGORY_DEFAULTS[c]
            const active = picked.includes(c)
            return (
              <button
                key={c}
                type="button"
                onClick={() => togglePick(c)}
                className={cn(
                  'h-[90px] rounded-2xl tap flex flex-col items-center justify-center gap-1.5 transition-all',
                  active
                    ? 'bg-ink text-white dark:bg-white dark:text-ink'
                    : 'bg-card-2 text-ink',
                )}
              >
                <Icon name={def?.icon ?? 'Layers'} size={20} strokeWidth={1.75} />
                <span className="text-[11px] font-semibold tracking-tight">{c}</span>
              </button>
            )
          })}
        </div>
      ),
    },
    {
      title: 'How loud should we be?',
      sub: 'You can change this anytime.',
      content: (
        <div className="space-y-2">
          {TONES.map((t) => {
            const active = tone === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTone(t.value)}
                className={cn(
                  'w-full text-left p-4 rounded-2xl tap transition-colors flex items-start gap-3',
                  active
                    ? 'bg-ink text-white dark:bg-white dark:text-ink'
                    : 'bg-card-2 text-ink',
                )}
              >
                <div
                  className={cn(
                    'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                    active
                      ? 'bg-white/10 dark:bg-ink/10'
                      : 'bg-card',
                  )}
                >
                  <Icon name={t.icon} size={18} strokeWidth={1.75} />
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-semibold tracking-tight">{t.label}</div>
                  <div className={cn('text-[13px] mt-0.5', active ? 'opacity-70' : 'text-soft')}>
                    {t.body}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      ),
    },
  ]

  const canContinue = useMemo(() => {
    if (step === 0) return name.trim().length > 0
    if (step === 2) return !!income && parseFloat(income) > 0
    if (step === 5) return picked.length >= 3
    return true
  }, [step, name, income, picked])

  const finish = () => {
    completeOnboarding({
      name: name.trim(),
      ageRange: age,
      monthlyIncome: parseFloat(income) || 0,
      isStudent: student === 'yes',
      primaryGoal: goal,
      notificationTone: tone,
      categories: picked,
    })
    setDone(true)
    setTimeout(() => navigate('/', { replace: true }), 1100)
  }

  if (done) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 16 }}
          className="h-16 w-16 rounded-full bg-ink text-white dark:bg-white dark:text-ink flex items-center justify-center mb-5"
        >
          <Check size={32} strokeWidth={2.5} />
        </motion.div>
        <h1 className="text-[26px] font-semibold tracking-tight">
          You're set, {name.trim() || 'friend'}.
        </h1>
        <p className="text-[13px] text-soft mt-1.5">Loading your dashboard…</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col px-5 pt-5 pb-6">
      <div className="flex justify-center mb-5">
        <CurbLogo size="sm" />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={
            step === 0
              ? () => (user ? navigate(-1) : null)
              : prev
          }
          className={cn(
            'h-10 w-10 rounded-full bg-card flex items-center justify-center tap shadow-[var(--shadow-card)]',
            step === 0 && !user && 'invisible',
          )}
          aria-label="Back"
        >
          <ArrowLeft size={17} strokeWidth={1.75} />
        </button>
        <div className="flex-1 flex gap-1.5 px-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'flex-1 h-1 rounded-full transition-colors',
                idx <= step ? 'bg-ink dark:bg-white' : 'bg-[var(--surface-2)]',
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col mt-7 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto"
          >
            <h1 className="text-[28px] font-semibold tracking-tight leading-tight">
              {steps[step].title}
            </h1>
            {steps[step].sub && (
              <p className="text-[13px] text-soft mt-2">{steps[step].sub}</p>
            )}
            <div className="mt-7 pb-4">{steps[step].content}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pt-3 space-y-2">
        <Button
          size="lg"
          disabled={!canContinue}
          onClick={step === steps.length - 1 ? finish : next}
        >
          {step === steps.length - 1 ? "Let's go" : 'Continue'}
          <ArrowRight size={17} strokeWidth={1.75} />
        </Button>
        {step === 0 && !user && (
          <button
            type="button"
            onClick={() => {
              loadDemo()
              navigate('/', { replace: true })
            }}
            className="w-full text-[12px] text-soft py-2 tap"
          >
            Or try the demo account
          </button>
        )}
      </div>
    </div>
  )
}

function PickerCard({
  active,
  onClick,
  label,
  icon,
  variant = 'card',
}: {
  active: boolean
  onClick: () => void
  label: string
  icon?: string
  variant?: 'card' | 'row'
}) {
  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-full text-left p-4 rounded-2xl tap flex items-center gap-3 transition-colors',
          active
            ? 'bg-ink text-white dark:bg-white dark:text-ink'
            : 'bg-card-2 text-ink',
        )}
      >
        {icon && (
          <div
            className={cn(
              'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
              active ? 'bg-white/10 dark:bg-ink/10' : 'bg-card',
            )}
          >
            <Icon name={icon} size={17} strokeWidth={1.75} />
          </div>
        )}
        <span className="text-[15px] font-semibold tracking-tight">{label}</span>
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-20 rounded-2xl text-lg font-semibold tap transition-colors tracking-tight',
        active
          ? 'bg-ink text-white dark:bg-white dark:text-ink'
          : 'bg-card-2 text-ink',
      )}
    >
      {label}
    </button>
  )
}
