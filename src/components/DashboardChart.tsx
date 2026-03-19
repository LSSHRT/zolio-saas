"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MonthlyDatum = {
  name: string;
  CA: number;
};

export default function DashboardChart({ monthlyData }: { monthlyData: MonthlyDatum[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const chartColors = useMemo(
    () => ({
      grid: isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(148, 163, 184, 0.22)",
      tick: isDark ? "#94a3b8" : "#64748b",
      tooltipBg: isDark ? "rgba(7, 12, 24, 0.96)" : "rgba(255, 255, 255, 0.96)",
      tooltipBorder: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(124, 58, 237, 0.12)",
      tooltipText: isDark ? "#f8fafc" : "#0f172a",
      areaStart: isDark ? "rgba(124, 58, 237, 0.34)" : "rgba(124, 58, 237, 0.26)",
      areaMid: isDark ? "rgba(217, 70, 239, 0.18)" : "rgba(217, 70, 239, 0.14)",
      areaEnd: "rgba(217, 70, 239, 0)",
    }),
    [isDark],
  );

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
      <AreaChart data={monthlyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="client-dashboard-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColors.areaStart} />
            <stop offset="55%" stopColor={chartColors.areaMid} />
            <stop offset="100%" stopColor={chartColors.areaEnd} />
          </linearGradient>
          <linearGradient id="client-dashboard-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="60%" stopColor="#d946ef" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          dy={8}
          tick={{ fontSize: 11, fill: chartColors.tick }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          width={56}
          tick={{ fontSize: 11, fill: chartColors.tick }}
          tickFormatter={(value) => `${value}€`}
        />
        <Tooltip
          cursor={{ stroke: "#c4b5fd", strokeWidth: 1, strokeDasharray: "4 4" }}
          contentStyle={{
            borderRadius: "18px",
            border: `1px solid ${chartColors.tooltipBorder}`,
            boxShadow: "0 18px 48px -24px rgba(15, 23, 42, 0.35)",
            background: chartColors.tooltipBg,
            backdropFilter: "blur(10px)",
          }}
          labelStyle={{ color: chartColors.tooltipText, fontWeight: 600 }}
          itemStyle={{ color: chartColors.tooltipText, fontWeight: 600 }}
          formatter={(value) => [
            new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
              maximumFractionDigits: 0,
            }).format(typeof value === "number" ? value : Number(value) || 0),
            "CA HT",
          ]}
        />
        <Area
          type="monotone"
          dataKey="CA"
          stroke="url(#client-dashboard-stroke)"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#client-dashboard-area)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
