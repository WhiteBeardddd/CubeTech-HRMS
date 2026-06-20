'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useSidebar } from '@/components/SidebarContext'

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
  const { collapsed, toggle } = useSidebar()

  return (
    <div
      className="flex flex-col h-full fixed left-0 top-0 bottom-0 p-4 transition-all duration-200 z-40"
      style={{
        backgroundColor: '#1A2B4A',
        width: collapsed ? '5rem' : '16rem',
      }}
    >
      {/* Logo + Collapse Toggle */}
      <div className={`flex items-center mb-10 ${collapsed ? 'flex-col gap-3' : 'justify-between'}`}>
        <div className={`flex items-center gap-3 ${collapsed ? '' : 'min-w-0'}`}>
          <div
            className="w-9 h-9 shrink-0 rounded flex items-center justify-center font-bold text-white text-sm"
            style={{ backgroundColor: '#2F80ED' }}
          >
            CH
          </div>
          {!collapsed && (
            <span className="text-white font-semibold text-base tracking-wide truncate">
              CubeTech HRMS
            </span>
          )}
        </div>

        <button
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors"
          style={{ color: '#94A3B8' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#94A3B8'
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: collapsed ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left w-full ${
                collapsed ? 'justify-center' : ''
              }`}
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
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={onLogout}
        title={collapsed ? 'Logout' : undefined}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all w-full ${
          collapsed ? 'justify-center' : ''
        }`}
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
        <span className="shrink-0">🚪</span>
        {!collapsed && <span className="truncate">Logout</span>}
      </button>
    </div>
  )
}