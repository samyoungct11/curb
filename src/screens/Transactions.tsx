import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { TransactionRow } from '@/components/TransactionRow'
import { Card } from '@/components/ui/Card'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { groupTransactionsByDate } from '@/lib/selectors'
import { logTransaction } from '@/lib/notify'
import type { Transaction } from '@/lib/types'

export function Transactions() {
  const { transactions, categories } = useAppStore()
  const [filter, setFilter] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]))
  const filtered = filter
    ? transactions.filter((t) => t.categoryId === filter)
    : transactions
  const groups = groupTransactionsByDate(filtered)

  return (
    <div className="px-5 pt-4 pb-24 space-y-4 relative">
      <header className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-tight">Activity</h1>
        <div className="flex gap-2">
          {filter && (
            <button
              type="button"
              onClick={() => setFilter(null)}
              className="text-xs px-3 h-9 rounded-full bg-card-2 text-soft tap"
            >
              Clear filter
            </button>
          )}
        </div>
      </header>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
        <button
          type="button"
          onClick={() => setFilter(null)}
          className={[
            'shrink-0 h-9 px-3 rounded-full text-xs font-medium tap border',
            !filter
              ? 'bg-ink text-white border-ink'
              : 'bg-card text-soft border-line',
          ].join(' ')}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={[
              'shrink-0 h-9 px-3 rounded-full text-xs font-medium tap border inline-flex items-center gap-1',
              filter === c.id
                ? 'bg-ink text-white border-ink'
                : 'bg-card text-ink border-line',
            ].join(' ')}
          >
            <span>{c.emoji}</span>
            {c.name}
          </button>
        ))}
      </div>

      {groups.length === 0 && (
        <Card className="text-center py-10">
          <div className="text-3xl mb-2">📭</div>
          <div className="text-[15px] font-semibold">Nothing here yet</div>
          <div className="text-sm text-soft mt-1">Tap + to log a transaction.</div>
        </Card>
      )}

      {groups.map((group) => (
        <section key={group.dateKey}>
          <div className="text-[11px] text-soft uppercase tracking-wide font-semibold px-1 mb-1.5">
            {group.label}
          </div>
          <Card className="py-1 divide-y divide-line">
            {group.items.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                category={categoryById[t.categoryId]}
              />
            ))}
          </Card>
        </section>
      ))}

      {/* FAB */}
      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="fixed bottom-[80px] right-5 z-30 md:absolute md:bottom-[80px] h-14 w-14 rounded-full bg-brand text-white shadow-[var(--shadow-lift)] flex items-center justify-center tap"
        aria-label="Add transaction"
      >
        <Plus size={26} />
      </button>

      <AddTransactionSheet open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}

function AddTransactionSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const categories = useAppStore((s) => s.categories)
  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')

  const reset = () => {
    setAmount('')
    setMerchant('')
    setCategoryId(categories[0]?.id ?? '')
  }

  const submit = () => {
    const value = parseFloat(amount)
    if (!Number.isFinite(value) || value <= 0 || !merchant.trim() || !categoryId) return
    const txn: Transaction = {
      id: crypto.randomUUID(),
      merchant: merchant.trim(),
      amount: value,
      categoryId,
      date: new Date().toISOString(),
      isManual: true,
    }
    logTransaction(txn)
    reset()
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
      title="Log a transaction"
      description="Add what you spent. We'll figure out the rest."
    >
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="num w-full h-12 pl-7 pr-3 bg-card-2 rounded-xl text-lg font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-soft font-medium uppercase tracking-wide">
            Merchant
          </label>
          <input
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. Chipotle"
            className="mt-1 w-full h-12 px-3 bg-card-2 rounded-xl text-[15px] text-ink focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div>
          <label className="text-xs text-soft font-medium uppercase tracking-wide">
            Category
          </label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {categories.map((c) => {
              const active = c.id === categoryId
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={[
                    'h-14 rounded-xl border tap text-xs font-medium flex flex-col items-center justify-center gap-1',
                    active
                      ? 'bg-brand-soft border-brand text-[var(--color-brand-strong)]'
                      : 'bg-card-2 border-transparent text-ink',
                  ].join(' ')}
                >
                  <span className="text-base">{c.emoji}</span>
                  {c.name}
                </button>
              )
            })}
          </div>
        </div>
        <Button size="lg" onClick={submit} className="mt-2">
          Log it
        </Button>
      </div>
    </Sheet>
  )
}
