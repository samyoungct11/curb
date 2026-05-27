import { format } from 'date-fns'
import type { Category, Transaction } from '@/lib/types'
import { money } from '@/lib/utils'

interface TransactionRowProps {
  transaction: Transaction
  category?: Category
  onClick?: () => void
  showTime?: boolean
}

export function TransactionRow({
  transaction,
  category,
  onClick,
  showTime = true,
}: TransactionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 tap text-left"
    >
      <div className="h-10 w-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-lg shrink-0">
        {category?.emoji ?? '💸'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-ink truncate">
          {transaction.merchant}
        </div>
        <div className="text-xs text-soft">
          {category?.name ?? 'Uncategorized'}
          {showTime && ` · ${format(new Date(transaction.date), 'h:mm a')}`}
        </div>
      </div>
      <div className="num text-[15px] font-semibold text-ink">
        {money(transaction.amount)}
      </div>
    </button>
  )
}
