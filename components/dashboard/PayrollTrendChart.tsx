"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2924" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#7C8A82" }} stroke="#1F2924" />
            <YAxis
              tick={{ fontSize: 12, fill: "#7C8A82" }}
              stroke="#1F2924"
              tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#181F1B",
                border: "1px solid #1F2924",
                borderRadius: 12,
              }}
              labelStyle={{ color: "#7C8A82" }}
              itemStyle={{ color: "#EAF4EF" }}
              formatter={(value: any) => [`₱${Number(value).toLocaleString()}`, "Total Payroll"]}
            />
            <Bar dataKey="total" fill="#34D399" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}