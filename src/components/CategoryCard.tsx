import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Category } from '@/lib/types'
import { cn, money, statusColor } from '@/lib/utils'

interface CategoryCardProps {
  category: Category
  spent: number
  variant?: 'horizontal' | 'full'
  index?: number
}

const STATUS_STYLES = {
  green: { bar: 'bg-brand', tint: 'bg-brand-soft text-[var(--color-brand-strong)]' },
  amber: { bar: 'bg-warning', tint: 'bg-warning-soft text-[#8a6a17]' },
  red: { bar: 'bg-alert', tint: 'bg-alert-soft text-[#9b3338]' },
}

export function CategoryCard({
  category,
  spent,
  variant = 'horizontal',
  index = 0,
}: CategoryCardProps) {
  const pct = Math.min(1, spent / category.monthlyBudget)
  const status = statusColor(pct)
  const styles = STATUS_STYLES[status]
  const remaining = Math.max(0, category.monthlyBudget - spent)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={variant === 'horizontal' ? 'shrink-0 w-[148px]' : 'w-full'}
    >
      <Link
        to={`/category/${category.id}`}
        className={cn(
          'block bg-card border border-line rounded-2xl p-4 tap shadow-[var(--shadow-card)]',
          variant === 'full' && 'p-4',
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-2xl">{category.emoji}</div>
          <div
            className={cn(
              'text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full',
              styles.tint,
            )}
          >
            {Math.round(pct * 100)}%
          </div>
        </div>
        <div className="text-[13px] font-semibold text-ink truncate">
          {category.name}
        </div>
        <div className="num text-xs text-soft mt-0.5">
          {money(spent)} / {money(category.monthlyBudget)}
        </div>
        <div className="mt-2 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', styles.bar)}
            initial={{ width: 0 }}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 + index * 0.05 }}
          />
        </div>
        {variant === 'full' && (
          <div className="num text-[11px] text-soft mt-2">
            {money(remaining)} left
          </div>
        )}
      </Link>
    </motion.div>
  )
}
