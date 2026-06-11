import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Screen } from './primitives'

const slides = [
  {
    art: 'orb',
    h: 'Money, minus the mystery.',
    sub: 'Every dollar you can actually spend — today, this week, this semester. One number, always honest.',
  },
  {
    art: 'ping',
    h: 'Heads up, before it hurts.',
    sub: 'Curb nudges you the moment a spend knocks you off track. Like a text from a friend who’s scary good with money.',
  },
  {
    art: 'bolt',
    h: 'Set up in 60 seconds.',
    sub: 'Connect your bank, pick your weekly vibe, done. Bank-grade encryption — your data is yours, full stop.',
  },
]

function SlideArt({ kind }: { kind: string }) {
  return (
    <div className="relative h-56 w-full">
      {/* Glowing brand orb — abstract, not a stock illustration */}
      <motion.div
        key={kind}
        className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-curb-green/50 blur-3xl"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
      />
      <motion.div
        className="glass absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[2.5rem] shadow-glow"
        initial={{ rotate: -8, y: 16, opacity: 0 }}
        animate={{ rotate: kind === 'ping' ? 4 : -4, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <span className="font-display text-6xl text-mint">
          {kind === 'orb' ? '$' : kind === 'ping' ? '👀' : '⚡'}
        </span>
      </motion.div>
    </div>
  )
}

export default function OnboardingR() {
  const [i, setI] = useState(0)
  const last = i === slides.length - 1

  return (
    <Screen>
      {/* Skip stays reachable but quiet */}
      <div className="flex justify-end p-6">
        {!last && (
          <button className="text-sm font-medium text-fog">Skip</button>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ x: 48, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -48, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <SlideArt kind={slides[i].art} />
            <h1 className="mt-10 font-display text-[2.6rem] leading-[1.05] text-white">
              {slides[i].h}
            </h1>
            <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-mist">
              {slides[i].sub}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Thumb zone: dots + CTA */}
      <div className="px-8 pb-12">
        <div className="mb-6 flex gap-2">
          {slides.map((_, d) => (
            <motion.span
              key={d}
              animate={{ width: d === i ? 24 : 8 }}
              className={`h-2 rounded-full ${d === i ? 'bg-mint' : 'bg-white/15'}`}
            />
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => !last && setI(i + 1)}
          className="w-full rounded-2xl bg-curb-green py-4 text-base font-semibold text-white shadow-glow"
        >
          {last ? 'Connect my bank' : 'Next'}
        </motion.button>
        {last && (
          <p className="mt-3 text-center text-xs text-fog">
            Takes about a minute. No card required.
          </p>
        )}
      </div>
    </Screen>
  )
}
