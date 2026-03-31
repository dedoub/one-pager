'use client'

import ReportSection from '../ReportSection'
import AnimatedNumber from '../AnimatedNumber'
import { useSections, type TemplateProps } from './shared'

function VerdictDot({ result }: { result: string }) {
  const colors: Record<string, string> = { pass_tier1: 'bg-emerald-500', pass_tier2: 'bg-blue-500', watch: 'bg-amber-500', fail: 'bg-red-500' }
  const labels: Record<string, string> = { pass_tier1: 'Strong Buy', pass_tier2: 'Buy', watch: 'Hold', fail: 'Avoid' }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${colors[result] ?? colors.watch}`} />
      <span className="text-xs font-bold uppercase">{labels[result] ?? result}</span>
    </span>
  )
}

function Row({ label, children, highlight }: { label: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`flex justify-between py-1 text-xs ${highlight ? 'font-semibold' : ''}`}>
      <span className="text-stone-400">{label}</span>
      <span className="text-white font-mono">{children}</span>
    </div>
  )
}

export default function CompactTemplate({ data, sectionUpdates }: TemplateProps) {
  const { header, valuation, growth, thesis, verdict, layout } = useSections(data, sectionUpdates)
  const thesisStyle = layout?.thesisStyle ?? 'split'

  return (
    <div className="max-w-md mx-auto bg-stone-900 text-white rounded-xl overflow-hidden" id="report-content">
      {/* Compact Header */}
      <ReportSection title="" filled={!!header}>
        {header && (
          <div className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">{header.ticker}</h1>
                <p className="text-[10px] text-stone-500">{header.companyName} &middot; {header.sector}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold font-mono">${header.currentPrice?.toLocaleString()}</p>
                <p className={`text-[10px] font-medium ${header.gapFromHigh < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {header.gapFromHigh >= 0 ? '+' : ''}{header.gapFromHigh?.toFixed(1)}%
                </p>
              </div>
            </div>
            {header.description && (
              <p className="text-[10px] text-stone-400 leading-snug mt-2">{header.description}</p>
            )}
          </div>
        )}
      </ReportSection>

      <div className="px-5 pb-5 space-y-3">
        {/* Verdict Banner */}
        <ReportSection title="" filled={!!verdict}>
          {verdict && (
            <div className="bg-stone-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <VerdictDot result={verdict.result} />
                <span className="text-[10px] text-stone-500">MCap {header?.marketCap}</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-snug">{verdict.reason}</p>
            </div>
          )}
        </ReportSection>

        {/* Valuation */}
        <ReportSection title="" filled={!!valuation}>
          {valuation && (
            <div className="bg-stone-800 rounded-lg p-3">
              <p className="text-[9px] text-stone-500 uppercase tracking-widest mb-2">Valuation</p>
              <Row label="P/E"><AnimatedNumber value={valuation.pe} suffix="x" /></Row>
              <Row label="P/S"><AnimatedNumber value={valuation.ps} suffix="x" /></Row>
              <Row label="EV/EBITDA"><AnimatedNumber value={valuation.evEbitda} suffix="x" /></Row>
              <Row label="PEG"><AnimatedNumber value={valuation.peg} suffix="x" /></Row>
              <Row label="P/B"><AnimatedNumber value={valuation.pbr} suffix="x" /></Row>
            </div>
          )}
        </ReportSection>

        {/* Growth */}
        <ReportSection title="" filled={!!growth}>
          {growth && (
            <div className="bg-stone-800 rounded-lg p-3">
              <p className="text-[9px] text-stone-500 uppercase tracking-widest mb-2">Growth & Margins</p>
              <Row label="Revenue Growth" highlight>
                <span className={(growth.revenueGrowthYoy ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  <AnimatedNumber value={growth.revenueGrowthYoy ? growth.revenueGrowthYoy * 100 : null} suffix="%" />
                </span>
              </Row>
              <Row label="Gross"><AnimatedNumber value={growth.grossMargin ? growth.grossMargin * 100 : null} suffix="%" /></Row>
              <Row label="Operating"><AnimatedNumber value={growth.operatingMargin ? growth.operatingMargin * 100 : null} suffix="%" /></Row>
              <Row label="FCF"><AnimatedNumber value={growth.fcfMargin ? growth.fcfMargin * 100 : null} suffix="%" /></Row>
            </div>
          )}
        </ReportSection>

        {/* Thesis - condensed */}
        <ReportSection title="" filled={!!thesis}>
          {thesis && (
            <div className="bg-stone-800 rounded-lg p-3 space-y-2">
              <p className="text-[11px] text-stone-300 leading-snug">{thesis.summary}</p>
              {thesisStyle === 'unified' ? (
                <div className="pt-1">
                  {thesis.bullPoints.slice(0, 3).map((p, i) => (
                    <p key={`b${i}`} className="text-[10px] text-stone-400 leading-snug mb-1"><span className="text-emerald-500">+</span> {p}</p>
                  ))}
                  {thesis.bearPoints.slice(0, 3).map((p, i) => (
                    <p key={`r${i}`} className="text-[10px] text-stone-400 leading-snug mb-1"><span className="text-red-500">−</span> {p}</p>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-emerald-500 mb-1">Bull</p>
                    {thesis.bullPoints.slice(0, 3).map((p, i) => (
                      <p key={i} className="text-[10px] text-stone-400 leading-snug mb-1">• {p}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-red-500 mb-1">Bear</p>
                    {thesis.bearPoints.slice(0, 3).map((p, i) => (
                      <p key={i} className="text-[10px] text-stone-400 leading-snug mb-1">• {p}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ReportSection>

        <p className="text-center text-[8px] text-stone-600 pt-2">Not financial advice</p>
      </div>
    </div>
  )
}
