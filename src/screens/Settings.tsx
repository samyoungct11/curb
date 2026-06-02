import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Banknote,
  Bell,
  ChevronRight,
  Lock,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Sun,
  UserPlus,
} from 'lucide-react'
import { usePlaidLink, type PlaidLinkOnSuccessMetadata } from 'react-plaid-link'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { supabase, getOrCreateUserId } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Switch } from '@/components/ui/Switch'
import { Segmented } from '@/components/ui/Segmented'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/Icon'
import type { ThemeMode, ToneMode } from '@/lib/types'
import type { PlaidTransaction } from '@/store/useAppStore'

export function Settings() {
  const navigate = useNavigate()
  const {
    user,
    theme,
    setTheme,
    updateUser,
    resetAll,
    loadDemo,
    categories,
    plaidConnected,
    plaidUserId,
    setPlaidUserId,
    importPlaidTransactions,
  } = useAppStore()
  const [parentSheet, setParentSheet] = useState(false)
  const [privacySheet, setPrivacySheet] = useState(false)
  const [bankSheet, setBankSheet] = useState(false)
  const [muted, setMuted] = useState<Record<string, boolean>>({})
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // ── Plaid Link ──────────────────────────────────────────────────────────────

  const onPlaidSuccess = useCallback(
    async (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
      const userId = plaidUserId
      if (!userId) return
      try {
        // Exchange public token for permanent access token (server-side)
        await fetch('/api/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            public_token: publicToken,
            institution_name: metadata.institution?.name ?? 'Unknown Bank',
            userId,
          }),
        })

        // Pull transactions immediately
        await syncTransactions(userId)
        toast.success('Bank connected! Transactions imported.')
        setBankSheet(false)
      } catch {
        toast.error('Connection failed — please try again.')
      }
    },
    [plaidUserId], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const { open: openPlaidLink, ready: plaidReady } = usePlaidLink({
    token: linkToken ?? '',
    onSuccess: onPlaidSuccess,
    onExit: () => setLinking(false),
  })

  async function handleConnectBank() {
    if (!supabase) {
      toast.error('Bank connection not configured yet.')
      return
    }
    setLinking(true)
    try {
      const userId = await getOrCreateUserId()
      if (!userId) throw new Error('Could not get user ID')
      setPlaidUserId(userId)

      const resp = await fetch('/api/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const { link_token, error } = await resp.json() as { link_token?: string; error?: string }
      if (error || !link_token) throw new Error(error ?? 'No link token')

      setLinkToken(link_token)
    } catch (err) {
      console.error(err)
      toast.error('Could not start bank connection.')
      setLinking(false)
    }
  }

  // Open Plaid Link as soon as token arrives and SDK is ready
  useEffect(() => {
    if (linkToken && plaidReady) {
      setLinking(false)
      openPlaidLink()
    }
  }, [linkToken, plaidReady, openPlaidLink])

  async function syncTransactions(userId?: string) {
    const uid = userId ?? plaidUserId
    if (!uid) return
    setSyncing(true)
    try {
      const resp = await fetch('/api/sync-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid }),
      })
      const { transactions, error } = await resp.json() as { transactions?: PlaidTransaction[]; error?: string }
      if (error) throw new Error(error)
      if (transactions?.length) {
        importPlaidTransactions(transactions)
        toast.success(`${transactions.length} transactions synced`)
      } else {
        toast.info('No new transactions')
      }
    } catch {
      toast.error('Sync failed — please try again.')
    } finally {
      setSyncing(false)
    }
  }

  const parentCode = String(Math.floor(100000 + Math.random() * 900000))

  return (
    <div className="px-5 pt-5 pb-8 space-y-4">
      <header>
        <h1 className="text-[26px] font-semibold tracking-tight">Profile</h1>
      </header>

      <Card>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-ink text-white dark:bg-white dark:text-ink flex items-center justify-center text-[15px] font-semibold">
            {user?.name?.[0] ?? '?'}
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold tracking-tight">{user?.name}</div>
            <div className="text-[12px] text-soft">
              {user?.ageRange}{user?.isStudent ? ' · Student' : ''}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Bell size={16} strokeWidth={1.75} className="text-soft" />
          <h2 className="text-[14px] font-semibold tracking-tight">Notifications</h2>
        </div>
        <div className="space-y-4">
          <div>
            <div className="text-[11px] text-soft uppercase tracking-[0.16em] font-semibold mb-2">
              Tone
            </div>
            <Segmented
              value={(user?.notificationTone ?? 'balanced') as ToneMode}
              onChange={(v) => updateUser({ notificationTone: v })}
              options={[
                { value: 'strict', label: 'Strict' },
                { value: 'balanced', label: 'Balanced' },
                { value: 'chill', label: 'Chill' },
              ]}
              className="w-full"
            />
          </div>
          <div>
            <div className="text-[11px] text-soft uppercase tracking-[0.16em] font-semibold mb-2">
              Mute by category
            </div>
            <div className="space-y-1.5">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between bg-card-2 rounded-xl px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon name={c.icon} size={15} className="text-soft" />
                    <span className="text-[13px] font-medium">{c.name}</span>
                  </div>
                  <Switch
                    checked={!!muted[c.id]}
                    onCheckedChange={(v) => setMuted((m) => ({ ...m, [c.id]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <SettingsRow
        icon={<Banknote size={16} strokeWidth={1.75} />}
        label="Connect a bank"
        sublabel="Pull transactions automatically"
        onClick={() => setBankSheet(true)}
      />

      <SettingsRow
        icon={<UserPlus size={16} strokeWidth={1.75} />}
        label="Invite a parent"
        sublabel="They see a summary — you stay in control"
        onClick={() => setParentSheet(true)}
      />

      <Card>
        <div className="flex items-center gap-3 mb-3">
          <Sun size={16} strokeWidth={1.75} className="text-soft" />
          <h2 className="text-[14px] font-semibold tracking-tight">Appearance</h2>
        </div>
        <Segmented
          value={theme}
          onChange={(v) => setTheme(v as ThemeMode)}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ]}
          className="w-full"
        />
      </Card>

      <SettingsRow
        icon={<Lock size={16} strokeWidth={1.75} />}
        label="Your data"
        sublabel="We don't sell it. Ever."
        onClick={() => setPrivacySheet(true)}
      />

      <SettingsRow
        icon={<Sparkles size={16} strokeWidth={1.75} />}
        label="Load demo data"
        sublabel="See the app with Maya's pre-filled account"
        onClick={() => {
          if (confirm("Replace your data with Maya's demo account?")) {
            loadDemo()
            navigate('/')
          }
        }}
      />

      <SettingsRow
        icon={<RotateCcw size={16} strokeWidth={1.75} />}
        label="Start over"
        sublabel="Wipe everything and redo onboarding"
        onClick={() => {
          if (confirm('Wipe all your data and start onboarding again?')) {
            resetAll()
            navigate('/welcome', { replace: true })
          }
        }}
      />

      <Sheet open={parentSheet} onOpenChange={setParentSheet} title="Invite a parent">
        <div className="space-y-4">
          <p className="text-[13px] text-soft leading-relaxed">
            Share this 6-digit code with a parent. They can help set budgets and see a
            summary — but never individual transactions unless you opt in.
          </p>
          <div className="num text-center text-4xl font-bold tracking-[0.4em] bg-card-2 py-6 rounded-2xl">
            {parentCode}
          </div>
          <ul className="text-[12px] text-soft space-y-1.5">
            <li>— You can revoke access anytime</li>
            <li>— You see a log of what they viewed</li>
            <li>— Categories you mark private stay private</li>
          </ul>
          <Button size="lg" onClick={() => setParentSheet(false)}>
            Got it
          </Button>
        </div>
      </Sheet>

      <Sheet open={privacySheet} onOpenChange={setPrivacySheet} title="Your data">
        <ul className="text-[13px] space-y-3 leading-relaxed text-soft">
          <li>— We never sell user data to advertisers.</li>
          <li>— Bank connections are read-only and tokenized via Plaid.</li>
          <li>— Transaction data is encrypted at rest with per-user keys.</li>
          <li>— No ads served to users under 18.</li>
          <li>— You can delete your account and all data in one tap.</li>
        </ul>
        <Button size="lg" className="mt-5" onClick={() => setPrivacySheet(false)}>
          Got it
        </Button>
      </Sheet>

      <Sheet open={bankSheet} onOpenChange={setBankSheet} title="Connect a bank">
        <div className="space-y-4">
          <p className="text-[13px] text-soft leading-relaxed">
            We use Plaid to securely link your bank or card. Read-only access only — we never see your password.
          </p>

          {plaidConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 bg-card-2 rounded-xl px-4 py-3">
                <div className="h-2 w-2 rounded-full bg-brand" />
                <span className="text-[13px] font-medium">Bank connected</span>
              </div>
              <Button
                variant="secondary"
                size="lg"
                disabled={syncing}
                onClick={() => syncTransactions()}
              >
                <RefreshCw size={15} strokeWidth={1.75} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing…' : 'Sync now'}
              </Button>
              <Button
                size="lg"
                disabled={linking}
                onClick={handleConnectBank}
              >
                <Banknote size={15} strokeWidth={1.75} />
                {linking ? 'Opening Plaid…' : 'Add another account'}
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              disabled={linking}
              onClick={handleConnectBank}
            >
              <Banknote size={15} strokeWidth={1.75} />
              {linking ? 'Opening Plaid…' : 'Connect with Plaid'}
            </Button>
          )}

          <p className="text-[11px] text-soft text-center">
            Bank-grade 256-bit encryption · Read-only · Disconnect anytime
          </p>
        </div>
      </Sheet>
    </div>
  )
}

function SettingsRow({
  icon,
  label,
  sublabel,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  sublabel?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-card rounded-[20px] px-4 py-4 flex items-center gap-3 tap text-left shadow-[var(--shadow-card)] dark:ring-1 dark:ring-[var(--line)]"
    >
      <div className="h-10 w-10 rounded-xl bg-card-2 text-ink flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[14px] font-semibold tracking-tight">{label}</div>
        {sublabel && <div className="text-[12px] text-soft mt-0.5">{sublabel}</div>}
      </div>
      <ChevronRight size={15} strokeWidth={1.75} className="text-soft" />
    </button>
  )
}
