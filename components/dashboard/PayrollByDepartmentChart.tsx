'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { supabase } from '@/lib/supabase'

const DEPT_COLORS: Record<string, string> = {
  Finance: '#2DD4BF',
  HR: '#3B82F6',
  Marketing: '#A7F3D0',
  Operations: '#F5A623',
  'Software Development': '#34D399',
}

type DeptPayroll = {
  department: string
  total: number
}

export default function PayrollByDepartmentChart() {
  const [data, setData] = useState<DeptPayroll[]>([])
  const [latestDate, setLatestDate] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    const { data: latest } = await supabase
      .from('payroll')
      .select('payroll_date')
      .order('payroll_date', { ascending: false })
      .limit(1)
      .single()

    if (!latest) {
      setLoading(false)
      return
    }

    setLatestDate(latest.payroll_date)

    const { data: rows } = await supabase
      .from('payroll')
      .select('net_salary, employees(department)')
      .eq('payroll_date', latest.payroll_date)

    const totals: Record<string, number> = {}
    rows?.forEach((row: any) => {
      const dept = row.employees?.department
      if (!dept) return
      totals[dept] = (totals[dept] || 0) + (row.net_salary || 0)
    })

    const formatted = Object.entries(totals)
      .map(([department, total]) => ({ department, total }))
      .sort((a, b) => b.total - a.total)

    setData(formatted)
    setLoading(false)
  }

  const formattedDate = latestDate
    ? new Date(latestDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : ''

  return (
    <div
      className="rounded-[24px] border p-6"
      style={{ backgroundColor: '#12161A', borderColor: '#1F2924' }}
    >
      <h3
        className="text-xs font-semibold uppercase tracking-[0.28em] mb-4"
        style={{ color: '#7C8A82' }}
      >
        Payroll Cost by Department {formattedDate && `(${formattedDate})`}
      </h3>

      {loading ? (
        <div className="h-[280px] animate-pulse rounded-xl" style={{ backgroundColor: '#1A211D' }} />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2924" vertical={false} />
            <XAxis
              dataKey="department"
              stroke="#7C8A82"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={50}
            />
            <YAxis
              stroke="#7C8A82"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#12161A', border: '1px solid #1F2924', borderRadius: 12 }}
              labelStyle={{ color: '#EAF4EF' }}
              itemStyle={{ color: '#EAF4EF' }}
              formatter={(value: any) => [`₱${Number(value).toLocaleString('en-PH')}`, 'Total Payroll']}
            />
            <Bar dataKey="total" radius={[8, 8, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.department} fill={DEPT_COLORS[entry.department] || '#34D399'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}