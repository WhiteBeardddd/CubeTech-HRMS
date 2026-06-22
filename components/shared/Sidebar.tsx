'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useSidebar } from '@/components/shared/SidebarContext'

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
        backgroundColor: '#0E1310',
        borderRight: '1px solid #1F2924',
        width: collapsed ? '5rem' : '16rem',
      }}
    >
      {/* Logo + Collapse Toggle */}
      <div className={`flex items-center mb-10 ${collapsed ? 'flex-col gap-3' : 'justify-between'}`}>
        <div className={`flex items-center gap-3 ${collapsed ? '' : 'min-w-0'}`}>
          <div
            className="w-9 h-9 shrink-0 rounded flex items-center justify-center font-bold text-sm"
            style={{ backgroundColor: '#34D399', color: '#08130D' }}
          >
            CH
          </div>
          {!collapsed && (
            <span className="font-semibold text-base tracking-wide truncate" style={{ color: '#EAF4EF' }}>
              CubeTech HRMS
            </span>
          )}
        </div>

        <button
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors"
          style={{ color: '#7C8A82' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#34D39915'
            e.currentTarget.style.color = '#34D399'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#7C8A82'
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
                backgroundColor: isActive ? '#34D399' : 'transparent',
                color: isActive ? '#08130D' : '#94A3A3',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#34D39912'
                  e.currentTarget.style.color = '#EAF4EF'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#94A3A3'
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
        style={{ color: '#94A3A3' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#F8717112'
          e.currentTarget.style.color = '#F87171'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = '#94A3A3'
        }}
      >
        <span className="shrink-0">🚪</span>
        {!collapsed && <span className="truncate">Logout</span>}
      </button>
    </div>
  )
}