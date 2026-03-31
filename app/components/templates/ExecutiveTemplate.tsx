'use client'

import ReportSection from '../ReportSection'
import AnimatedNumber from '../AnimatedNumber'
import { PriceChart, RevenueTrendChart } from '../ChartSection'
import { useSections, type TemplateProps } from './shared'

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-base font-semibold text-slate-900 font-mono">{children}</p>
    </div>
  )
}

function VerdictTag({ result }: { result: string }) {
  const labels: Record<string, string> = { pass_tier1: 'Strong Buy', pass_tier2: 'Buy', watch: 'Hold', fail: 'Avoid' }
  const colors: Record<string, string> = { pass_tier1: 'text-emerald-700 bg-emerald-50', pass_tier2: 'text-blue-700 bg-blue-50', watch: 'text-amber-700 bg-amber-50', fail: 'text-red-700 bg-red-50' }
  return <span className={`px-3 py-1 text-xs font-semibold rounded ${colors[result] ?? colors.watch}`}>{labels[result] ?? result}</span>
}

export default function ExecutiveTemplate({ data, sectionUpdates }: TemplateProps) {
  const { header, valuation, growth, charts, thesis, verdict } = useSections(data, sectionUpdates)
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="max-w-4xl mx-auto bg-white text-slate-900" id="report-content">
      {/* Clean header */}
      <ReportSection title="" filled={!!header}>
        {header && (
          <div className="px-10 pt-10 pb-6">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{header.companyName}</h1>
                <p className="text-sm text-slate-500 mt-1">{header.ticker} | {header.exchange} | {header.sector}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold font-mono">${header.currentPrice?.toLocaleString()}</p>
                <p className={`text-xs font-medium mt-0.5 ${header.gapFromHigh < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {header.gapFromHigh >= 0 ? '+' : ''}{header.gapFromHigh?.toFixed(1)}% vs 52W High (${header.high52w?.toLocaleString()})
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Market Cap: {header.marketCap}</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Report Date: {today}</p>
          </div>
        )}
      </ReportSection>

      <div className="px-10 pb-10 space-y-8">
        {/* Key Metrics */}
        <ReportSection title="" filled={!!valuation && !!growth}>
          {valuation && growth && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-200 pb-2">Key Metrics</h2>
              <div className="grid grid-cols-5 gap-6">
                <Stat label="P/E"><AnimatedNumber value={valuation.pe} suffix="x" /></Stat>
                <Stat label="P/S"><AnimatedNumber value={valuation.ps} suffix="x" /></Stat>
                <Stat label="EV/EBITDA"><AnimatedNumber value={valuation.evEbitda} suffix="x" /></Stat>
                <Stat label="PEG"><AnimatedNumber value={valuation.peg} suffix="x" /></Stat>
                <Stat label="P/B"><AnimatedNumber value={valuation.pbr} suffix="x" /></Stat>
              </div>
              <div className="grid grid-cols-4 gap-6 mt-4 pt-4 border-t border-slate-100">
                <Stat label="Revenue Growth">
                  <span className={(growth.revenueGrowthYoy ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                    <AnimatedNumber value={growth.revenueGrowthYoy ? growth.revenueGrowthYoy * 100 : null} suffix="%" />
                  </span>
                </Stat>
                <Stat label="Gross Margin"><AnimatedNumber value={growth.grossMargin ? growth.grossMargin * 100 : null} suffix="%" /></Stat>
                <Stat label="Operating Margin"><AnimatedNumber value={growth.operatingMargin ? growth.operatingMargin * 100 : null} suffix="%" /></Stat>
                <Stat label="FCF Margin"><AnimatedNumber value={growth.fcfMargin ? growth.fcfMargin * 100 : null} suffix="%" /></Stat>
              </div>
            </div>
          )}
        </ReportSection>

        {/* Charts */}
        <ReportSection title="" filled={!!charts}>
          {charts && (
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">12-Month Price</h3>
                <PriceChart data={charts.priceHistory} />
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Quarterly Revenue</h3>
                <RevenueTrendChart data={charts.revenueTrend} />
              </div>
            </div>
          )}
        </ReportSection>

        {/* Verdict */}
        <ReportSection title="" filled={!!verdict}>
          {verdict && (
            <div className="flex items-start gap-4 bg-slate-50 rounded p-5">
              <div><VerdictTag result={verdict.result} /></div>
              <p className="text-sm text-slate-700 leading-relaxed flex-1">{verdict.reason}</p>
            </div>
          )}
        </ReportSection>

        {/* Thesis */}
        <ReportSection title="" filled={!!thesis}>
          {thesis && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-200 pb-2">Investment Thesis</h2>
              <p className="text-sm text-slate-700 leading-relaxed mb-6">{thesis.summary}</p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-3">Bull Case</h4>
                  <ul className="space-y-2">
                    {thesis.bullPoints.map((p, i) => (
                      <li key={i} className="text-sm text-slate-700 pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-emerald-500">{p}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-700 mb-3">Bear Case</h4>
                  <ul className="space-y-2">
                    {thesis.bearPoints.map((p, i) => (
                      <li key={i} className="text-sm text-slate-700 pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-red-500">{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </ReportSection>

        <div className="text-center pt-6 border-t border-slate-200">
          <p className="text-[10px] text-slate-400">This report is for informational purposes only. Not financial advice.</p>
        </div>
      </div>
    </div>
  )
}
