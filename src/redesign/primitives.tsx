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

/* Hand-drawn-feel stroke glyphs — replaces emoji across the redesign.
   One path string each; rounded caps keep them expressive, not SaaS-y. */
const glyphs = {
  eye: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12M12 9.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2',
  bolt: 'M13 2 4.5 14H11l-1 8 8.5-12H12z',
  spark: 'M12 3l2.1 5.6L20 11l-5.9 2.4L12 19l-2.1-5.6L4 11l5.9-2.4z',
  flame:
    'M12 3c1.2 3 5 5.2 5 9a5 5 0 0 1-10 0c0-1.8.8-3.2 1.8-4.7.6 1.2 1.4 2 2.7 2.2C11.2 7.6 11.3 5.2 12 3',
  alert: 'M12 4 2.8 19.5h18.4zM12 10v4M12 16.8v.4',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  check: 'M5 12.5l4.5 4.5L19 7',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9h-13z',
  user: 'M12 12a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5',
  cake: 'M5 13h14v7H5zM5 16c1.5 1 3 0 4.5 0s3 1 4.5 0 3 0 4.5 0M12 7v3M11.2 4.6a.8.8 0 1 0 1.6 0 .8.8 0 0 0-1.6 0',
  food: 'M4 12h16M4 12a8 8 0 0 0 16 0M9 8v4m6-4v4',
  music:
    'M9 19V5l10-2v13M9 19a2.3 2.3 0 1 1-4.6 0 2.3 2.3 0 0 1 4.6 0M19 16a2.3 2.3 0 1 1-4.6 0 2.3 2.3 0 0 1 4.6 0',
  plane: 'M21 3 3 11l7 2 2 7zM10 13 21 3',
  bag: 'M6.5 8h11L16.3 21H7.7zM9 8V7a3 3 0 0 1 6 0v1',
  orb: 'M12 3.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13M8 20.5h8',
  receipt:
    'M6.5 3h11v18l-1.8-1.4L13.9 21l-1.9-1.4L10.1 21l-1.8-1.4L6.5 21zM9.5 8h5M9.5 12h5',
} as const

export type GlyphName = keyof typeof glyphs

export function Glyph({
  name,
  className = 'h-4 w-4',
}: {
  name: GlyphName
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={glyphs[name]} />
    </svg>
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
