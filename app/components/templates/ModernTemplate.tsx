'use client'

import ReportSection from '../ReportSection'
import AnimatedNumber from '../AnimatedNumber'
import { PriceChart, RevenueTrendChart } from '../ChartSection'
import { useSections, type TemplateProps } from './shared'

function MetricCard({ label, children, accent }: { label: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${accent ? 'bg-blue-500/10' : 'bg-stone-800'}`}>
      <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-lg font-bold text-white font-mono">{children}</p>
    </div>
  )
}

function VerdictPill({ result }: { result: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    pass_tier1: { label: 'Strong Buy', cls: 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' },
    pass_tier2: { label: 'Buy', cls: 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30' },
    watch: { label: 'Hold', cls: 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30' },
    fail: { label: 'Avoid', cls: 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30' },
  }
  const c = cfg[result] ?? cfg.watch
  return <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${c.cls}`}>{c.label}</span>
}

export default function ModernTemplate({ data, sectionUpdates }: TemplateProps) {
  const { header, valuation, growth, charts, thesis, verdict, layout } = useSections(data, sectionUpdates)
  const showCharts = layout?.showCharts !== false
  const thesisStyle = layout?.thesisStyle ?? 'split'

  return (
    <div className="max-w-4xl mx-auto bg-stone-900 text-white rounded-2xl overflow-hidden" id="report-content">
      <ReportSection title="" filled={!!header}>
        {header && (
          <div className="p-8 bg-gradient-to-br from-stone-800 to-stone-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-widest mb-1">{header.exchange} &middot; {header.sector}</p>
                <h1 className="text-4xl font-extrabold tracking-tight">{header.companyName}</h1>
                <p className="text-stone-500 text-sm mt-1">{header.ticker}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold font-mono">${header.currentPrice?.toLocaleString()}</p>
                <p className={`text-sm font-semibold mt-1 ${header.gapFromHigh < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {header.gapFromHigh >= 0 ? '+' : ''}{header.gapFromHigh?.toFixed(1)}% from 52W High
                </p>
                <p className="text-xs text-stone-500 mt-0.5">MCap {header.marketCap}</p>
              </div>
            </div>
            {header.description && (
              <p className="text-sm text-stone-400 leading-relaxed mt-4">{header.description}</p>
            )}
          </div>
        )}
      </ReportSection>

      <div className="p-8 space-y-6">
        <ReportSection title="" filled={!!valuation && !!growth}>
          {valuation && growth && (
            <div className="grid grid-cols-4 gap-3">
              <MetricCard label="P/E"><AnimatedNumber value={valuation.pe} suffix="x" /></MetricCard>
              <MetricCard label="P/S"><AnimatedNumber value={valuation.ps} suffix="x" /></MetricCard>
              <MetricCard label="EV/EBITDA"><AnimatedNumber value={valuation.evEbitda} suffix="x" /></MetricCard>
              <MetricCard label="PEG"><AnimatedNumber value={valuation.peg} suffix="x" /></MetricCard>
              <MetricCard label="Rev Growth" accent>
                <span className={(growth.revenueGrowthYoy ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  <AnimatedNumber value={growth.revenueGrowthYoy ? growth.revenueGrowthYoy * 100 : null} suffix="%" />
                </span>
              </MetricCard>
              <MetricCard label="Gross Margin"><AnimatedNumber value={growth.grossMargin ? growth.grossMargin * 100 : null} suffix="%" /></MetricCard>
              <MetricCard label="Op Margin"><AnimatedNumber value={growth.operatingMargin ? growth.operatingMargin * 100 : null} suffix="%" /></MetricCard>
              <MetricCard label="FCF Margin"><AnimatedNumber value={growth.fcfMargin ? growth.fcfMargin * 100 : null} suffix="%" /></MetricCard>
            </div>
          )}
        </ReportSection>

        {showCharts && (
          <ReportSection title="" filled={!!charts}>
            {charts && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-stone-800 rounded-lg p-4">
                  <h3 className="text-xs text-stone-400 uppercase tracking-wider mb-3">Price History</h3>
                  <PriceChart data={charts.priceHistory} />
                </div>
                <div className="bg-stone-800 rounded-lg p-4">
                  <h3 className="text-xs text-stone-400 uppercase tracking-wider mb-3">Revenue Trend</h3>
                  <RevenueTrendChart data={charts.revenueTrend} />
                </div>
              </div>
            )}
          </ReportSection>
        )}

        <ReportSection title="" filled={!!verdict}>
          {verdict && (
            <div className="bg-stone-800 rounded-lg p-5 flex items-center gap-4">
              <VerdictPill result={verdict.result} />
              <p className="text-sm text-stone-300 flex-1">{verdict.reason}</p>
            </div>
          )}
        </ReportSection>

        <ReportSection title="" filled={!!thesis}>
          {thesis && (
            <div className="space-y-4">
              <p className="text-sm text-stone-300 leading-relaxed">{thesis.summary}</p>
              {thesisStyle === 'unified' ? (
                <div className="bg-stone-800 rounded-lg p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">Key Points</h4>
                  <ul className="space-y-2">
                    {thesis.bullPoints.map((p, i) => (<li key={`b${i}`} className="text-sm text-stone-300 flex gap-2"><span className="text-emerald-500 font-bold shrink-0">+</span>{p}</li>))}
                    {thesis.bearPoints.map((p, i) => (<li key={`r${i}`} className="text-sm text-stone-300 flex gap-2"><span className="text-red-500 font-bold shrink-0">−</span>{p}</li>))}
                  </ul>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-500/5 rounded-lg p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3">Bull Case</h4>
                    <ul className="space-y-2">{thesis.bullPoints.map((p, i) => (<li key={i} className="text-sm text-stone-300 flex gap-2"><span className="text-emerald-500 font-bold shrink-0">{i + 1}</span>{p}</li>))}</ul>
                  </div>
                  <div className="bg-red-500/5 rounded-lg p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-3">Bear Case</h4>
                    <ul className="space-y-2">{thesis.bearPoints.map((p, i) => (<li key={i} className="text-sm text-stone-300 flex gap-2"><span className="text-red-500 font-bold shrink-0">{i + 1}</span>{p}</li>))}</ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </ReportSection>

        <p className="text-center text-[10px] text-stone-600 pt-4">For informational purposes only. Not financial advice.</p>
      </div>
    </div>
  )
}
