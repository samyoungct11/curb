import { motion } from 'framer-motion'
import { Screen, Bar, BottomNav, Glyph } from './primitives'

const recent = [
  { merchant: 'Chipotle', when: 'today, 12:41', amt: '−$11.20', cat: 'Food' },
  { merchant: 'Trader Joe’s', when: 'yesterday', amt: '−$23.41', cat: 'Food' },
  { merchant: 'Spotify', when: 'Monday', amt: '−$5.99', cat: 'Subs' },
]

export default function HomeR() {
  return (
    <Screen>
      <div className="flex-1 overflow-y-auto px-6 pb-4 no-scrollbar">
        {/* Greeting — small, human, time-aware */}
        <header className="pt-12">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-fog">
            thursday · week 2 of june
          </p>
          <p className="mt-1 text-lg text-mist">hey Maya</p>
        </header>

        {/* Hero: the one number, taking up space confidently */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 160, damping: 18 }}
          className="mt-6"
        >
          <span className="font-display text-[5.5rem] leading-none text-white [text-shadow:0_0_40px_rgba(109,204,160,0.35)]">
            $47
          </span>
          <p className="mt-1 text-mist">left to spend this week</p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-curb-green/15 px-3 py-1 text-sm font-medium text-mint">
            you’re good ✦ on pace for Sunday
          </p>
        </motion.div>

        {/* Week progress — frosted card, asymmetric offset */}
        <div className="glass mt-8 rounded-3xl p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-mist">this week so far</span>
            <span className="font-display text-xl text-white">
              $89 <span className="text-sm text-fog">of $136</span>
            </span>
          </div>
          <div className="mt-3">
            <Bar pct={65} />
          </div>
        </div>

        {/* Heads-up — the one thing worth knowing right now */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="glass mt-4 flex w-full items-center gap-3 rounded-2xl border-l-2 border-l-warning p-4 text-left"
        >
          <Glyph name="eye" className="h-5 w-5 shrink-0 text-warning" />
          <span className="flex-1 text-sm leading-snug text-mist">
            Food’s at <span className="font-semibold text-white">80%</span> — $9
            left til Sunday
          </span>
          <span className="text-sm font-medium text-mint">look →</span>
        </motion.button>

        {/* Coach entry — invitation, not a chatbot bubble */}
        <button className="glass-deep mt-4 flex w-full items-center gap-3 rounded-2xl p-4 text-left">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-curb-green text-sm shadow-glow">
            ✦
          </span>
          <span className="text-sm text-mist">
            Ask Curb anything — <span className="text-white">“can I swing a concert ticket?”</span>
          </span>
        </button>

        {/* Recent — three rows max, never a spreadsheet */}
        <section className="mt-8">
          <h2 className="font-display text-lg text-white">just spent</h2>
          <ul className="mt-3 space-y-1">
            {recent.map((r) => (
              <li
                key={r.merchant}
                className="flex items-center justify-between rounded-xl px-2 py-3"
              >
                <div>
                  <p className="text-[15px] font-medium text-white">{r.merchant}</p>
                  <p className="text-xs text-fog">
                    {r.when} · {r.cat}
                  </p>
                </div>
                <span className="font-display text-lg text-mist">{r.amt}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Thumb-zone primary actions */}
        <div className="mt-6 flex gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="flex-1 rounded-2xl bg-curb-green py-4 text-[15px] font-semibold text-white shadow-glow"
          >
            Can I afford this?
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="glass rounded-2xl px-5 py-4 text-[15px] font-semibold text-mint"
          >
            + Add
          </motion.button>
        </div>
      </div>

      <BottomNav active="home" />
    </Screen>
  )
}
