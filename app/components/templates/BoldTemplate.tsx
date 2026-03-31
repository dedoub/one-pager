'use client'

import { OnePagerData } from '@/lib/types'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'

const CHART_COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0']

export default function BoldTemplate({ data }: { data: OnePagerData }) {
  return (
    <div className="w-full h-full bg-emerald-950 p-8 flex flex-col font-sans text-gray-100" style={{ fontSize: '10px' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-emerald-950 font-bold text-[11px]">{data.companyName.slice(0, 2)}</span>
            </div>
            <div>
              <p className="text-emerald-400 text-[10px] font-bold tracking-wider">{data.companyName}</p>
              <p className="text-[8px] text-emerald-600">{data.subtitle}</p>
            </div>
          </div>
          <h1 className="text-[22px] leading-tight text-white font-bold">
            {data.headline}{' '}
            <span className="text-emerald-400 text-[34px]">{data.highlightNumber}</span>
          </h1>
        </div>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {data.metrics.map((m, i) => (
          <div key={i} className="bg-emerald-900/50 rounded-lg p-2.5 text-center border border-emerald-800/50">
            <div className="text-[22px] font-bold text-emerald-400">
              {m.value}<span className="text-[12px]">{m.suffix}</span>
            </div>
            <div className="text-[8px] text-emerald-500 uppercase tracking-wide">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Two column */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left */}
        <div className="flex-1 flex flex-col gap-3.5">
          <p className="text-[10px] leading-relaxed text-emerald-200/80">{data.introText}</p>

          <div>
            <h2 className="text-[12px] font-bold text-emerald-400 mb-1.5 uppercase tracking-wide">{data.objectivesTitle}</h2>
            <ul className="space-y-1.5">
              {data.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 text-[8px] flex items-center justify-center shrink-0 font-bold border border-emerald-500/30">{i + 1}</span>
                  <span className="text-[9.5px] leading-snug text-emerald-100/80">{obj.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[12px] font-bold text-emerald-400 mb-1.5 uppercase tracking-wide">{data.solutionTitle}</h2>
            <p className="text-[9.5px] leading-relaxed text-emerald-100/80">{data.solutionText}</p>
          </div>

          <div>
            <h2 className="text-[12px] font-bold text-emerald-400 mb-1.5 uppercase tracking-wide">{data.resultsTitle}</h2>
            <ul className="space-y-1.5">
              {data.results.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 text-[10px]">&#x2714;</span>
                  <span className="text-[9.5px] leading-snug text-emerald-100/80">{r.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right */}
        <div className="w-[42%] flex flex-col gap-3.5">
          <div className="bg-emerald-900/40 rounded-lg p-3 border border-emerald-800/40">
            <h3 className="text-[11px] font-semibold text-emerald-300 mb-2">{data.chartTitle}</h3>
            <div className="h-[90px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData} layout="vertical" margin={{ top: 0, right: 5, bottom: 0, left: 30 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 8, fill: '#a7f3d0' }} width={35} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                    {data.chartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-emerald-900/40 rounded-lg p-3 border border-emerald-800/40">
            <h3 className="text-[11px] font-semibold text-emerald-300 mb-2">{data.chart2Title}</h3>
            <div className="h-[90px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chart2Data} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 7, fill: '#a7f3d0' }} />
                  <YAxis tick={{ fontSize: 7, fill: '#a7f3d0' }} />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/30">
            <h2 className="text-[12px] font-bold text-emerald-400 mb-1.5">{data.conclusionTitle}</h2>
            <p className="text-[9.5px] leading-relaxed text-emerald-200/80">{data.conclusionText}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-emerald-800/50 flex justify-between items-center">
        <p className="text-[7px] text-emerald-700">{data.companyName} &copy; 2024 — Confidential</p>
        <p className="text-[7px] text-emerald-700">Generated with One-Pager Generator</p>
      </div>
    </div>
  )
}
