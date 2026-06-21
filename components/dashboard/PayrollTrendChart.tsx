"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getPayrollTrend } from "@/lib/analytics";

export default function PayrollTrendChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPayrollTrend(6)
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className="rounded-[24px] border p-6"
      style={{ backgroundColor: "#12161A", borderColor: "#1F2924" }}
    >
      <h3
        className="text-xs font-semibold uppercase tracking-[0.28em] mb-5"
        style={{ color: "#7C8A82" }}
      >
        Payroll Trend (Last 6 Months)
      </h3>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-sm" style={{ color: "#7C8A82" }}>
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm" style={{ color: "#7C8A82" }}>
          No payroll records yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="payrollGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34D399" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2924" vertical={false} />
            <XAxis dataKey="month" stroke="#7C8A82" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#7C8A82" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#12161A', border: '1px solid #1F2924', borderRadius: 12 }}
              labelStyle={{ color: '#EAF4EF' }}
              itemStyle={{ color: '#EAF4EF' }}
            />
            <Area type="monotone" dataKey="total" stroke="#34D399" strokeWidth={2} fill="url(#payrollGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}