import { cn } from '@/lib/utils'

interface Option<T extends string> {
  value: T
  label: string
  emoji?: string
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: Option<T>[]
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex p-1 rounded-2xl bg-[var(--surface-2)] gap-1',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 h-9 px-3 rounded-xl text-sm font-medium tap transition-colors',
              active
                ? 'bg-card text-ink shadow-sm'
                : 'text-soft hover:text-ink',
            )}
          >
            {opt.emoji && <span className="mr-1">{opt.emoji}</span>}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
