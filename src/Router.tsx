import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell'
import { NavLayout } from '@/layouts/NavLayout'
import { FullScreenLayout } from '@/layouts/FullScreenLayout'
import { Home } from '@/screens/Home'
import { Transactions } from '@/screens/Transactions'
import { Coach } from '@/screens/Coach'
import { Goals } from '@/screens/Goals'
import { Settings } from '@/screens/Settings'
import { CategoryDetail } from '@/screens/CategoryDetail'
import { AffordCheck } from '@/screens/AffordCheck'
import { Inbox } from '@/screens/Inbox'
import { WeeklySummary } from '@/screens/WeeklySummary'
import { Onboarding } from '@/screens/Onboarding'
import { CampusCard } from '@/screens/CampusCard'
import RedesignGallery from '@/redesign/RedesignGallery'

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {/* Tab-bar routes (scroll handled inside NavLayout's main) */}
          <Route element={<NavLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Simple scrollable pages */}
          <Route element={<FullScreenLayout />}>
            <Route path="/category/:id" element={<CategoryDetail />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/campus-card" element={<CampusCard />} />
          </Route>

          {/* Self-managed full-bleed screens */}
          <Route path="/check" element={<AffordCheck />} />
          <Route path="/weekly" element={<WeeklySummary />} />
          <Route path="/welcome" element={<Onboarding />} />
        </Route>

        {/* Gen Z redesign preview gallery — outside AppShell on purpose */}
        <Route path="/redesign" element={<RedesignGallery />} />
      </Routes>
    </BrowserRouter>
  )
}
