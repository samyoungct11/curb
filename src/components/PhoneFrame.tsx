import { type ReactNode } from 'react'

/**
 * On desktop (>=768px), wraps children in a 420px-wide phone-frame mockup
 * for stakeholder previews. On mobile, just renders children full-screen.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-app md:bg-[#EDEEF1] md:dark:bg-[#0A0C10]">
      {/* Desktop caption */}
      <div className="hidden md:block text-center pt-8 pb-4 text-xs text-soft tracking-wide uppercase">
        📱 Preview · open on your phone for the real feel
      </div>

      <div
        className={[
          'mx-auto bg-app min-h-screen relative overflow-hidden',
          // mobile: full width, full height
          'w-full',
          // desktop: phone frame
          'md:w-[420px] md:min-h-[844px] md:max-h-[920px] md:rounded-[44px] md:border md:border-[var(--line)] md:shadow-[0_20px_60px_rgba(0,0,0,0.12)] md:my-8',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  )
}
