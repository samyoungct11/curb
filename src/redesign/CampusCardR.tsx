import { motion } from 'framer-motion'
import { Screen, Bar, BottomNav, Glyph } from './primitives'

export default function CampusCardR() {
  return (
    <Screen>
      <div className="flex-1 overflow-y-auto px-6 pb-4 no-scrollbar">
        <header className="pt-12">
          <h1 className="font-display text-4xl text-white">Campus card</h1>
          <p className="mt-2 text-mist">your meal plan, decoded</p>
        </header>

        {/* The card itself — tilted, glowing, feels like an object you own */}
        <motion.div
          initial={{ rotate: -3, y: 24, opacity: 0 }}
          animate={{ rotate: -2, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 160, damping: 18 }}
          className="mt-8 rounded-3xl bg-gradient-to-br from-curb-green via-curb-deep to-night-3 p-6 shadow-glow"
        >
          <div className="flex items-start justify-between">
            <span className="font-display text-lg text-white">State U</span>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              dining
            </span>
          </div>
          <p className="mt-8 font-display text-5xl text-white">$214</p>
          <p className="text-sm text-white/70">dining dollars left</p>
          <div className="mt-6 flex items-end justify-between">
            <span className="text-sm font-medium text-white/80">Maya R.</span>
            <span className="text-xs text-white/50">•••• 8842</span>
          </div>
        </motion.div>

        {/* Burn rate — the forecast nobody else gives you */}
        <div className="glass mt-6 rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-white">burn rate</h2>
            <Glyph name="flame" className="h-6 w-6 text-warning" />
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-mist">
            At your pace, dining dollars run out{' '}
            <span className="font-semibold text-white">Aug 2</span> — two weeks
            before the semester ends.
          </p>
          <div className="mt-4">
            <Bar pct={72} tone="warning" />
          </div>
          <p className="mt-3 text-sm text-mint">
            tiny course-correct: keep it under $4.10/day and you coast to the finish.
          </p>
        </div>

        {/* Swipe math — the actual superpower */}
        <div className="glass-deep mt-4 rounded-3xl p-5">
          <h2 className="font-display text-lg text-white">swipe math ✦</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-mist">
            You’ve got <span className="font-semibold text-white">23 meal swipes</span>{' '}
            and each one is worth{' '}
            <span className="font-semibold text-white">≈ $9.40</span>. Swipes
            expire — dollars don’t. Burn the swipes first.
          </p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            className="mt-4 w-full rounded-2xl bg-curb-green py-3.5 text-sm font-semibold text-white shadow-glow"
          >
            Where can I swipe right now? →
          </motion.button>
        </div>

        <p className="mt-5 text-center text-xs text-fog">
          balances sync from your campus portal nightly
        </p>
      </div>

      <BottomNav active="card" />
    </Screen>
  )
}
