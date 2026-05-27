import { Toaster } from 'sonner'
import { Router } from '@/Router'

export default function App() {
  return (
    <>
      <Router />
      <Toaster
        position="top-center"
        offset={16}
        toastOptions={{
          style: {
            borderRadius: '14px',
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--ink)',
          },
        }}
      />
    </>
  )
}
