import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { usePlaidLink, type PlaidLinkOnSuccessMetadata } from 'react-plaid-link'
import { toast } from 'sonner'
import { CurbLogo } from '@/components/CurbLogo'
import { Sheet } from '@/components/ui/Sheet'
import { useAppStore, type PlaidTransaction } from '@/store/useAppStore'
import { supabase, getOrCreateUserId } from '@/lib/supabase'
import { apiPost } from '@/lib/api'
import { cn } from '@/lib/utils'

/**
 * Premium, brand-forward onboarding. Five screens:
 *   splash → value → connect → (bank | mealplan) → done
 *
 * The flow intentionally skips the old budgeting questionnaire — spending
 * data comes from a connected source. We still seed the account with sensible
 * defaults on completion so the dashboard is usable; the user tunes income and
 * categories later in Settings.
 */

type Screen = 'splash' | 'value' | 'connect' | 'bank' | 'mealplan' | 'done'

const DEFAULT_CATEGORIES = [
  'Restaurants',
  'Coffee',
  'Shopping',
  'Fun',
  'Transport',
  'Subscriptions',
]

const UNIVERSITIES: { name: string; system: string }[] = [
  { name: 'New York University', system: 'GET Funds' },
  { name: 'University of Michigan', system: 'Blue Bucks' },
  { name: 'University of California, Los Angeles', system: 'BruinCard' },
  { name: 'University of Texas at Austin', system: 'Bevo Bucks' },
  { name: 'Pennsylvania State University', system: 'LionCash' },
  { name: 'Ohio State University', system: 'BuckID' },
  { name: 'University of Florida', system: 'Gator Dining' },
  { name: 'Arizona State University', system: 'Sun Devil Dollars' },
  { name: 'University of Southern California', system: 'USCard' },
  { name: 'Boston University', system: 'Convenience Points' },
]

const BENEFITS: { label: string; body: string }[] = [
  { label: 'Real-time alerts', body: 'Know the moment you overspend.' },
  { label: 'AI spending coach', body: 'Weekly insights built around your habits.' },
  { label: 'Campus-native', body: 'Meal plans, dining halls, student life.' },
]

const TRUST_LINES = [
  'Read-only access. Curb never touches your money.',
  'Bank-level 256-bit encryption.',
  'Disconnect anytime from settings.',
]

