"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DashboardChart({ monthlyData }: { monthlyData: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
      <AreaChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
            <stop offset="50%" stopColor="#d946ef" stopOpacity={0.15}/>
            <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val}€`} />
        <Tooltip 
          cursor={{ stroke: '#c4b5fd', strokeWidth: 1, strokeDasharray: '3 3' }}
          contentStyle={{ borderRadius: '16px', border: '1px solid rgba(124, 58, 237, 0.1)', boxShadow: '0 10px 30px -5px rgba(124, 58, 237, 0.15)', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)' }}
          itemStyle={{ color: '#5b21b6', fontWeight: 'bold' }}
          formatter={(value: any) => [`${value}€`, 'CA HT']}
        />
        <Area type="monotone" dataKey="CA" stroke="url(#strokeGradient)" strokeWidth={3} fillOpacity={1} fill="url(#colorCA)" />
        <defs>
          <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
      </AreaChart>
    </ResponsiveContainer>
  );
}
