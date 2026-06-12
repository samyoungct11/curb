import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Screen, Glyph, type GlyphName } from './primitives'

type Slide = {
  art: 'dollar' | GlyphName
  h: string
  sub: string
  form?: boolean
}

const slides: Slide[] = [
  {
    art: 'dollar',
    h: 'Money, minus the mystery.',
    sub: 'Every dollar you can actually spend — today, this week, this semester. One number, always honest.',
  },
  {
    art: 'eye',
    h: 'Heads up, before it hurts.',
    sub: 'Curb nudges you the moment a spend knocks you off track. Like a text from a friend who’s scary good with money.',
  },
  {
    art: 'bolt',
    h: 'Set up in 60 seconds.',
    sub: 'Connect your bank, pick your weekly vibe, done. Bank-grade encryption — your data is yours, full stop.',
  },
  {
    art: 'user',
    h: 'Make it yours.',
    sub: 'Two quick things, and Curb starts sounding like it actually knows you.',
    form: true,
  },
]

function SlideArt({ kind, compact }: { kind: Slide['art']; compact?: boolean }) {
  return (
    <div className={`relative w-full ${compact ? 'h-32' : 'h-56'}`}>
      {/* Glowing brand orb — abstract, not a stock illustration */}
      <motion.div
        key={kind}
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-curb-green/50 blur-3xl ${compact ? 'h-24 w-24' : 'h-44 w-44'}`}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
      />
      <motion.div
        className={`glass absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center shadow-glow ${compact ? 'h-20 w-20 rounded-3xl' : 'h-36 w-36 rounded-[2.5rem]'}`}
        initial={{ rotate: -8, y: 16, opacity: 0 }}
        animate={{ rotate: kind === 'eye' ? 4 : -4, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        {kind === 'dollar' ? (
          <span className="font-display text-6xl text-mint">$</span>
        ) : (
          <Glyph name={kind} className={compact ? 'h-9 w-9 text-mint' : 'h-14 w-14 text-mint'} />
        )}
      </motion.div>
    </div>
  )
}

export default function OnboardingR() {
  const [i, setI] = useState(0)
  const [name, setName] = useState('')
  const [bday, setBday] = useState('')

  const slide = slides[i]
  const last = i === slides.length - 1
  const ready = !slide.form || (name.trim().length > 0 && bday.length > 0)

  return (
    <Screen>
      {/* Skip stays reachable but quiet */}
      <div className="flex justify-end p-6">
        {!last && <button className="text-sm font-medium text-fog">Skip</button>}
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
            <SlideArt kind={slide.art} compact={slide.form} />
            <h1
              className={`mt-8 font-display leading-[1.05] text-white ${slide.form ? 'text-4xl' : 'text-[2.6rem]'}`}
            >
              {slide.h}
            </h1>
            <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-mist">
              {slide.sub}
            </p>

            {slide.form && (
              <div className="mt-7 space-y-3">
                <label className="glass flex items-center gap-3 rounded-2xl px-4 py-3.5">
                  <Glyph name="user" className="h-5 w-5 shrink-0 text-mint" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="your name"
                    autoComplete="name"
                    className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-fog"
                  />
                </label>
                <label className="glass flex items-center gap-3 rounded-2xl px-4 py-3.5">
                  <Glyph name="cake" className="h-5 w-5 shrink-0 text-mint" />
                  <input
                    type="date"
                    value={bday}
                    onChange={(e) => setBday(e.target.value)}
                    aria-label="your birthday"
                    className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none [color-scheme:dark]"
                  />
                </label>
                <p className="text-xs leading-relaxed text-fog">
                  your birthday confirms it’s really you — it never shows up
                  anywhere else.
                </p>
              </div>
            )}
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
          whileTap={ready ? { scale: 0.97 } : undefined}
          disabled={!ready}
          onClick={() => !last && setI(i + 1)}
          className={`w-full rounded-2xl py-4 text-base font-semibold transition-colors ${
            ready ? 'bg-curb-green text-white shadow-glow' : 'bg-white/10 text-fog'
          }`}
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
