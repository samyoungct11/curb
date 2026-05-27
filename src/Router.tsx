import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell'
import { NavLayout } from '@/layouts/NavLayout'
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

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route element={<NavLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="/category/:id" element={<CategoryDetail />} />
          <Route path="/check" element={<AffordCheck />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/weekly" element={<WeeklySummary />} />
          <Route path="/welcome" element={<Onboarding />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
