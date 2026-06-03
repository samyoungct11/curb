/**
 * Local push notifications — surface Curb's real-time alerts as system
 * notifications (lock screen / notification center) instead of only in-app
 * toasts. Delivery is gated on two things:
 *   1. the user's opt-in preference (`pushEnabled` in the store), and
 *   2. the browser's Notification permission being `granted`.
 *
 * This uses the Notification API + the active service worker registration, so
 * it works while the app (or its installed PWA) is open or backgrounded.
 * Server-initiated push when the app is fully closed would additionally need
 * VAPID keys + a Web Push endpoint — a future extension on top of this.
 */

export type PushPermission = 'unsupported' | 'default' | 'granted' | 'denied'

/** Whether this browser can show notifications at all. */
export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/** Current permission state (or 'unsupported'). */
export function getPushPermission(): PushPermission {
  if (!pushSupported()) return 'unsupported'
  return Notification.permission as PushPermission
}

/**
 * Prompt the user for notification permission. Returns the resulting state.
 * Safe to call when already granted/denied — it just resolves immediately.
 */
export async function requestPushPermission(): Promise<PushPermission> {
  if (!pushSupported()) return 'unsupported'
  if (Notification.permission !== 'default') {
    return Notification.permission as PushPermission
  }
  try {
    const result = await Notification.requestPermission()
    return result as PushPermission
  } catch {
    return 'denied'
  }
}

interface ShowPushOptions {
  /** Collapses repeat alerts of the same kind into one (e.g. the notif type). */
  tag?: string
  /** Optional deep-link path opened when the notification is tapped. */
  url?: string
}

/**
 * Show a system notification. No-op unless permission is granted. Prefers the
 * service worker registration (required for installed PWAs / Android), and
 * falls back to a page-level Notification when no SW is registered (e.g. dev).
 */
export async function showPush(
  title: string,
  body: string,
  opts: ShowPushOptions = {},
): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== 'granted') return false

  const options: NotificationOptions & { tag?: string } = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    tag: opts.tag,
    data: { url: opts.url ?? '/inbox' },
  }

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.showNotification(title, options)
        return true
      }
    }
    // Fallback: page-level notification (no SW registered, e.g. dev mode).
    new Notification(title, options)
    return true
  } catch {
    return false
  }
}
