import { motion } from 'framer-motion'
import { Screen, BottomNav } from './primitives'

const feed = [
  {
    tag: 'pattern',
    body: 'Your Chipotle habit is running $94/mo. Meal-prepping Sundays would cover a concert ticket every month. Just saying. 🎟️',
    cta: 'Show me the math',
  },
  {
    tag: 'streak',
    body: 'You’ve come in under budget 3 weeks straight — your longest run yet. Whatever you’re doing, it’s working.',
    cta: 'Keep the streak →',
  },
  {
    tag: 'forecast',
    body: 'At this pace you’ll end June with $61 to spare. Want me to park it in your Spring Break goal automatically?',
    cta: 'Move it',
  },
]

export default function CoachR() {
  return (
    <Screen>
      <div className="flex-1 overflow-y-auto px-6 pb-4 no-scrollbar">
        <header className="pt-12">
          <h1 className="font-display text-4xl text-white">Coach</h1>
          <p className="mt-2 text-mist">what your money’s been telling me</p>
        </header>

        {/* Insight feed — cards that read like a sharp friend, not chat bubbles */}
        <div className="mt-8 space-y-4">
          {feed.map((f, i) => (
            <motion.article
              key={f.tag}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 22 }}
              className={`rounded-3xl p-5 ${i === 0 ? 'glass-deep shadow-glow' : 'glass'}`}
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mint">
                {f.tag}
              </span>
              <p className="mt-2 text-[15px] leading-relaxed text-white">{f.body}</p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                className="mt-4 rounded-full bg-curb-green/20 px-4 py-2 text-sm font-semibold text-mint"
              >
                {f.cta}
              </motion.button>
            </motion.article>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-fog">
          new insights drop as you spend — pull to refresh
        </p>
      </div>

      {/* Ask-anything bar — pinned to the thumb zone, above the nav */}
      <div className="px-6 pb-2">
        <div className="glass-deep flex items-center gap-3 rounded-2xl p-2 pl-4">
          <span className="text-mint">✦</span>
          <input
            placeholder="ask anything — “can I swing spring break?”"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-fog"
          />
          <motion.button
            whileTap={{ scale: 0.92 }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-curb-green text-white shadow-glow"
            aria-label="Ask Curb"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h13M13 6l6 6-6 6" />
            </svg>
          </motion.button>
        </div>
      </div>

      <BottomNav active="coach" />
    </Screen>
  )
}
