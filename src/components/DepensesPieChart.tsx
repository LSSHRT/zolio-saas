"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface CategorySlice {
  name: string;
  value: number;
}

const COLORS = [
  "#7c3aed",
  "#a855f7",
  "#c084fc",
  "#6366f1",
  "#818cf8",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
];

export default function DepensesPieChart({ data }: { data: CategorySlice[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          stroke="none"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          content={({ payload }) => {
            if (!payload || !payload[0]) return null;
            const val = payload[0].value as number;
            const name = payload[0].name as string;
            return (
              <div className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
                <span className="text-slate-300">{name}</span>:{" "}
                <span className="font-bold">{val.toFixed(2)}€</span>
              </div>
            );
          }}
        />
        <Legend verticalAlign="bottom" height={36} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}
