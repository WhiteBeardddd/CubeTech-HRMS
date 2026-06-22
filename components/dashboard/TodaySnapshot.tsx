'use client'

import { useEffect, useState } from 'react'

const STATUS_CONFIG = [
  { key: 'Present', color: '#34D399', icon: '✅' },
  { key: 'Late', color: '#F5A623', icon: '⏰' },
  { key: 'Absent', color: '#EF4444', icon: '❌' },
  { key: 'On Leave', color: '#3B82F6', icon: '🏖️' },
]

export default function TodaySnapshot() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [latestDate, setLatestDate] = useState('')

  useEffect(() => {
    fetch('/api/attendance/today')
      .then((res) => res.json())
      .then(({ date, counts }) => {
        setLatestDate(date)
        setCounts(counts)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const formattedDate = latestDate
    ? new Date(latestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : ''

  return (
    <div
      className="rounded-[24px] border p-6 h-full"
      style={{ backgroundColor: '#12161A', borderColor: '#1F2924' }}
    >
      <h3
        className="text-xs font-semibold uppercase tracking-[0.28em] mb-4"
        style={{ color: '#7C8A82' }}
      >
        Today's Snapshot {formattedDate && `(${formattedDate})`}
      </h3>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: '#1A211D' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {STATUS_CONFIG.map(({ key, color, icon }) => (
            <div
              key={key}
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ backgroundColor: `${color}14`, border: `1px solid ${color}33` }}
            >
              <span className="text-xl">{icon}</span>
              <div>
                <p className="text-2xl font-semibold" style={{ color: '#EAF4EF' }}>
                  {counts[key] || 0}
                </p>
                <p className="text-[10px] uppercase tracking-wide" style={{ color: '#7C8A82' }}>
                  {key}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}