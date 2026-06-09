import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { TransactionRow } from '@/components/TransactionRow'
import { Card } from '@/components/ui/Card'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/Icon'
import { groupTransactionsByDate } from '@/lib/selectors'
import { uid } from '@/lib/utils'
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
    <div className="px-5 pt-5 pb-24 space-y-4 relative">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-[28px] tracking-tight">Activity</h1>
        {filter && (
          <button
            type="button"
            onClick={() => setFilter(null)}
            className="text-[12px] px-3 h-9 rounded-full bg-card-2 text-soft tap font-medium"
          >
            Clear filter
          </button>
        )}
      </header>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
        <button
          type="button"
          onClick={() => setFilter(null)}
          className={[
            'shrink-0 h-9 px-3.5 rounded-full text-[12px] font-semibold tap',
            !filter
              ? 'bg-ink text-white dark:bg-white dark:text-ink'
              : 'bg-card-2 text-ink',
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
              'shrink-0 h-9 px-3.5 rounded-full text-[12px] font-semibold tap inline-flex items-center gap-1.5',
              filter === c.id
                ? 'bg-ink text-white dark:bg-white dark:text-ink'
                : 'bg-card-2 text-ink',
            ].join(' ')}
          >
            <Icon name={c.icon} size={13} strokeWidth={1.75} />
            {c.name}
          </button>
        ))}
      </div>

      {groups.length === 0 && (
        <Card className="text-center py-10">
          <div className="text-[15px] font-semibold tracking-tight">Nothing here yet</div>
          <div className="text-[13px] text-soft mt-1">Tap + to log a transaction.</div>
        </Card>
      )}

      {groups.map((group) => (
        <section key={group.dateKey}>
          <div className="text-[11px] text-soft uppercase tracking-[0.16em] font-semibold px-1 mb-1.5">
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

      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="fixed bottom-[80px] right-5 z-30 md:absolute md:bottom-[80px] h-14 w-14 rounded-full bg-ink dark:bg-white text-white dark:text-ink shadow-[var(--shadow-lift)] flex items-center justify-center tap"
        aria-label="Add transaction"
      >
        <Plus size={22} strokeWidth={1.75} />
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
      id: uid(),
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
          <label className="text-[11px] text-soft uppercase tracking-[0.16em] font-semibold">
            Amount
          </label>
          <div className="relative mt-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-soft">$</span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="num w-full h-12 pl-7 pr-3 bg-card-2 rounded-xl text-lg font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
            />
          </div>
        </div>
        <div>
          <label className="text-[11px] text-soft uppercase tracking-[0.16em] font-semibold">
            Merchant
          </label>
          <input
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. Chipotle"
            className="mt-2 w-full h-12 px-3 bg-card-2 rounded-xl text-[14px] font-medium text-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
          />
        </div>
        <div>
          <label className="text-[11px] text-soft uppercase tracking-[0.16em] font-semibold">
            Category
          </label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {categories.map((c) => {
              const active = c.id === categoryId
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={[
                    'h-16 rounded-xl tap text-[11px] font-semibold flex flex-col items-center justify-center gap-1.5',
                    active
                      ? 'bg-ink text-white dark:bg-white dark:text-ink'
                      : 'bg-card-2 text-ink',
                  ].join(' ')}
                >
                  <Icon name={c.icon} size={16} strokeWidth={1.75} />
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
