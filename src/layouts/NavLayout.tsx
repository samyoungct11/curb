import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BottomNav } from '@/components/BottomNav'

/** Routes wrapped in this get the bottom tab bar + page transitions. */
export function NavLayout() {
  const location = useLocation()
  return (
    <div className="flex flex-col min-h-screen md:min-h-[844px]">
      <main className="flex-1 overflow-y-auto pb-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  )
}
