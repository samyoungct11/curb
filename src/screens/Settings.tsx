import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Banknote,
  Bell,
  ChevronRight,
  Lock,
  RotateCcw,
  Sun,
  UserPlus,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Card } from '@/components/ui/Card'
import { Switch } from '@/components/ui/Switch'
import { Segmented } from '@/components/ui/Segmented'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import type { ThemeMode, ToneMode } from '@/lib/types'

export function Settings() {
  const navigate = useNavigate()
  const {
    user,
    theme,
    setTheme,
    updateUser,
    resetDemo,
    categories,
  } = useAppStore()
  const [parentSheet, setParentSheet] = useState(false)
  const [privacySheet, setPrivacySheet] = useState(false)
  const [bankSheet, setBankSheet] = useState(false)
  const [muted, setMuted] = useState<Record<string, boolean>>({})

  const parentCode = String(Math.floor(100000 + Math.random() * 900000))

  return (
    <div className="px-5 pt-4 pb-6 space-y-4">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">Profile</h1>
      </header>

      {/* Profile */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-brand text-white flex items-center justify-center text-lg font-semibold">
            {user?.name?.[0] ?? '?'}
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold">{user?.name}</div>
            <div className="text-sm text-soft">
              {user?.ageRange}{user?.isStudent ? ' · Student' : ''}
            </div>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Bell size={18} className="text-soft" />
          <h2 className="text-[15px] font-semibold">Notifications</h2>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-soft uppercase tracking-wide mb-2">Tone</div>
            <Segmented
              value={(user?.notificationTone ?? 'balanced') as ToneMode}
              onChange={(v) => updateUser({ notificationTone: v })}
              options={[
                { value: 'strict', label: 'Strict', emoji: '🎯' },
                { value: 'balanced', label: 'Balanced', emoji: '⚖️' },
                { value: 'chill', label: 'Chill', emoji: '🌊' },
              ]}
              className="w-full"
            />
          </div>
          <div>
            <div className="text-xs text-soft uppercase tracking-wide mb-2">
              Mute by category
            </div>
            <div className="space-y-1.5">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between bg-card-2 rounded-xl px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span>{c.emoji}</span>
                    <span className="text-sm">{c.name}</span>
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

      {/* Connected accounts */}
      <SettingsRow
        icon={<Banknote size={18} />}
        label="Connect a bank"
        sublabel="Pull transactions automatically"
        onClick={() => setBankSheet(true)}
      />

      {/* Parent linking */}
      <SettingsRow
        icon={<UserPlus size={18} />}
        label="Invite a parent"
        sublabel="They see a summary — you stay in control"
        onClick={() => setParentSheet(true)}
      />

      {/* Appearance */}
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <Sun size={18} className="text-soft" />
          <h2 className="text-[15px] font-semibold">Appearance</h2>
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

      {/* Privacy */}
      <SettingsRow
        icon={<Lock size={18} />}
        label="Your data"
        sublabel="We don't sell it. Ever."
        onClick={() => setPrivacySheet(true)}
      />

      {/* Demo reset */}
      <SettingsRow
        icon={<RotateCcw size={18} />}
        label="Reset demo data"
        sublabel="Start fresh with Maya's data"
        onClick={() => {
          if (confirm('Reset to demo data? This wipes any added transactions.')) {
            resetDemo()
            navigate('/')
          }
        }}
      />

      <button
        type="button"
        onClick={() => navigate('/welcome')}
        className="w-full text-center text-sm text-soft py-3"
      >
        Run onboarding again
      </button>

      {/* Sheets */}
      <Sheet open={parentSheet} onOpenChange={setParentSheet} title="Invite a parent">
        <div className="space-y-4">
          <p className="text-sm text-soft leading-relaxed">
            Share this 6-digit code with a parent. They can help set budgets and see a
            summary — but never individual transactions unless you opt in.
          </p>
          <div className="num text-center text-4xl font-bold tracking-[0.4em] bg-card-2 py-6 rounded-2xl">
            {parentCode}
          </div>
          <div className="text-xs text-soft space-y-1">
            <div>· You can revoke access anytime</div>
            <div>· You see a log of what they viewed</div>
            <div>· Categories you mark private stay private</div>
          </div>
          <Button size="lg" onClick={() => setParentSheet(false)}>
            Got it
          </Button>
        </div>
      </Sheet>

      <Sheet open={privacySheet} onOpenChange={setPrivacySheet} title="Your data">
        <ul className="text-sm space-y-3 leading-relaxed">
          <li>🚫 We never sell user data to advertisers.</li>
          <li>🔐 Bank connections are read-only and tokenized via Plaid.</li>
          <li>📁 Transaction data is encrypted at rest with per-user keys.</li>
          <li>🧒 No ads served to users under 18.</li>
          <li>🗑️ You can delete your account and all data in one tap.</li>
        </ul>
        <Button size="lg" className="mt-4" onClick={() => setPrivacySheet(false)}>
          Got it
        </Button>
      </Sheet>

      <Sheet open={bankSheet} onOpenChange={setBankSheet} title="Connect a bank">
        <div className="space-y-3">
          <p className="text-sm text-soft">
            We use Plaid to securely link your bank or card. Read-only, never your password.
          </p>
          {['Chase', 'Bank of America', 'Wells Fargo', 'Capital One', 'Apple Card'].map(
            (b) => (
              <button
                key={b}
                type="button"
                className="w-full flex items-center justify-between bg-card-2 rounded-xl px-4 py-3 tap"
              >
                <span className="text-[15px] font-medium">{b}</span>
                <ChevronRight size={16} className="text-soft" />
              </button>
            ),
          )}
          <div className="text-xs text-soft text-center pt-2">
            (Demo — no real bank will connect.)
          </div>
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
      className="w-full bg-card border border-line rounded-2xl px-4 py-4 flex items-center gap-3 tap text-left shadow-[var(--shadow-card)]"
    >
      <div className="h-10 w-10 rounded-xl bg-card-2 text-ink flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[15px] font-semibold">{label}</div>
        {sublabel && <div className="text-xs text-soft mt-0.5">{sublabel}</div>}
      </div>
      <ChevronRight size={16} className="text-soft" />
    </button>
  )
}
