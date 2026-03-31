'use client'

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

export function PriceChart({ data }: { data: { date: string; price: number }[] }) {
  if (!data.length) return <div className="h-32 flex items-center justify-center text-xs text-slate-600">No data</div>

  const simplified = data.map((d, i) => ({
    ...d,
    label: i % Math.ceil(data.length / 6) === 0 ? d.date.slice(5) : '',
  }))

  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={simplified}>
        <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#64748b' }} />
        <YAxis tick={{ fontSize: 8, fill: '#64748b' }} width={40} domain={['auto', 'auto']} />
        <Tooltip contentStyle={{ fontSize: 10, background: '#1e293b', border: '1px solid #334155', borderRadius: 6 }} labelStyle={{ color: '#94a3b8' }} />
        <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function RevenueTrendChart({ data }: { data: { quarter: string; revenue: number }[] }) {
  if (!data.length) return <div className="h-32 flex items-center justify-center text-xs text-slate-600">No quarterly data</div>

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data}>
        <XAxis dataKey="quarter" tick={{ fontSize: 8, fill: '#64748b' }} />
        <YAxis tick={{ fontSize: 8, fill: '#64748b' }} width={40} />
        <Tooltip contentStyle={{ fontSize: 10, background: '#1e293b', border: '1px solid #334155', borderRadius: 6 }} />
        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
      </BarChart>
    </ResponsiveContainer>
  )
}
