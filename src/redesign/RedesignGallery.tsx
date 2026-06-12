import { useState } from 'react'
import OnboardingR from './OnboardingR'
import HomeR from './HomeR'
import SpendingR from './SpendingR'
import CoachR from './CoachR'
import CampusCardR from './CampusCardR'
import AlertsR from './AlertsR'
import UpgradeR from './UpgradeR'

const screens = [
  ['Onboarding', OnboardingR],
  ['Home', HomeR],
  ['Spending', SpendingR],
  ['Coach', CoachR],
  ['Campus card', CampusCardR],
  ['Alerts', AlertsR],
  ['Upgrade', UpgradeR],
] as const

/**
 * Dev-only gallery for the Gen Z redesign — mounted at /redesign so the
 * new screens can be reviewed side-by-side without touching live routes.
 */
export default function RedesignGallery() {
  const [i, setI] = useState(1)
  const Active = screens[i][1]

  return (
    <div className="min-h-dvh bg-night">
      <div className="mx-auto flex max-w-[430px] gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
        {screens.map(([name], s) => (
          <button
            key={name}
            onClick={() => setI(s)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              s === i ? 'bg-curb-green text-white' : 'bg-white/10 text-mist'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
      <Active key={i} />
    </div>
  )
}
