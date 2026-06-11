import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/** Full-bleed mobile screen on the night palette. */
export function Screen({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-night font-sans text-white ${className}`}
    >
      {children}
    </div>
  )
}

/** Spending bar — springs in from zero so progress feels like a moment. */
export function Bar({
  pct,
  tone = 'brand',
}: {
  pct: number
  tone?: 'brand' | 'warning' | 'alert'
}) {
  const fill =
    tone === 'alert'
      ? 'bg-alert'
      : tone === 'warning'
        ? 'bg-warning'
        : 'bg-gradient-to-r from-curb-green to-mint'
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <motion.div
        className={`h-full rounded-full ${fill}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ type: 'spring', stiffness: 60, damping: 18 }}
      />
    </div>
  )
}

/** Slide-up bottom sheet with spring physics + scrim. */
export function SpringSheet({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="absolute inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="glass-deep absolute inset-x-0 bottom-0 z-50 rounded-t-[2rem] p-6 pb-10 shadow-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/25" />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

const tabs = [
  { id: 'home', label: 'Home', d: 'M4 11.5 12 4l8 7.5M6 10v9h12v-9' },
  { id: 'spend', label: 'Spending', d: 'M4 19V9m5.5 10V5m5.5 14v-7m5 7V11' },
  { id: 'coach', label: 'Coach', d: 'M12 3l2.1 5.6L20 11l-5.9 2.4L12 19l-2.1-5.6L4 11l5.9-2.4z' },
  { id: 'card', label: 'Card', d: 'M3 8.5h18M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM6 15h5' },
] as const

export type TabId = (typeof tabs)[number]['id']

/** Bottom nav — thumb-zone anchor shared by the main screens. */
export function BottomNav({ active }: { active: TabId }) {
  return (
    <nav className="glass sticky bottom-0 z-30 mx-4 mb-4 flex items-center justify-around rounded-3xl px-2 py-3">
      {tabs.map((t) => {
        const on = t.id === active
        return (
          <button
            key={t.id}
            className={`flex flex-col items-center gap-1 px-3 transition-colors ${on ? 'text-mint' : 'text-fog'}`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={t.d} />
            </svg>
            <span className="text-[10px] font-medium tracking-wide">{t.label}</span>
            {on && (
              <motion.span
                layoutId="nav-dot"
                className="h-1 w-1 rounded-full bg-mint shadow-glow"
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
