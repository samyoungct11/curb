import { motion } from 'framer-motion'
import { Screen } from './primitives'

/*
 * Curb's alert language. Three states, three jobs:
 *  - heads-up (warning):  early nudge, still fixable — friendly, zero shame
 *  - over (alert):        you crossed the line — direct, offers a way out
 *  - win (positive):      under budget — celebrate out loud
 * Semantic colors appear ONLY here, per the brand system.
 */
const alerts = [
  {
    state: 'heads-up',
    color: 'border-l-warning',
    chip: 'bg-warning/15 text-warning',
    emoji: '👀',
    title: 'heads up',
    body: 'You just spent $23 at Chipotle — that’s 80% of Food this week.',
    cta: 'Let’s look at this',
    time: 'now',
  },
  {
    state: 'over',
    color: 'border-l-alert',
    chip: 'bg-alert/15 text-alert',
    emoji: '🫠',
    title: 'food’s done for the week',
    body: 'You’re $12 over. Wanna borrow from Going out? You’ve got room there.',
    cta: 'Rebalance it',
    time: '2h',
  },
  {
    state: 'win',
    color: 'border-l-positive',
    chip: 'bg-positive/15 text-positive',
    emoji: '🔥',
    title: 'sunday wrap',
    body: 'You finished $18 under budget. That’s 3 weeks straight — new record.',
    cta: 'Keep it up →',
    time: 'sun',
  },
]

export default function AlertsR() {
  return (
    <Screen>
      <div className="flex-1 overflow-y-auto px-6 pb-10 no-scrollbar">
        <header className="pt-12">
          <h1 className="font-display text-4xl text-white">Heads up</h1>
          <p className="mt-2 text-mist">
            texts from a friend who’s good with money — not bank warnings
          </p>
        </header>

        <div className="mt-8 space-y-4">
          {alerts.map((a, i) => (
            <motion.article
              key={a.state}
              initial={{ x: 32, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.12, type: 'spring', stiffness: 220, damping: 24 }}
              className={`glass rounded-2xl border-l-2 p-5 ${a.color}`}
            >
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${a.chip}`}>
                  {a.emoji} {a.title}
                </span>
                <span className="text-xs text-fog">{a.time}</span>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-white">{a.body}</p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                className="mt-4 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white"
              >
                {a.cta}
              </motion.button>
            </motion.article>
          ))}
        </div>

        {/* Lock-screen preview — how it lands outside the app */}
        <section className="mt-10">
          <h2 className="font-display text-lg text-white">on your lock screen</h2>
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 22 }}
            className="glass mt-4 flex items-start gap-3 rounded-2xl p-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-curb-green font-display text-white shadow-glow">
              C
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold text-white">Curb</span>
                <span className="text-[11px] text-fog">now</span>
              </div>
              <p className="mt-0.5 text-[13px] leading-snug text-mist">
                You just spent $23 at Chipotle 👀 — you’ve hit 80% of your food
                budget. $9 left til Sunday.
              </p>
            </div>
          </motion.div>
          <p className="mt-3 text-xs text-fog">
            one line, the number that matters, and what’s left — never “budget
            threshold exceeded.”
          </p>
        </section>
      </div>
    </Screen>
  )
}
