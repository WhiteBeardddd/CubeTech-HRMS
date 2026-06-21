'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/components/SidebarContext'
import AttendanceTrendChart from "@/components/dashboard/AttendanceTrendChart";
import PayrollTrendChart from "@/components/dashboard/PayrollTrendChart";
import DepartmentBreakdownChart from "@/components/dashboard/DepartmentBreakdownChart";
import RecentActivity from "@/components/dashboard/RecentActivity";

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
      className="rounded-[24px] border p-6 transition-all duration-200 hover:-translate-y-0.5"
      style={{ backgroundColor: '#12161A', borderColor: '#1F2924' }}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-3xl text-2xl"
          style={{ backgroundColor: `${accent}1F`, color: accent }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: '#7C8A82' }}>
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold truncate" style={{ color: '#EAF4EF' }}>
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton Stat Card (loading state) ───────────────────
function StatCardSkeleton() {
  return (
    <div
      className="rounded-[24px] border p-6 animate-pulse"
      style={{ backgroundColor: '#12161A', borderColor: '#1F2924' }}
    >
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-3xl" style={{ backgroundColor: '#1A211D' }} />
        <div className="min-w-0 grow space-y-3">
          <div className="h-3 w-24 rounded-full" style={{ backgroundColor: '#1A211D' }} />
          <div className="h-10 w-32 rounded-full" style={{ backgroundColor: '#1A211D' }} />
        </div>
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
    <div className="flex min-h-screen" style={{ backgroundColor: '#0A0E0C' }}>
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
            <h1 className="text-[26px] font-bold leading-tight" style={{ color: '#EAF4EF' }}>
              Dashboard
            </h1>
            <p className="text-sm mt-1.5" style={{ color: '#7C8A82' }}>
              Welcome back, <span className="font-medium" style={{ color: '#A8B8AF' }}>{firstName}</span>
            </p>
          </div>
          <div
            className="text-xs font-medium px-3.5 py-2 rounded-lg"
            style={{ backgroundColor: '#12161A', color: '#A8B8AF', border: '1px solid #1F2924' }}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard label="Total Employees" value={stats.totalEmployees} icon="👥" accent="#34D399" />
              <StatCard label="Active Employees" value={stats.activeEmployees} icon="✅" accent="#22C55E" />
              <StatCard label="Employees on Leave" value={stats.onLeave} icon="🏖️" accent="#F5A623" />
              <StatCard
                label="Total Monthly Payroll"
                value={`₱${stats.totalMonthlyPayroll.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
                icon="💰"
                accent="#2DD4BF"
              />
            </>
          )}
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <RecentActivity />
        </div>

        {/* Analytics */}
        <div>
          <h2
            className="text-xs font-semibold uppercase tracking-[0.28em] mb-4"
            style={{ color: '#7C8A82' }}
          >
            Analytics
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttendanceTrendChart />
            <PayrollTrendChart />
            <div className="lg:col-span-2">
              <DepartmentBreakdownChart />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}