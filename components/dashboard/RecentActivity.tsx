'use client'

import { useEffect, useState } from 'react'

type ActivityItem = {
  id: string
  type: 'attendance' | 'payroll'
  name: string
  detail: string
  date: string
}

const statusColor = (status: string) => {
  switch (status) {
    case 'Present': return '#34D399'
    case 'Late': return '#F5A623'
    case 'Absent': return '#F87171'
    case 'On Leave': return '#60A5FA'
    default: return '#7C8A82'
  }
}

export default function RecentActivity() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/activity/recent')
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.slice(0, 6).map((item: any) => ({
          id: item.id,
          type: item.type,
          name: item.name,
          detail: item.type === 'payroll'
            ? `₱${Number(item.amount).toLocaleString()}`
            : item.status,
          date: item.date,
        }))
        setItems(formatted)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div
      className="rounded-[24px] border p-6"
      style={{ backgroundColor: '#12161A', borderColor: '#1F2924' }}
    >
      <h2
        className="text-xs font-semibold uppercase tracking-[0.28em] mb-5"
        style={{ color: '#7C8A82' }}
      >
        Recent Activity
      </h2>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-xl animate-pulse"
              style={{ backgroundColor: '#1A211D' }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm" style={{ color: '#7C8A82' }}>
          No recent activity yet.
        </p>
      ) : (
        <div>
          {items.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3.5"
              style={{
                borderBottom: i === items.length - 1 ? 'none' : '1px solid #1A211D',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm"
                  style={{
                    backgroundColor: item.type === 'payroll' ? '#2DD4BF20' : '#34D39920',
                    color: item.type === 'payroll' ? '#2DD4BF' : '#34D399',
                  }}
                >
                  {item.type === 'payroll' ? '🧾' : '📅'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#EAF4EF' }}>
                    {item.name}
                  </p>
                  <p className="text-xs" style={{ color: '#7C8A82' }}>
                    {item.type === 'payroll' ? 'Payroll processed' : 'Attendance logged'}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p
                  className="text-xs font-semibold"
                  style={{
                    color: item.type === 'attendance' ? statusColor(item.detail) : '#EAF4EF',
                  }}
                >
                  {item.detail}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: '#7C8A82' }}>
                  {new Date(item.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}