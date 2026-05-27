import * as RxSwitch from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

export function Switch({
  checked,
  onCheckedChange,
  className,
}: {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  className?: string
}) {
  return (
    <RxSwitch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors',
        'bg-[var(--surface-2)] data-[state=checked]:bg-brand',
        className,
      )}
    >
      <RxSwitch.Thumb className="block h-5 w-5 rounded-full bg-white shadow translate-x-1 data-[state=checked]:translate-x-6 transition-transform" />
    </RxSwitch.Root>
  )
}