export function Onboarding() {
  const navigate = useNavigate()
  const {
    completeOnboarding,
    loadDemo,
    plaidUserId,
    setPlaidUserId,
    importPlaidTransactions,
  } = useAppStore()

  const [screen, setScreen] = useState<Screen>('splash')
  const [connectChoice, setConnectChoice] = useState<'bank' | 'mealplan' | null>(null)
  const [howSheet, setHowSheet] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedUni, setSelectedUni] = useState<string | null>(null)
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)

  // ── Account setup (defaults; user refines later in Settings) ───────────────
  const setupAccount = useCallback(
    (isStudent = false) => {
      if (useAppStore.getState().user) return
      completeOnboarding({
        name: '',
        ageRange: '18-22',
        monthlyIncome: 600,
        isStudent,
        primaryGoal: 'stay_under',
        notificationTone: 'balanced',
        categories: DEFAULT_CATEGORIES,
      })
    },
    [completeOnboarding],
  )

  // ── Plaid link (bank path) ─────────────────────────────────────────────────
  const onPlaidSuccess = useCallback(
    async (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
      const userId = plaidUserId
      setupAccount(false)
      if (userId) {
        try {
          await apiPost('/api/exchange-token', {
            public_token: publicToken,
            institution_name: metadata.institution?.name ?? 'Unknown Bank',
          })
          const resp = await apiPost('/api/sync-transactions')
          const { transactions } = (await resp.json()) as {
            transactions?: PlaidTransaction[]
          }
          if (transactions?.length) importPlaidTransactions(transactions)
        } catch {
          // best-effort during onboarding — user can sync later in Settings
        }
      }
      setScreen('done')
    },
    [plaidUserId, setupAccount, importPlaidTransactions],
  )

  const { open: openPlaidLink, ready: plaidReady } = usePlaidLink({
    token: linkToken ?? '',
    onSuccess: onPlaidSuccess,
    onExit: () => setLinking(false),
  })

  useEffect(() => {
    // Open Plaid as soon as we have a token and the SDK is ready. The modal
    // covers the button; `linking` is cleared by onExit / the success path.
    if (linkToken && plaidReady) openPlaidLink()
  }, [linkToken, plaidReady, openPlaidLink])

  async function handleConnectBank() {
    if (!supabase) {
      // Plaid isn't configured (e.g. local preview) — complete gracefully.
      setupAccount(false)
      toast.info("Bank linking isn't set up here — you can connect later in Settings.")
      setScreen('done')
      return
    }
    setLinking(true)
    try {
      const userId = await getOrCreateUserId()
      if (!userId) throw new Error('Could not get user ID')
      setPlaidUserId(userId)
      const resp = await apiPost('/api/create-link-token')
      const { link_token, error } = (await resp.json()) as {
        link_token?: string
        error?: string
      }
      if (error || !link_token) throw new Error(error ?? 'No link token')
      setLinkToken(link_token)
    } catch {
      toast.error('Could not start bank connection.')
      setLinking(false)
    }
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return UNIVERSITIES
    return UNIVERSITIES.filter((u) => u.name.toLowerCase().includes(q))
  }, [query])

  function goToApp() {
    setupAccount(false)
    navigate('/', { replace: true })
  }

  return (
    <div className="h-full w-full bg-white text-[#141714]">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="h-full"
        >
          {/* ── Screen 1 · Splash ─────────────────────────────────────────── */}
          {screen === 'splash' && (
            <div className="h-full flex flex-col px-6 pt-6 pb-8">
              <div className="flex-1 flex flex-col items-center justify-center gap-5">
                <CurbLogo size="lg" />
                <p className="font-display italic text-curb-green text-[22px] leading-none">
                  Spend with intention.
                </p>
              </div>
              <div>
                <PrimaryCTA onClick={() => setScreen('value')}>Get started</PrimaryCTA>
                <TextLink
                  onClick={() => {
                    loadDemo()
                    navigate('/', { replace: true })
                  }}
                >
                  I already have an account
                </TextLink>
              </div>
            </div>
          )}

          {/* ── Screen 2 · Value prop ─────────────────────────────────────── */}
          {screen === 'value' && (
            <div className="h-full flex flex-col px-6 pt-6 pb-8">
              <TopBar onBack={() => setScreen('splash')} />
              <div className="flex-1 min-h-0 overflow-y-auto mt-10">
                <h1 className="font-display text-[34px] leading-[1.1]">
                  Your money,
                  <br />
                  clearer.
                </h1>
                <div className="mt-10 space-y-7">
                  {BENEFITS.map((b) => (
                    <div key={b.label} className="flex gap-3">
                      <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-curb-green shrink-0" />
                      <div>
                        <div className="text-[15px] font-semibold">{b.label}</div>
                        <div className="text-[14px] text-[#4A514C] mt-0.5 leading-relaxed">
                          {b.body}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4">
                <PrimaryCTA onClick={() => setScreen('connect')}>Continue</PrimaryCTA>
              </div>
            </div>
          )}

          {/* ── Screen 3 · Connect your money ─────────────────────────────── */}
          {screen === 'connect' && (
            <div className="h-full flex flex-col px-6 pt-6 pb-8">
              <TopBar onBack={() => setScreen('value')} />
              <div className="flex-1 min-h-0 overflow-y-auto mt-10">
                <h1 className="font-display text-[28px] leading-tight">
                  Connect your money
                </h1>
                <p className="text-[14px] text-[#4A514C] font-light mt-2 leading-relaxed">
                  Link what you spend with. You can always add more later.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-7">
                  <OptionCard
                    selected={connectChoice === 'bank'}
                    onClick={() => setConnectChoice('bank')}
                    icon={<BankIcon />}
                    label="Bank account"
                    sub="Plaid · 10,000+ banks"
                  />
                  <OptionCard
                    selected={connectChoice === 'mealplan'}
                    onClick={() => setConnectChoice('mealplan')}
                    icon={<DiningIcon />}
                    label="Campus meal plan"
                    sub="Search your university"
                  />
                </div>
                <TextLink
                  onClick={() => {
                    setupAccount(false)
                    setScreen('done')
                  }}
                >
                  Skip for now — I'll connect later
                </TextLink>
              </div>
              <div className="pt-4">
                <PrimaryCTA
                  disabled={!connectChoice}
                  onClick={() =>
                    setScreen(connectChoice === 'mealplan' ? 'mealplan' : 'bank')
                  }
                >
                  Continue
                </PrimaryCTA>
              </div>
            </div>
          )}

          {/* ── Screen 4 · Bank trust ─────────────────────────────────────── */}
          {screen === 'bank' && (
            <div className="h-full flex flex-col px-6 pt-6 pb-8">
              <TopBar onBack={() => setScreen('connect')} />
              <div className="flex-1 min-h-0 overflow-y-auto mt-10">
                <LockIcon />
                <h1 className="font-display text-[28px] leading-tight mt-5">
                  Secure bank connection
                </h1>
                <ul className="mt-7 space-y-4">
                  {TRUST_LINES.map((line) => (
                    <li key={line} className="flex gap-3">
                      <CheckIcon className="mt-0.5 shrink-0" />
                      <span className="text-[14px] text-[#4A514C] font-light leading-relaxed">
                        {line}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-4">
                <PrimaryCTA onClick={handleConnectBank} disabled={linking}>
                  {linking ? 'Opening Plaid…' : 'Connect with Plaid'}
                </PrimaryCTA>
                <TextLink onClick={() => setHowSheet(true)}>How does this work?</TextLink>
              </div>
            </div>
          )}

          {/* ── Screen 4B · Meal plan search ──────────────────────────────── */}
          {screen === 'mealplan' && (
            <div className="h-full flex flex-col px-6 pt-6 pb-8">
              <TopBar onBack={() => setScreen('connect')} />
              <div className="flex-1 min-h-0 flex flex-col mt-10">
                <h1 className="font-display text-[28px] leading-tight">Find your campus</h1>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search university..."
                  className="mt-5 w-full h-12 px-4 rounded-xl border border-curb-light bg-white text-[15px] text-[#141714] placeholder:text-[#9AA3A0] focus:outline-none focus:ring-2 focus:ring-curb-green focus:border-curb-green"
                />
                <div className="flex-1 min-h-0 overflow-y-auto mt-3 -mx-1 px-1">
                  {results.length === 0 ? (
                    <p className="text-[13px] text-[#9AA3A0] px-1 py-4">
                      No matches. Try another name.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {results.map((u) => {
                        const active = selectedUni === u.name
                        return (
                          <button
                            key={u.name}
                            type="button"
                            onClick={() => setSelectedUni(u.name)}
                            className={cn(
                              'w-full text-left px-4 py-3 rounded-xl tap flex items-center justify-between gap-2 transition-colors',
                              active ? 'bg-[#E8F4EE]' : 'hover:bg-[#F7F8F5]',
                            )}
                          >
                            <span className="text-[14px]">
                              {u.name}
                              <span className="text-[#6E747F]"> · {u.system}</span>
                            </span>
                            {active && <CheckIcon className="shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-4">
                <PrimaryCTA
                  disabled={!selectedUni}
                  onClick={() => {
                    setupAccount(true)
                    setScreen('done')
                  }}
                >
                  Connect meal plan
                </PrimaryCTA>
              </div>
            </div>
          )}

          {/* ── Screen 5 · You're in ──────────────────────────────────────── */}
          {screen === 'done' && (
            <div className="h-full flex flex-col px-6 pt-6 pb-8">
              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <CurbLogo size="lg" />
                <div className="text-center">
                  <h1 className="font-display text-[32px] leading-tight">You're set up.</h1>
                  <p className="font-display italic text-curb-green text-[20px] mt-1.5 leading-none">
                    Curb is watching.
                  </p>
                </div>
              </div>
              <div>
                <PrimaryCTA onClick={goToApp}>Go to Curb</PrimaryCTA>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <Sheet open={howSheet} onOpenChange={setHowSheet} title="How bank linking works">
        <ul className="space-y-3 text-[13px] text-soft leading-relaxed">
          <li>1. Plaid securely connects to your bank — Curb never sees your login.</li>
          <li>2. We receive read-only transaction data, encrypted end to end.</li>
          <li>3. You can disconnect any account from Settings at any time.</li>
        </ul>
        <button
          type="button"
          onClick={() => setHowSheet(false)}
          className="mt-5 w-full h-[52px] rounded-xl bg-curb-green text-white font-medium text-[15px] tap"
        >
          Got it
        </button>
      </Sheet>
    </div>
  )
}

/* ── Building blocks ─────────────────────────────────────────────────────── */

function TopBar({ onBack }: { onBack?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <CurbLogo size="sm" />
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="h-9 w-9 -mr-1 flex items-center justify-center text-[#6E747F] tap"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
    </div>
  )
}

function PrimaryCTA({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full h-[52px] rounded-xl bg-curb-green text-white font-medium text-[15px] tap transition-opacity disabled:opacity-40 flex items-center justify-center"
    >
      {children}
    </button>
  )
}

function TextLink({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-center text-[13px] text-[#6E747F] py-3 tap"
    >
      {children}
    </button>
  )
}

function OptionCard({
  selected,
  onClick,
  icon,
  label,
  sub,
}: {
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  sub: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border-2 p-4 text-left tap transition-colors flex flex-col min-h-[140px]',
        selected ? 'border-curb-green bg-[#E8F4EE]' : 'border-curb-light bg-white',
      )}
    >
      <div className="h-10 w-10 flex items-center justify-center">{icon}</div>
      <div className="mt-auto">
        <div className="text-[15px] font-medium leading-tight">{label}</div>
        <div className="text-[12px] text-[#6E747F] font-light mt-1 leading-tight">
          {sub}
        </div>
      </div>
    </button>
  )
}

/* ── Inline SVG icons (no icon-pack dependency) ──────────────────────────── */

function BankIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="#2A7D52"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-5 9 5" />
      <path d="M4 9h16" />
      <path d="M6 10v7M10 10v7M14 10v7M18 10v7" />
      <path d="M3 20h18" />
    </svg>
  )
}

function DiningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="#2A7D52"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3v6a2 2 0 0 0 4 0V3" />
      <path d="M8 9v12" />
      <path d="M16 3c-1.4 1.1-2 3.1-2 6 0 2 1 3 2 3v9" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="30"
      height="30"
      fill="none"
      stroke="#2A7D52"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="#2A7D52"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}
