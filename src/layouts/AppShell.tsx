import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { PhoneFrame } from '@/components/PhoneFrame'
import { useAppStore } from '@/store/useAppStore'

/** Applies theme + wraps everything in the phone frame for desktop. */
export function AppShell() {
  const theme = useAppStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const wantDark =
        theme === 'dark' || (theme === 'system' && mql.matches)
      root.classList.toggle('dark', wantDark)
    }
    apply()
    if (theme === 'system') {
      mql.addEventListener('change', apply)
      return () => mql.removeEventListener('change', apply)
    }
  }, [theme])

  return (
    <PhoneFrame>
      <Outlet />
    </PhoneFrame>
  )
}
