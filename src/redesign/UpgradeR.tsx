import { useState } from 'react'
import { motion } from 'framer-motion'
import { Screen, SpringSheet, Glyph, type GlyphName } from './primitives'

const perks: [GlyphName, string, string][] = [
  ['spark', 'Unlimited Coach asks', 'free tier gets 5/week — Curb+ never cuts you off mid-question'],
  ['orb', 'Semester forecast', 'see your balance on any future date — spring break, finals, move-out'],
  ['receipt', 'Subscription audit', 'finds the trials you forgot. average student saves $14/mo'],
]

export default function UpgradeR() {
  const [open, setOpen] = useState(false)

  return (
    <Screen>
      <div className="flex flex-1 flex-col justify-center px-6">
        <h1 className="font-display text-3xl leading-tight text-white">
          Your money has patterns.
          <br />
          <span className="text-mint">Curb+ reads them.</span>
        </h1>

        {/* The glimpse: a real insight, genuinely blurred, lock floating on top */}
        <div className="relative mt-8">
          <div className="glass rounded-3xl p-5 select-none" aria-hidden>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mint">
              pattern
            </span>
            <p className="mt-2 text-[15px] leading-relaxed text-white blur-[7px]">
              You spend 2.3× more the night before an exam — $41 average. Your
              next one is Tuesday. Want a game plan that still includes snacks?
            </p>
            <p className="mt-2 text-sm text-mint blur-[5px]">+ 2 more insights about your week</p>
          </div>
          <motion.button
            onClick={() => setOpen(true)}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 18 }}
            className="glass-deep absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-glow"
          >
            <Glyph name="lock" className="h-4 w-4 text-mint" /> unlock with Curb+
          </motion.button>
        </div>

        <p className="mt-4 text-center text-sm text-fog">
          this insight is already waiting in your feed
        </p>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setOpen(true)}
          className="mt-8 w-full rounded-2xl bg-curb-green py-4 text-base font-semibold text-white shadow-glow"
        >
          See what Curb+ sees
        </motion.button>
        <button className="mt-3 py-2 text-sm font-medium text-fog">
          maybe later — keep the free stuff
        </button>
      </div>

      {/* The gate: a sheet, not a wall — easy in, easy out */}
      <SpringSheet open={open} onClose={() => setOpen(false)}>
        <h2 className="font-display text-2xl text-white">Curb+</h2>
        <p className="mt-1 text-sm text-mist">
          $3/mo — one fewer vending-machine run.
        </p>
        <ul className="mt-5 space-y-4">
          {perks.map(([icon, title, sub]) => (
            <li key={title} className="flex gap-3">
              <Glyph name={icon} className="mt-0.5 h-5 w-5 shrink-0 text-mint" />
              <div>
                <p className="text-[15px] font-semibold text-white">{title}</p>
                <p className="text-[13px] leading-snug text-mist">{sub}</p>
              </div>
            </li>
          ))}
        </ul>
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="mt-6 w-full rounded-2xl bg-curb-green py-4 text-base font-semibold text-white shadow-glow"
        >
          Try it free for 2 weeks
        </motion.button>
        <p className="mt-3 text-center text-xs text-fog">
          cancel in two taps. no guilt trip, promise.
        </p>
      </SpringSheet>
    </Screen>
  )
}
