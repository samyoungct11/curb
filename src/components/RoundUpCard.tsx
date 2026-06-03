import { PiggyBank } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { Card } from '@/components/ui/Card'
import { Switch } from '@/components/ui/Switch'
import { accruedRoundUps } from '@/lib/roundup'
import { cn, money } from '@/lib/utils'

const MULTIPLES = [1, 5] as const

export function RoundUpCard() {
  const { roundUp, goals, transactions, setRoundUpRule, sweepRoundUps } = useAppStore()

  // No goal to sweep into — round-ups need a destination.
  if (goals.length === 0) return null

  const enabled = roundUp?.enabled ?? false
  const multiple = roundUp?.multiple ?? 1
  const goalId = roundUp?.goalId ?? goals[0].id
  const goal = goals.find((g) => g.id === goalId) ?? goals[0]
  const accrued = accruedRoundUps(transactions, roundUp)

  const toggle = (v: boolean) =>
    setRoundUpRule({
      enabled: v,
      // Anchor accrual to "now" on enable so only future spends count.
      since: new Date().toISOString(),
      goalId,
    })

  const sweep = () => {
    sweepRoundUps()
    toast.success(`Swept ${money(accrued)} into ${goal.name}`)
  }

  return (
    <Card className="py-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
          <PiggyBank size={18} strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-semibold tracking-tight">Round-ups</div>
          <div className="text-[12px] text-soft leading-tight">
            Round each spend to the next ${multiple} into {goal.name}.
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={toggle} />
      </div>

      {enabled && (
        <div className="mt-4 pt-4 border-t border-line space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-soft uppercase tracking-[0.14em] font-semibold">
              Round to
            </span>
            <div className="flex gap-1.5">
              {MULTIPLES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRoundUpRule({ multiple: m })}
                  className={cn(
                    'h-8 px-3.5 rounded-full text-[13px] font-semibold tap transition-colors',
                    multiple === m
                      ? 'bg-brand text-white'
                      : 'bg-card-2 text-soft',
                  )}
                >
                  ${m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="text-[11px] text-soft uppercase tracking-[0.14em] font-semibold">
                Pending
              </div>
              <div className="num display text-[28px] font-bold leading-none mt-1">
                {money(accrued)}
              </div>
            </div>
            <button
              type="button"
              onClick={sweep}
              disabled={accrued <= 0}
              className="h-10 px-4 rounded-xl bg-ink dark:bg-white text-white dark:text-ink text-[13px] font-semibold tap disabled:opacity-40"
            >
              Add to {goal.name}
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
