'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function AttendanceTrendChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/attendance/trend')
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div
      className="rounded-[24px] border p-6"
      style={{ backgroundColor: '#12161A', borderColor: '#1F2924' }}
    >
      <h3
        className="text-xs font-semibold uppercase tracking-[0.28em] mb-5"
        style={{ color: '#7C8A82' }}
      >
        Attendance Trend (Last 30 Days)
      </h3>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-sm" style={{ color: '#7C8A82' }}>
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm" style={{ color: '#7C8A82' }}>
          No attendance records yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2924" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#7C8A82' }} stroke="#1F2924" />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#7C8A82' }} stroke="#1F2924" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#181F1B',
                border: '1px solid #1F2924',
                borderRadius: 12,
              }}
              labelStyle={{ color: '#7C8A82' }}
              itemStyle={{ color: '#EAF4EF' }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: '#7C8A82' }} />
            <Line type="monotone" dataKey="Present" stroke="#34D399" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Absent" stroke="#F87171" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Late" stroke="#F5A623" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="On Leave" stroke="#60A5FA" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}