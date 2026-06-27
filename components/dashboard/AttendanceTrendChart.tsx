'use client'

import { useEffect, useState } from 'react'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

type AttendanceTrend = {
  date: string
  Present: number
  Absent: number
  Late: number
  onLeave: number
}

export default function AttendanceTrendChart() {
  const [data, setData] = useState<AttendanceTrend[]>([])
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
      style={{
        backgroundColor: '#12161A',
        borderColor: '#1F2924',
      }}
    >
      <h3
        className="mb-5 text-xs font-semibold uppercase tracking-[0.28em]"
        style={{ color: '#7C8A82' }}
      >
        Attendance Trend (Last 30 Days)
      </h3>

      {loading ? (
        <div
          className="h-72 flex items-center justify-center text-sm"
          style={{ color: '#7C8A82' }}
        >
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div
          className="h-72 flex items-center justify-center text-sm"
          style={{ color: '#7C8A82' }}
        >
          No attendance records yet
        </div>
      ) : (
        <div className="w-full min-w-0">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={data}
              margin={{
                top: 20,
                right: 20,
                left: 0,
                bottom: 10,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1F2924"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                stroke="#1F2924"
                minTickGap={25}
                tick={{
                  fill: '#7C8A82',
                  fontSize: 12,
                }}
                tickFormatter={(value) => {
                  if (!value) return ''
                  const parts = value.split('-')
                  if (parts.length !== 3) return value
                  const [year, month, day] = parts.map(Number)
                  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
                  return `${months[month - 1]} ${day}`
                }}
              />

              <YAxis
                allowDecimals={false}
                stroke="#1F2924"
                tick={{
                  fill: '#7C8A82',
                  fontSize: 12,
                }}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#181F1B',
                  border: '1px solid #1F2924',
                  borderRadius: 12,
                }}
                labelFormatter={(value) => {
                  if (!value) return ''
                  const parts = (value as string).split('-')
                  if (parts.length !== 3) return value
                  const [year, month, day] = parts.map(Number)
                  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
                  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
                  const weekday = days[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
                  return `${weekday}, ${months[month - 1]} ${day}`
                }}
              />

              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{
                  fontSize: 12,
                }}
              />

              <Line
                type="monotone"
                dataKey="Present"
                name="Present"
                stroke="#34D399"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />

              <Line
                type="monotone"
                dataKey="Absent"
                name="Absent"
                stroke="#F87171"
                strokeWidth={2}
                dot={{ r: 4 }}
              />

              <Line
                type="monotone"
                dataKey="Late"
                name="Late"
                stroke="#F5A623"
                strokeWidth={2}
                dot={{ r: 4 }}
              />

              <Line
                type="monotone"
                dataKey="onLeave"
                name="On Leave"
                stroke="#60A5FA"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}