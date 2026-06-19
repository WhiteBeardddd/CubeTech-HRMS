'use client'

import { useRouter, usePathname } from 'next/navigation'

// ─── Nav Items ────────────────────────────────────────────
const navItems = [
  { label: 'Dashboard', icon: '📊', href: '/dashboard' },
  { label: 'Employees', icon: '👤', href: '/employees' },
  { label: 'Salary', icon: '💰', href: '/salary' },
  { label: 'Attendance', icon: '📅', href: '/attendance' },
  { label: 'Payroll', icon: '🧾', href: '/payroll' },
]

// ─── Props ────────────────────────────────────────────────
type SidebarProps = {
  onLogout: () => void
}

// ─── Sidebar Component ────────────────────────────────────
export default function Sidebar({ onLogout }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div
      className="flex flex-col h-full w-64 fixed left-0 top-0 bottom-0 p-6"
      style={{ backgroundColor: '#1A2B4A' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div
          className="w-9 h-9 rounded flex items-center justify-center font-bold text-white text-sm"
          style={{ backgroundColor: '#2F80ED' }}
        >
          CH
        </div>
        <span className="text-white font-semibold text-base tracking-wide">
          CubeTech HRMS
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left w-full"
              style={{
                backgroundColor: isActive ? '#2F80ED' : 'transparent',
                color: isActive ? '#fff' : '#94A3B8',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.color = '#fff'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#94A3B8'
                }
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all w-full"
        style={{ color: '#94A3B8' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'
          e.currentTarget.style.color = '#fff'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = '#94A3B8'
        }}
      >
        <span>🚪</span>
        <span>Logout</span>
      </button>
    </div>
  )
}