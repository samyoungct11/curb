import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ChevronDown, Delete, Sparkles } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/Button'
import {
  categorySpentThisMonth,
  totalBudget,
  totalSpentThisMonth,
} from '@/lib/selectors'
import { cn, money } from '@/lib/utils'
import { logTransaction } from '@/lib/notify'
import type { Transaction } from '@/lib/types'

type Verdict = {
  status: 'green' | 'amber' | 'red'
  headline: string
  detail: string
  tradeoffs: { categoryName: string; cut: number }[]
}

export function AffordCheck() {
  const navigate = useNavigate()
  const { categories, transactions } = useAppStore()
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [verdict, setVerdict] = useState<Verdict | null>(null)

  const value = parseFloat(amount) || 0
  const category = categories.find((c) => c.id === categoryId)

  const calc = () => {
    if (!category || value <= 0) return
    const now = new Date()
    const spent = categorySpentThisMonth(transactions, category.id, now)
    const afterCat = spent + value
    const catRemaining = category.monthlyBudget - afterCat
    const totalAfter = totalSpentThisMonth(transactions, now) + value
    const totalLeft = totalBudget(categories) - totalAfter

    if (catRemaining >= 0) {
      setVerdict({
        status: 'green',
        headline: 'This fits.',
        detail: `You'll have ${money(catRemaining)} left in ${category.name} after this. ${money(totalLeft)} for the month overall.`,
        tradeoffs: [],
      })
      return
    }

    // Over the category budget — compute tradeoffs from other categories with most room
    const over = Math.abs(catRemaining)
    const otherRoom = categories
      .filter((c) => c.id !== category.id)
      .map((c) => ({
        name: c.name,
        room: Math.max(0, c.monthlyBudget - categorySpentThisMonth(transactions, c.id, now)),
      }))
      .sort((a, b) => b.room - a.room)

    const tradeoffs: { categoryName: string; cut: number }[] = []
    let needed = over
    for (const c of otherRoom) {
      if (needed <= 0) break
      const take = Math.min(c.room, needed)
      if (take > 0) {
        tradeoffs.push({ categoryName: c.name, cut: Math.round(take) })
        needed -= take
      }
    }

    if (totalLeft < 0) {
      setVerdict({
        status: 'red',
        headline: 'This breaks the month.',
        detail: `This puts ${category.name} ${money(over)} over and your total ${money(Math.abs(totalLeft))} over for the month.`,
        tradeoffs,
      })
    } else {
      setVerdict({
        status: 'amber',
        headline: 'Tight, but doable.',
        detail: `${category.name} would go ${money(over)} over. Here's how to fit it in:`,
        tradeoffs,
      })
    }
  }

  const reset = () => {
    setAmount('')
    setVerdict(null)
  }

  const handleKey = (k: string) => {
    if (verdict) return
    if (k === 'back') {
      setAmount((a) => a.slice(0, -1))
      return
    }
    if (k === '.' && amount.includes('.')) return
    if (amount.includes('.') && amount.split('.')[1]?.length >= 2) return
    setAmount((a) => (a === '0' && k !== '.' ? k : a + k))
  }

  const verdictStyles = useMemo(() => {
    if (!verdict) return null
    if (verdict.status === 'green')
      return { bg: 'bg-brand-soft', text: 'text-[var(--color-brand-strong)]', emoji: '✅' }
    if (verdict.status === 'amber')
      return { bg: 'bg-warning-soft', text: 'text-[#8a6a17]', emoji: '⚖️' }
    return { bg: 'bg-alert-soft', text: 'text-[#9b3338]', emoji: '🛑' }
  }, [verdict])

  return (
    <div className="flex flex-col min-h-screen md:min-h-[844px] px-5 pt-4 pb-6">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="h-10 w-10 rounded-full bg-card border border-line flex items-center justify-center tap"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[18px] font-semibold tracking-tight">Can I afford this?</h1>
      </header>

      {/* Amount display */}
      <div className="flex-1 flex flex-col items-center justify-center mt-6">
        <div className="text-soft text-xs uppercase tracking-wide font-medium mb-3">
          Amount
        </div>
        <div className="num text-[56px] font-semibold leading-none tracking-tight">
          ${amount || '0'}
        </div>

        {/* Category picker */}
        <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar max-w-full px-5 -mx-5">
          {categories.map((c) => {
            const active = c.id === categoryId
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCategoryId(c.id)
                  setVerdict(null)
                }}
                className={cn(
                  'shrink-0 h-10 px-3 rounded-full text-sm font-medium tap border inline-flex items-center gap-1.5',
                  active
                    ? 'bg-ink text-white border-ink'
                    : 'bg-card text-ink border-line',
                )}
              >
                <span>{c.emoji}</span>
                {c.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-2 mt-6">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => handleKey(k)}
            className="h-14 rounded-2xl bg-card border border-line text-xl font-medium tap flex items-center justify-center"
          >
            {k === 'back' ? <Delete size={20} /> : k}
          </button>
        ))}
      </div>

      <Button
        size="lg"
        className="mt-4"
        onClick={calc}
        disabled={value <= 0 || !!verdict}
      >
        <Sparkles size={18} />
        Check it
      </Button>

      {/* Verdict bottom sheet */}
      <AnimatePresence>
        {verdict && verdictStyles && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={reset}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[420px] bg-card rounded-t-3xl border border-line p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-[var(--shadow-lift)]"
            >
              <div className="flex justify-center -mt-2 mb-2">
                <div className="h-1 w-10 rounded-full bg-[var(--line)]" />
              </div>
              <div
                className={cn(
                  'rounded-2xl p-5 text-center',
                  verdictStyles.bg,
                )}
              >
                <div className="text-3xl mb-1">{verdictStyles.emoji}</div>
                <div className={cn('text-xl font-semibold', verdictStyles.text)}>
                  {verdict.headline}
                </div>
                <div className={cn('text-sm mt-2 leading-relaxed', verdictStyles.text, 'opacity-90')}>
                  {verdict.detail}
                </div>
              </div>

              {verdict.tradeoffs.length > 0 && (
                <Tradeoffs items={verdict.tradeoffs} />
              )}

              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button variant="secondary" size="md" onClick={reset}>
                  Maybe later
                </Button>
                <Button
                  size="md"
                  onClick={() => {
                    const txn: Transaction = {
                      id: crypto.randomUUID(),
                      merchant: 'Manual entry',
                      amount: value,
                      categoryId,
                      date: new Date().toISOString(),
                      isManual: true,
                    }
                    logTransaction(txn)
                    reset()
                    navigate('/transactions')
                  }}
                >
                  Log this purchase
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function Tradeoffs({ items }: { items: { categoryName: string; cut: number }[] }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mt-3 bg-card-2 rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 tap"
      >
        <span className="text-sm font-medium">How to make it work</span>
        <ChevronDown
          size={18}
          className={cn('transition-transform text-soft', open && 'rotate-180')}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ul className="px-4 pb-3 space-y-1.5">
              {items.map((t) => (
                <li
                  key={t.categoryName}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-soft">Cut from {t.categoryName}</span>
                  <span className="num font-semibold">−${t.cut}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
