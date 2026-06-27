'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Users, CalendarCheck, DollarSign, ReceiptText } from 'lucide-react'

const features = [
  { label: 'Employee Records', icon: Users },
  { label: 'Attendance Tracking', icon: CalendarCheck },
  { label: 'Salary Management', icon: DollarSign },
  { label: 'Payroll Summary', icon: ReceiptText },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        setError(error)
        return
      }

      const data = await res.json()
      localStorage.setItem('admin', JSON.stringify(data))
      router.push('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex p-4 gap-4" style={{ backgroundColor: '#0A0E0C' }}>

      {/* Left Panel — photo visual */}
      <div className="hidden lg:flex relative flex-col justify-between w-1/2 p-10 rounded-[28px] overflow-hidden">
        <Image
          src="/images/login-bg.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 0vw, 50vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(10,14,12,0.55) 0%, rgba(10,14,12,0.35) 45%, rgba(8,11,10,0.85) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(120% 90% at 15% 10%, rgba(52,211,153,0.20) 0%, transparent 55%)',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded flex items-center justify-center font-bold text-sm"
            style={{ backgroundColor: '#34D399', color: '#08130D' }}
          >
            CH
          </div>
          <span className="font-semibold text-lg tracking-wide" style={{ color: '#EAF4EF' }}>
            CubeTech HRMS
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <h1 className="text-4xl font-bold leading-tight mb-4" style={{ color: '#EAF4EF' }}>
            Smarter HR,<br />
            <span style={{ color: '#34D399' }}>simplified.</span>
          </h1>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#7C8A82' }}>
            One place to manage employees, attendance, salaries, and payroll.
          </p>
        </div>

        {/* Feature pills */}
        <div className="relative z-10 grid grid-cols-2 gap-3">
          {features.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="rounded-xl p-3.5 backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <Icon size={18} className="mb-1.5" style={{ color: '#34D399' }} />
              <div className="text-xs font-medium" style={{ color: '#A8B8AF' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div
              className="w-9 h-9 rounded flex items-center justify-center font-bold text-sm"
              style={{ backgroundColor: '#34D399', color: '#08130D' }}
            >
              CH
            </div>
            <span className="font-semibold text-lg" style={{ color: '#EAF4EF' }}>
              CubeTech HRMS
            </span>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: '#EAF4EF' }}>
            Admin Sign In
          </h2>
          <p className="text-sm mb-8" style={{ color: '#7C8A82' }}>
            Enter your credentials to access the dashboard.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#A8B8AF' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@test.com"
                required
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{
                  backgroundColor: '#12161A',
                  border: '1px solid #1F2924',
                  color: '#EAF4EF',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#34D399')}
                onBlur={(e) => (e.target.style.borderColor = '#1F2924')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#A8B8AF' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{
                  backgroundColor: '#12161A',
                  border: '1px solid #1F2924',
                  color: '#EAF4EF',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#34D399')}
                onBlur={(e) => (e.target.style.borderColor = '#1F2924')}
              />
            </div>

            {error && (
              <div
                className="text-sm px-4 py-3 rounded-lg"
                style={{ backgroundColor: '#F8717118', color: '#F87171' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-semibold transition-opacity"
              style={{ backgroundColor: '#34D399', color: '#08130D', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-xs text-center mt-10" style={{ color: '#5A6660' }}>
            © {new Date().getFullYear()} CubeTech Innovations. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}