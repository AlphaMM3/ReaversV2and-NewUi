import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { authApi } from '@/lib/api'
import type { CurrentUser } from '@/lib/api'
import {
  BookOpen, Video, Users, Bell, BarChart2, Clock, Shield
} from 'lucide-react'

interface LoginViewProps {
  onLogin: (user: CurrentUser) => void
}

const FEATURE_PILLS = [
  { icon: Video,     label: 'Live Online Classes' },
  { icon: BookOpen,  label: 'Digital Attendance' },
  { icon: Users,     label: 'Guardian Portal' },
  { icon: BarChart2, label: 'Course Reports' },
  { icon: Bell,      label: 'Follow-up Alerts' },
  { icon: Clock,     label: 'Asia/Dhaka Schedule' },
  { icon: Shield,    label: 'Role-based Access' },
]

export default function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const user = await authApi.login(email.trim(), password)
      onLogin(user)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT: Brand panel ─────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-royal-gradient text-white"
      >
        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">IOM Itqaan Academy</p>
              <p className="text-xs text-white/70">Online Academy Management</p>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Manage Your<br />Online Academy<br />with Precision
          </h1>
          <p className="text-white/80 text-base mb-10">
            A complete operations platform for online Islamic academies —
            live classes, attendance, reports, and guardian access, all in one place.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {FEATURE_PILLS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium"
              >
                <Icon className="w-4 h-4 opacity-90" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-white/50">
          Asia/Dhaka timezone · Secure · Role-based access
        </p>
      </div>

      {/* ── RIGHT: Login form ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-bg">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-700" />
            </div>
            <p className="font-bold text-lg text-heading">IOM Itqaan Academy</p>
          </div>

          <div className="bg-surface rounded-2xl border border-border shadow-sm p-8">
            <h2 className="text-xl font-bold text-heading mb-1">Sign in to Academy</h2>
            <p className="text-sm text-muted mb-7">
              Enter your academy email and password
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Input
                label="Email address"
                type="email"
                placeholder="you@iomacademy.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full mt-1" loading={loading}>
                Sign In
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-muted mt-6">
            IOM Itqaan Academy · All times in Asia/Dhaka (BD) timezone
          </p>
        </div>
      </div>
    </div>
  )
}

