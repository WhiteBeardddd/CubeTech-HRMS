'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/components/SidebarContext'

// ─── Types ───────────────────────────────────────────────
type DashboardStats = {
  totalEmployees: number
  activeEmployees: number
  onLeave: number
  totalMonthlyPayroll: number
}

// ─── Stat Card Component ──────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: string | number
  icon: string
  accent: string
}) {
  return (
    <div
      className="bg-white rounded-xl p-6 flex items-center gap-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ border: '1px solid #E5E7EB' }}
    >
      <div
        className="w-12 h-12 shrink-0 rounded-lg flex items-center justify-center text-xl"
        style={{ backgroundColor: accent + '18' }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 mb-1 tracking-wide">{label}</p>
        <p className="text-2xl font-bold leading-tight truncate" style={{ color: '#1A2B4A' }}>
          {value}
        </p>
      </div>
    </div>
  )
}

// ─── Skeleton Stat Card (loading state) ───────────────────
function StatCardSkeleton() {
  return (
    <div
      className="bg-white rounded-xl p-6 flex items-center gap-4 shadow-sm animate-pulse"
      style={{ border: '1px solid #E5E7EB' }}
    >
      <div className="w-12 h-12 shrink-0 rounded-lg" style={{ backgroundColor: '#F1F5F9' }} />
      <div className="flex-1">
        <div className="h-3 w-20 rounded mb-2" style={{ backgroundColor: '#F1F5F9' }} />
        <div className="h-6 w-16 rounded" style={{ backgroundColor: '#F1F5F9' }} />
      </div>
    </div>
  )
}

// ─── Main Dashboard Page ──────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const { collapsed } = useSidebar()
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    onLeave: 0,
    totalMonthlyPayroll: 0,
  })
  const [adminEmail, setAdminEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const admin = localStorage.getItem('admin')
    if (!admin) {
      router.push('/login')
      return
    }
    const parsed = JSON.parse(admin)
    setAdminEmail(parsed.email)
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)

    // Total = Active + On Leave only (excludes Resigned)
    const { count: total } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .neq('employment_status', 'Resigned')

    const { count: active } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('employment_status', 'Active')

    const { count: onLeave } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('employment_status', 'On Leave')

    const { data: salaryData } = await supabase
      .from('salaries')
      .select('net_salary')

    const totalPayroll =
      salaryData?.reduce((sum, row) => sum + (row.net_salary || 0), 0) ?? 0

    setStats({
      totalEmployees: total ?? 0,
      activeEmployees: active ?? 0,
      onLeave: onLeave ?? 0,
      totalMonthlyPayroll: totalPayroll,
    })

    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin')
    router.push('/login')
  }

  const firstName = adminEmail ? adminEmail.split('@')[0] : ''

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F0F2F5' }}>
      {/* ── Sidebar ── */}
      <Sidebar onLogout={handleLogout} />

      {/* ── Main Content ── */}
      <div
        className="flex-1 px-8 py-7 transition-all duration-200"
        style={{ marginLeft: collapsed ? '5rem' : '16rem' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-[26px] font-bold leading-tight" style={{ color: '#1A2B4A' }}>
              Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">
              Welcome back, <span className="font-medium" style={{ color: '#475569' }}>{firstName}</span>
            </p>
          </div>
          <div
            className="text-xs font-medium px-3.5 py-2 rounded-lg"
            style={{ backgroundColor: '#fff', color: '#64748B', border: '1px solid #E5E7EB' }}
          >
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard label="Total Employees" value={stats.totalEmployees} icon="👥" accent="#2F80ED" />
              <StatCard label="Active Employees" value={stats.activeEmployees} icon="✅" accent="#10B981" />
              <StatCard label="Employees on Leave" value={stats.onLeave} icon="🏖️" accent="#F59E0B" />
              <StatCard
                label="Total Monthly Payroll"
                value={`₱${stats.totalMonthlyPayroll.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
                icon="💰"
                accent="#8B5CF6"
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3.5">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Manage Employees', href: '/employees', icon: '👤', color: '#2F80ED' },
              { label: 'Manage Salary', href: '/salary', icon: '💰', color: '#10B981' },
              { label: 'Record Attendance', href: '/attendance', icon: '📅', color: '#F59E0B' },
              { label: 'View Payroll', href: '/payroll', icon: '🧾', color: '#8B5CF6' },
            ].map((item) => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="group bg-white rounded-xl p-5 text-left transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                style={{ border: '1px solid #E5E7EB' }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-4"
                  style={{ backgroundColor: item.color + '18' }}
                >
                  {item.icon}
                </div>
                <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>
                  {item.label}
                </p>
                <p
                  className="text-xs mt-1 transition-colors"
                  style={{ color: '#94A3B8' }}
                >
                  <span className="group-hover:underline">Go to module</span>
                  <span className="inline-block transition-transform group-hover:translate-x-0.5 ml-1">→</span>
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}