'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single()

    if (error || !data) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    // Store session in localStorage
    localStorage.setItem('admin', JSON.stringify(data))
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F0F2F5' }}>
      
      {/* Left Panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-2/5 p-12"
        style={{ backgroundColor: '#1A2B4A' }}
      >
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div
              className="w-9 h-9 rounded flex items-center justify-center font-bold text-white text-sm"
              style={{ backgroundColor: '#2F80ED' }}
            >
              CH
            </div>
            <span className="text-white font-semibold text-lg tracking-wide">
              CubeTech HRMS
            </span>
          </div>

          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Manage your workforce,<br />
            <span style={{ color: '#2F80ED' }}>all in one place.</span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            A centralized platform for managing employees, tracking attendance, processing payroll, and maintaining accurate HR records.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Employee Records', icon: '👤' },
            { label: 'Attendance Tracking', icon: '📅' },
            { label: 'Salary Management', icon: '💰' },
            { label: 'Payroll Summary', icon: '📊' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg p-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <div className="text-xl mb-2">{item.icon}</div>
              <div className="text-white text-xs font-medium">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div
              className="w-9 h-9 rounded flex items-center justify-center font-bold text-white text-sm"
              style={{ backgroundColor: '#2F80ED' }}
            >
              CH
            </div>
            <span className="font-semibold text-lg" style={{ color: '#1A2B4A' }}>
              CubeTech HRMS
            </span>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: '#1A2B4A' }}>
            Admin Sign In
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Enter your credentials to access the dashboard.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A2B4A' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@test.com"
                required
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all"
                style={{
                  backgroundColor: '#fff',
                  borderColor: '#D1D5DB',
                  color: '#1A2B4A',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#2F80ED')}
                onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A2B4A' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all"
                style={{
                  backgroundColor: '#fff',
                  borderColor: '#D1D5DB',
                  color: '#1A2B4A',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#2F80ED')}
                onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
              />
            </div>

            {error && (
              <div
                className="text-sm px-4 py-3 rounded-lg"
                style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-white text-sm font-semibold transition-opacity"
              style={{ backgroundColor: '#2F80ED', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-10">
            © {new Date().getFullYear()} CubeTech Innovations. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}