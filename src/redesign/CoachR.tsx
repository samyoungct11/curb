import { motion } from 'framer-motion'
import { Screen, BottomNav, Glyph } from './primitives'

/** 12 burrito runs this month — one dot per trip, so the habit is visible. */
function TripDots() {
  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 12 }, (_, t) => (
          <motion.span
            key={t}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + t * 0.04, type: 'spring', stiffness: 300, damping: 18 }}
            className="h-2.5 w-2.5 rounded-full bg-mint/70"
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-fog">12 trips in june · ~$7.85 each</p>

      {/* The trade-off, drawn instead of described */}
      <div className="mt-4 space-y-2.5">
        <div>
          <div className="flex justify-between text-[11px]">
            <span className="text-mist">burrito runs</span>
            <span className="font-semibold text-white">$94</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-white/35"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 60, damping: 18 }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[11px]">
            <span className="text-mist">a concert ticket</span>
            <span className="font-semibold text-mint">$89</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-curb-green to-mint"
              initial={{ width: 0 }}
              animate={{ width: '94%' }}
              transition={{ delay: 0.65, type: 'spring', stiffness: 60, damping: 18 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Three closed weeks, one in progress — the streak you can see. */
function StreakTrack() {
  return (
    <div className="mt-4 flex items-center gap-4">
      {['w1', 'w2', 'w3'].map((w, n) => (
        <div key={w} className="flex flex-col items-center gap-1.5">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + n * 0.12, type: 'spring', stiffness: 260, damping: 16 }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-curb-green/25 text-mint"
          >
            <Glyph name="check" className="h-4.5 w-4.5" />
          </motion.span>
          <span className="text-[10px] text-fog">{w}</span>
        </div>
      ))}
      <div className="flex flex-col items-center gap-1.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-mint/50 text-[11px] font-semibold text-mint">
          $47
        </span>
        <span className="text-[10px] text-mint">this wk</span>
      </div>
      <p className="ml-1 flex-1 text-[11px] leading-snug text-fog">
        finish under and it’s 4 — your record
      </p>
    </div>
  )
}

/** Where the month is headed: solid = spent so far, dashed = projection. */
function ForecastLine() {
  return (
    <div className="mt-4">
      <svg viewBox="0 0 260 64" className="w-full">
        <path
          d="M6 10 C 60 20, 110 28, 150 36"
          fill="none"
          stroke="var(--color-mint)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M150 36 C 190 42, 224 46, 248 49"
          fill="none"
          stroke="var(--color-fog)"
          strokeWidth="2"
          strokeDasharray="5 5"
          strokeLinecap="round"
        />
        <circle cx="150" cy="36" r="3.5" fill="var(--color-mint)" />
        <circle cx="248" cy="49" r="4" fill="none" stroke="var(--color-mint)" strokeWidth="2" />
      </svg>
      <div className="flex justify-between text-[10px]">
        <span className="text-fog">jun 1</span>
        <span className="font-semibold text-mint">today</span>
        <span className="text-mist">jun 30 · $61 left</span>
      </div>
    </div>
  )
}

const feed = [
  {
    tag: 'pattern',
    body: 'Your Chipotle habit is running $94/mo. Meal-prepping Sundays would cover a concert ticket every month. Just saying.',
    cta: 'Show me the math',
    visual: <TripDots />,
  },
  {
    tag: 'streak',
    body: 'You’ve come in under budget 3 weeks straight — your longest run yet. Whatever you’re doing, it’s working.',
    cta: 'Keep the streak →',
    visual: <StreakTrack />,
  },
  {
    tag: 'forecast',
    body: 'At this pace you’ll end June with $61 to spare. Want me to park it in your Spring Break goal automatically?',
    cta: 'Move it',
    visual: <ForecastLine />,
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

        {/* Insight feed — every claim comes with the picture that proves it */}
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
              {f.visual}
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
          <Glyph name="spark" className="h-4 w-4 text-mint" />
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
