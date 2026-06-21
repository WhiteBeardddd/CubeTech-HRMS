"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getDepartmentBreakdown } from "@/lib/analytics";

const COLORS = ["#34D399", "#2DD4BF", "#A7F3D0", "#F5A623", "#60A5FA", "#C4B5FD", "#F87171"];

export default function DepartmentBreakdownChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDepartmentBreakdown()
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
        Employees by Department
      </h3>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-sm" style={{ color: "#7C8A82" }}>
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm" style={{ color: "#7C8A82" }}>
          No department data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={(entry) => `${entry.name}: ${entry.value}`}
              labelLine={{ stroke: "#7C8A82" }}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#181F1B",
                border: "1px solid #1F2924",
                borderRadius: 12,
              }}
              itemStyle={{ color: "#EAF4EF" }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "#7C8A82" }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}