import clsx, { type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Compose Tailwind classes safely (clsx + tailwind-merge). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a number as money. Drops cents when whole. */
export function money(n: number): string {
  const abs = Math.abs(n)
  const formatted = abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(2)
  return `${n < 0 ? '−' : ''}$${formatted}`
}

/** Signed money for deltas, e.g. "+$12" or "−$18". */
export function signedMoney(n: number): string {
  if (n === 0) return '$0'
  const sign = n > 0 ? '+' : '−'
  const abs = Math.abs(n)
  const formatted = abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(2)
  return `${sign}$${formatted}`
}

/** Clamp a number between min and max. */
export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

/** Return the status color for a budget percentage (0-1). */
export function statusColor(pct: number): 'green' | 'amber' | 'red' {
  if (pct >= 1) return 'red'
  if (pct >= 0.7) return 'amber'
  return 'green'
}
