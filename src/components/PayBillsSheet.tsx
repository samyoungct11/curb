import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import type { Bill, PayFrequency } from '@/lib/types'
import { uid } from '@/lib/utils'

interface PayBillsSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

const inputClass =
  'w-full bg-card-2 rounded-xl px-3.5 py-2.5 text-[14px] text-ink placeholder:text-soft num outline-none focus:ring-2 focus:ring-[var(--color-brand)]'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function PayBillsSheet({ open, onOpenChange }: PayBillsSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Payday & bills"
      description="So Curb knows what's truly safe to spend before your next paycheck."
    >
      {/* Mounted only while the sheet is open, so the form always seeds from
          the latest store values without a setState-in-effect. */}
      <PayBillsForm onDone={() => onOpenChange(false)} />
    </Sheet>
  )
}

function PayBillsForm({ onDone }: { onDone: () => void }) {
  const { payProfile, bills, setPayProfile, upsertBill, removeBill } = useAppStore()

  const [frequency, setFrequency] = useState<PayFrequency>(
    payProfile?.frequency ?? 'biweekly',
  )
  const [anchorDate, setAnchorDate] = useState<string>(
    payProfile?.anchorDate?.slice(0, 10) ?? todayISO(),
  )
  const [savings, setSavings] = useState<string>(
    payProfile?.monthlySavingsTarget ? String(payProfile.monthlySavingsTarget) : '',
  )
  const [draftBills, setDraftBills] = useState<Bill[]>(() =>
    bills.map((b) => ({ ...b })),
  )

  function updateBill(id: string, patch: Partial<Bill>) {
    setDraftBills((list) => list.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }

  function addBill() {
    setDraftBills((list) => [...list, { id: uid(), name: '', amount: 0, dueDay: 1 }])
  }

  function save() {
    setPayProfile({
      frequency,
      anchorDate: new Date(`${anchorDate}T00:00:00`).toISOString(),
      monthlySavingsTarget: savings ? Math.max(0, Number(savings)) : undefined,
    })

    // Reconcile bills: drop removed/blank rows, keep only valid ones.
    const kept = draftBills.filter((b) => b.name.trim() && b.amount > 0)
    const keptIds = new Set(kept.map((b) => b.id))
    for (const b of bills) {
      if (!keptIds.has(b.id)) removeBill(b.id)
    }
    for (const b of kept) {
      upsertBill({
        ...b,
        name: b.name.trim(),
        amount: Math.max(0, Number(b.amount)),
        dueDay: Math.min(31, Math.max(1, Math.round(Number(b.dueDay)) || 1)),
      })
    }

    onDone()
  }

  return (
    <>
      <div className="space-y-5 max-h-[68vh] overflow-y-auto no-scrollbar -mx-1 px-1">
        {/* Pay frequency */}
        <div>
          <Label>How often are you paid?</Label>
          <Segmented<PayFrequency>
            value={frequency}
            onChange={setFrequency}
            options={[
              { value: 'weekly', label: 'Weekly' },
              { value: 'biweekly', label: '2 wks' },
              { value: 'semimonthly', label: 'Twice' },
              { value: 'monthly', label: 'Monthly' },
            ]}
            className="w-full"
          />
        </div>

        {/* Last payday */}
        <div>
          <Label>{frequency === 'semimonthly' ? 'Pay dates' : 'Your last payday'}</Label>
          {frequency === 'semimonthly' ? (
            <p className="text-[12px] text-soft">
              Paid on the 1st and 15th of each month.
            </p>
          ) : (
            <input
              type="date"
              value={anchorDate}
              max={todayISO()}
              onChange={(e) => setAnchorDate(e.target.value)}
              className={inputClass}
            />
          )}
        </div>

        {/* Savings target */}
        <div>
          <Label>Monthly savings target (optional)</Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soft text-[14px]">
              $
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={savings}
              placeholder="0"
              min={0}
              onChange={(e) => setSavings(e.target.value)}
              className={`${inputClass} pl-7`}
            />
          </div>
          <p className="text-[11px] text-soft mt-1.5">
            Set aside before money counts as spendable.
          </p>
        </div>

        {/* Bills */}
        <div>
          <Label>Recurring bills</Label>
          <div className="space-y-2">
            {draftBills.length === 0 && (
              <p className="text-[12px] text-soft">
                No bills yet — add anything due between paychecks (phone, transit pass…).
              </p>
            )}
            {draftBills.map((b) => (
              <div key={b.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={b.name}
                  placeholder="Name"
                  onChange={(e) => updateBill(b.id, { name: e.target.value })}
                  className={`${inputClass} flex-1`}
                />
                <div className="relative w-[84px]">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-soft text-[13px]">
                    $
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={b.amount || ''}
                    placeholder="0"
                    min={0}
                    onChange={(e) => updateBill(b.id, { amount: Number(e.target.value) })}
                    className={`${inputClass} pl-5 pr-2`}
                  />
                </div>
                <div className="w-[64px]">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={b.dueDay || ''}
                    placeholder="Day"
                    min={1}
                    max={31}
                    onChange={(e) => updateBill(b.id, { dueDay: Number(e.target.value) })}
                    className={`${inputClass} text-center px-1`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setDraftBills((l) => l.filter((x) => x.id !== b.id))}
                  className="h-9 w-9 shrink-0 rounded-xl bg-card-2 text-soft flex items-center justify-center tap"
                  aria-label="Remove bill"
                >
                  <Trash2 size={15} strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addBill}
            className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink tap"
          >
            <Plus size={15} strokeWidth={2} />
            Add a bill
          </button>
        </div>
      </div>

      <Button size="lg" className="mt-5" onClick={save}>
        Save
      </Button>
    </>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] text-soft uppercase tracking-[0.16em] font-semibold mb-2">
      {children}
    </div>
  )
}
