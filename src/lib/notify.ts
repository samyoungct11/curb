import { toast } from 'sonner'
import { evaluateTransaction } from '@/lib/notificationEngine'
import { useAppStore } from '@/store/useAppStore'
import type { NotificationType, Transaction } from '@/lib/types'

const TYPE_TINT: Record<NotificationType, string> = {
  safe: 'var(--color-brand)',
  approaching: 'var(--color-warning)',
  at_limit: 'var(--color-warning)',
  over: 'var(--color-alert)',
  pattern: 'var(--color-warning)',
  trend: 'var(--color-warning)',
  positive: 'var(--color-brand)',
  no_spend: 'var(--color-brand)',
  impulse: 'var(--color-warning)',
  weekly_summary: 'var(--color-brand)',
  monthly_reset: 'var(--color-brand)',
  savings_milestone: 'var(--color-brand)',
}

/**
 * Add a transaction to the store AND trigger the notification engine.
 * Used for manual entries + the "Can I afford this?" log-this-purchase flow.
 */
export function logTransaction(txn: Transaction) {
  const store = useAppStore.getState()
  store.addTransaction(txn)
  // Read fresh state (with the new txn included)
  const fresh = useAppStore.getState()
  const notif = evaluateTransaction(txn, fresh)
  if (notif) {
    store.addNotification(notif)
    toast(notif.title, {
      description: notif.body,
      duration: 5000,
      style: {
        borderLeft: `4px solid ${TYPE_TINT[notif.type]}`,
      },
    })
  }
}
