'use client'

import { OnePagerData } from '@/lib/types'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'

const CHART_COLORS = ['#b45309', '#d97706', '#f59e0b', '#fbbf24', '#fde68a']

export default function WarmTemplate({ data }: { data: OnePagerData }) {
  return (
    <div className="w-full h-full bg-amber-50 p-8 flex flex-col font-sans text-gray-800" style={{ fontSize: '10px' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex-1">
          <p className="text-[9px] uppercase tracking-widest text-amber-700 mb-1">{data.subtitle}</p>
          <h1 className="font-serif text-[22px] leading-tight text-gray-900">
            {data.headline}{' '}
            <span className="text-amber-600 text-[32px] font-bold">{data.highlightNumber}</span>
          </h1>
        </div>
        <div className="text-right ml-4">
          <div className="w-12 h-12 bg-amber-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-serif text-[11px] font-bold">{data.companyName.slice(0, 2)}</span>
          </div>
          <p className="text-[8px] mt-1 text-amber-800 font-medium tracking-wider">{data.companyName}</p>
        </div>
      </div>

      <div className="w-full h-px bg-amber-300 mb-5" />

      {/* Two column layout */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left column */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Intro */}
          <p className="text-[10px] leading-relaxed text-gray-700">{data.introText}</p>

          {/* Objectives */}
          <div>
            <h2 className="font-serif text-[13px] font-semibold text-amber-800 mb-2">{data.objectivesTitle}</h2>
            <ul className="space-y-1.5">
              {data.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <span className="text-[9.5px] leading-snug text-gray-700">{obj.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Solution */}
          <div>
            <h2 className="font-serif text-[13px] font-semibold text-amber-800 mb-2">{data.solutionTitle}</h2>
            <p className="text-[9.5px] leading-relaxed text-gray-700">{data.solutionText}</p>
          </div>

          {/* Results */}
          <div>
            <h2 className="font-serif text-[13px] font-semibold text-amber-800 mb-2">{data.resultsTitle}</h2>
            <ul className="space-y-1.5">
              {data.results.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-600 text-[9px]">&#x2714;</span>
                  <span className="text-[9.5px] leading-snug text-gray-700">{r.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right column */}
        <div className="w-[42%] flex flex-col gap-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2">
            {data.metrics.map((m, i) => (
              <div key={i} className="bg-white rounded-lg p-2.5 text-center">
                <div className="text-[20px] font-bold text-amber-700">
                  {m.value}<span className="text-[12px]">{m.suffix}</span>
                </div>
                <div className="text-[8px] text-gray-500 uppercase tracking-wide">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Chart 1 - Horizontal bars */}
          <div className="bg-white rounded-lg p-3">
            <h3 className="text-[11px] font-semibold text-gray-800 mb-2">{data.chartTitle}</h3>
            <div className="h-[90px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData} layout="vertical" margin={{ top: 0, right: 5, bottom: 0, left: 30 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 8 }} width={35} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                    {data.chartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2 - Vertical bars */}
          <div className="bg-white rounded-lg p-3">
            <h3 className="text-[11px] font-semibold text-gray-800 mb-2">{data.chart2Title}</h3>
            <div className="h-[90px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chart2Data} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 7 }} />
                  <YAxis tick={{ fontSize: 7 }} />
                  <Bar dataKey="value" fill="#d97706" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Conclusion */}
          <div>
            <h2 className="font-serif text-[13px] font-semibold text-amber-800 mb-2">{data.conclusionTitle}</h2>
            <p className="text-[9.5px] leading-relaxed text-gray-700">{data.conclusionText}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-amber-200 flex justify-between items-center">
        <p className="text-[7px] text-amber-700">{data.companyName} &copy; 2024 — Confidential</p>
        <p className="text-[7px] text-amber-600">Generated with One-Pager Generator</p>
      </div>
    </div>
  )
}
