import { NavLink } from 'react-router-dom'
import { Home, Receipt, Sparkles, Target, User as UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/transactions', label: 'Activity', icon: Receipt },
  { to: '/coach', label: 'Coach', icon: Sparkles },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/settings', label: 'Profile', icon: UserIcon },
]

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 left-0 right-0 z-30 bg-card border-t border-line pb-[max(env(safe-area-inset-bottom),0px)]">
      <div className="flex h-[64px]">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 tap transition-colors',
                isActive ? 'text-brand' : 'text-soft',
              )
            }
          >
            <Icon size={22} strokeWidth={2} />
            <span className="text-[10px] font-medium tracking-wide uppercase">
              {label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
