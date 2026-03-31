'use client'

import { OnePagerData } from '@/lib/types'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'

const CHART_COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff']

export default function ModernTemplate({ data }: { data: OnePagerData }) {
  return (
    <div className="w-full h-full bg-white p-8 flex flex-col font-sans text-gray-800" style={{ fontSize: '10px' }}>
      {/* Header - dark top bar */}
      <div className="bg-slate-900 rounded-xl p-5 mb-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-indigo-400 mb-1">{data.subtitle}</p>
            <h1 className="text-[20px] leading-tight text-white font-semibold">
              {data.headline}{' '}
              <span className="text-indigo-400 text-[30px] font-bold">{data.highlightNumber}</span>
            </h1>
          </div>
          <div className="bg-indigo-600 rounded-lg px-3 py-2 text-center">
            <span className="text-white text-[10px] font-bold tracking-wider">{data.companyName}</span>
          </div>
        </div>
      </div>

      {/* Metrics bar */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {data.metrics.map((m, i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-[22px] font-bold text-indigo-600">
              {m.value}<span className="text-[13px]">{m.suffix}</span>
            </div>
            <div className="text-[8px] text-slate-500 uppercase tracking-wide mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Two column */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left */}
        <div className="flex-1 flex flex-col gap-3.5">
          <p className="text-[10px] leading-relaxed text-slate-600">{data.introText}</p>

          <div>
            <h2 className="text-[12px] font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
              <span className="w-1 h-4 bg-indigo-500 rounded-full" />
              {data.objectivesTitle}
            </h2>
            <ul className="space-y-1.5 ml-3">
              {data.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded bg-indigo-100 text-indigo-600 text-[8px] flex items-center justify-center shrink-0 font-bold">{i + 1}</span>
                  <span className="text-[9.5px] leading-snug text-slate-600">{obj.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[12px] font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
              <span className="w-1 h-4 bg-indigo-500 rounded-full" />
              {data.solutionTitle}
            </h2>
            <p className="text-[9.5px] leading-relaxed text-slate-600 ml-3">{data.solutionText}</p>
          </div>

          <div>
            <h2 className="text-[12px] font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
              <span className="w-1 h-4 bg-indigo-500 rounded-full" />
              {data.resultsTitle}
            </h2>
            <ul className="space-y-1.5 ml-3">
              {data.results.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-indigo-500 text-[10px]">&#x25B6;</span>
                  <span className="text-[9.5px] leading-snug text-slate-600">{r.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right */}
        <div className="w-[42%] flex flex-col gap-3.5">
          <div className="bg-slate-50 rounded-lg p-3">
            <h3 className="text-[11px] font-semibold text-slate-800 mb-2">{data.chartTitle}</h3>
            <div className="h-[90px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData} layout="vertical" margin={{ top: 0, right: 5, bottom: 0, left: 30 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 8 }} width={35} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={12}>
                    {data.chartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-3">
            <h3 className="text-[11px] font-semibold text-slate-800 mb-2">{data.chart2Title}</h3>
            <div className="h-[90px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chart2Data} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 7 }} />
                  <YAxis tick={{ fontSize: 7 }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-lg p-3">
            <h2 className="text-[12px] font-bold text-indigo-900 mb-1.5">{data.conclusionTitle}</h2>
            <p className="text-[9.5px] leading-relaxed text-indigo-800">{data.conclusionText}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
        <p className="text-[7px] text-slate-400">{data.companyName} &copy; 2024 — Confidential</p>
        <p className="text-[7px] text-slate-400">Generated with One-Pager Generator</p>
      </div>
    </div>
  )
}
