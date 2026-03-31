'use client'

import type { ReportData, ReportHeader, ReportValuation, ReportGrowth, ReportCharts, ReportThesis, ReportVerdict } from '@/lib/types'
import ReportSection from './ReportSection'
import AnimatedNumber from './AnimatedNumber'
import { PriceChart, RevenueTrendChart } from './ChartSection'

function MetricRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-medium">{children}</span>
    </div>
  )
}

function VerdictBadge({ result }: { result: string }) {
  const colors: Record<string, string> = {
    pass_tier1: 'bg-emerald-500/20 text-emerald-400',
    pass_tier2: 'bg-blue-500/20 text-blue-400',
    watch: 'bg-amber-500/20 text-amber-400',
    fail: 'bg-red-500/20 text-red-400',
  }
  const labels: Record<string, string> = {
    pass_tier1: 'PASS — TIER 1',
    pass_tier2: 'PASS — TIER 2',
    watch: 'WATCH',
    fail: 'FAIL',
  }
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${colors[result] ?? colors.watch}`}>
      {labels[result] ?? result}
    </span>
  )
}

export default function ReportView({ data, sectionUpdates, generating }: {
  data: Partial<ReportData>
  sectionUpdates: Map<string, unknown>
  generating: boolean
}) {
  const header = (sectionUpdates.get('header') ?? data.header) as ReportHeader | undefined
  const valuation = (sectionUpdates.get('valuation') ?? data.valuation) as ReportValuation | undefined
  const growth = (sectionUpdates.get('growth') ?? data.growth) as ReportGrowth | undefined
  const charts = (sectionUpdates.get('charts') ?? data.charts) as ReportCharts | undefined
  const thesis = (sectionUpdates.get('thesis') ?? data.thesis) as ReportThesis | undefined
  const verdict = (sectionUpdates.get('verdict') ?? data.verdict) as ReportVerdict | undefined

  return (
    <div className="max-w-3xl mx-auto space-y-4" id="report-content">
      {/* Header */}
      <ReportSection title="" filled={!!header}>
        {header && (
          <div className="bg-gradient-to-r from-slate-800 to-blue-900/40 rounded-lg p-5">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-white">{header.companyName}</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {header.ticker} &bull; {header.exchange} {header.sector && `\u2022 ${header.sector}`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">${header.currentPrice?.toLocaleString()}</div>
                <div className="text-xs text-slate-400">MCap {header.marketCap}</div>
              </div>
            </div>
            <div className="flex gap-4 mt-3 text-xs text-slate-400">
              <span>52W High: ${header.high52w?.toLocaleString()}</span>
              <span className={header.gapFromHigh < 0 ? 'text-red-400' : 'text-emerald-400'}>
                Gap: {header.gapFromHigh?.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </ReportSection>

      {/* Valuation + Growth grid */}
      <div className="grid grid-cols-2 gap-4">
        <ReportSection title="Valuation" filled={!!valuation} className="bg-slate-800/40 p-4">
          {valuation && (
            <div className="space-y-1.5">
              <MetricRow label="P/E"><AnimatedNumber value={valuation.pe} suffix="x" /></MetricRow>
              <MetricRow label="P/S"><AnimatedNumber value={valuation.ps} suffix="x" /></MetricRow>
              <MetricRow label="EV/EBITDA"><AnimatedNumber value={valuation.evEbitda} suffix="x" /></MetricRow>
              <MetricRow label="PEG"><AnimatedNumber value={valuation.peg} suffix="x" /></MetricRow>
              <MetricRow label="P/B"><AnimatedNumber value={valuation.pbr} suffix="x" /></MetricRow>
            </div>
          )}
        </ReportSection>

        <ReportSection title="Growth &amp; Margins" filled={!!growth} className="bg-slate-800/40 p-4">
          {growth && (
            <div className="space-y-1.5">
              <MetricRow label="Revenue Growth">
                <span className={(growth.revenueGrowthYoy ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  <AnimatedNumber value={growth.revenueGrowthYoy ? growth.revenueGrowthYoy * 100 : null} suffix="%" />
                </span>
              </MetricRow>
              <MetricRow label="Gross Margin"><AnimatedNumber value={growth.grossMargin ? growth.grossMargin * 100 : null} suffix="%" /></MetricRow>
              <MetricRow label="Operating Margin"><AnimatedNumber value={growth.operatingMargin ? growth.operatingMargin * 100 : null} suffix="%" /></MetricRow>
              <MetricRow label="FCF Margin"><AnimatedNumber value={growth.fcfMargin ? growth.fcfMargin * 100 : null} suffix="%" /></MetricRow>
            </div>
          )}
        </ReportSection>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <ReportSection title="Price (12M)" filled={!!charts} className="bg-slate-800/40 p-4">
          {charts && <PriceChart data={charts.priceHistory} />}
        </ReportSection>
        <ReportSection title="Revenue Trend" filled={!!charts} className="bg-slate-800/40 p-4">
          {charts && <RevenueTrendChart data={charts.revenueTrend} />}
        </ReportSection>
      </div>

      {/* Thesis */}
      <ReportSection title="Investment Thesis" filled={!!thesis} className="bg-slate-800/40 p-4">
        {thesis && (
          <div className="space-y-3">
            <p className="text-sm text-slate-300 leading-relaxed">{thesis.summary}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-semibold text-emerald-400 uppercase mb-1.5">Bull Case</div>
                <ul className="space-y-1">
                  {thesis.bullPoints.map((p, i) => (
                    <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                      <span className="text-emerald-500 mt-0.5">+</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-red-400 uppercase mb-1.5">Bear Case</div>
                <ul className="space-y-1">
                  {thesis.bearPoints.map((p, i) => (
                    <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                      <span className="text-red-500 mt-0.5">-</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </ReportSection>

      {/* Verdict */}
      <ReportSection title="Verdict" filled={!!verdict} className="bg-slate-800/40 p-4">
        {verdict && (
          <div className="flex items-center gap-3">
            <VerdictBadge result={verdict.result} />
            <span className="text-sm text-slate-300">{verdict.reason}</span>
          </div>
        )}
      </ReportSection>
    </div>
  )
}
