import { motion } from 'framer-motion'
import { Screen, Bar, BottomNav, Glyph, type GlyphName } from './primitives'

const cats: {
  name: string
  icon: GlyphName
  spent: number
  cap: number
  note: string
  tone: 'brand' | 'warning'
}[] = [
  { name: 'Food', icon: 'food', spent: 128, cap: 160, note: 'heads up — $32 for 10 more days', tone: 'warning' },
  { name: 'Going out', icon: 'music', spent: 58, cap: 80, note: 'you’re good — one more night out fits', tone: 'brand' },
  { name: 'Transport', icon: 'plane', spent: 22, cap: 40, note: 'cruising. barely touched it', tone: 'brand' },
  { name: 'Shopping', icon: 'bag', spent: 48, cap: 60, note: 'one impulse buy from the line', tone: 'warning' },
]

// Mon–Sun relative spend, for the weekly rhythm strip
const week = [0.35, 0.2, 0.5, 0.3, 1, 0.85, 0.45]
const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function SpendingR() {
  return (
    <Screen>
      <div className="flex-1 overflow-y-auto pb-4 no-scrollbar">
        <header className="px-6 pt-12">
          <h1 className="font-display text-4xl text-white">Where it went</h1>
          <p className="mt-2 text-mist">
            <span className="font-display text-2xl text-white">$312</span> this
            month — $74 less than May.{' '}
            <span className="text-mint">lowkey impressive.</span>
          </p>
        </header>

        {/* Swipeable category cards — snap-scroll, one in focus at a time */}
        <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 no-scrollbar">
          {cats.map((c, idx) => {
            const pct = Math.round((c.spent / c.cap) * 100)
            return (
              <motion.div
                key={c.name}
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.07, type: 'spring', stiffness: 200, damping: 22 }}
                whileTap={{ scale: 0.97 }}
                className="glass w-[76%] shrink-0 snap-center rounded-3xl p-6"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-curb-green/15 text-mint">
                    <Glyph name={c.icon} className="h-6 w-6" />
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      c.tone === 'warning'
                        ? 'bg-warning/15 text-warning'
                        : 'bg-curb-green/15 text-mint'
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
                <p className="mt-4 text-sm text-mist">{c.name}</p>
                <p className="font-display text-4xl text-white">
                  ${c.spent}
                  <span className="text-lg text-fog"> / ${c.cap}</span>
                </p>
                <div className="mt-4">
                  <Bar pct={pct} tone={c.tone} />
                </div>
                <p className="mt-3 text-[13px] leading-snug text-mist">{c.note}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Weekly rhythm — your spending heartbeat, not a spreadsheet */}
        <section className="mt-10 px-6">
          <h2 className="font-display text-lg text-white">your week, at a glance</h2>
          <p className="mt-1 text-sm text-fog">fridays are your spendy day. no judgment.</p>
          <div className="glass mt-4 flex items-end justify-between gap-2 rounded-3xl p-5 pt-8">
            {week.map((h, d) => (
              <div key={d} className="flex flex-1 flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h * 72}px` }}
                  transition={{ delay: 0.3 + d * 0.05, type: 'spring', stiffness: 140, damping: 18 }}
                  className={`w-full max-w-7 rounded-full ${
                    h >= 0.9 ? 'bg-mint shadow-glow' : 'bg-curb-green/40'
                  }`}
                />
                <span className="text-[10px] font-medium text-fog">{days[d]}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <BottomNav active="spend" />
    </Screen>
  )
}
