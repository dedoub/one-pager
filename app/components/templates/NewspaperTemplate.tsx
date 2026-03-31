'use client'

import ReportSection from '../ReportSection'
import AnimatedNumber from '../AnimatedNumber'
import { PriceChart, RevenueTrendChart } from '../ChartSection'
import { useSections, type TemplateProps } from './shared'

function MetricRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between text-[11px] py-0.5 border-b border-stone-200">
      <span className="text-stone-500 font-serif">{label}</span>
      <span className="text-stone-900 font-bold font-mono text-[10px]">{children}</span>
    </div>
  )
}

function VerdictBadge({ result }: { result: string }) {
  const labels: Record<string, string> = { pass_tier1: 'STRONG BUY', pass_tier2: 'BUY', watch: 'HOLD', fail: 'AVOID' }
  const colors: Record<string, string> = { pass_tier1: 'bg-emerald-800 text-white', pass_tier2: 'bg-blue-800 text-white', watch: 'bg-amber-700 text-white', fail: 'bg-red-800 text-white' }
  return <span className={`inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${colors[result] ?? colors.watch}`}>{labels[result] ?? result}</span>
}

function SectionDivider() { return <div className="border-t-2 border-stone-900 my-1" /> }
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-2"><div className="border-b border-stone-400 pb-0.5"><h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-600 font-sans">{children}</h3></div></div>
}

export default function NewspaperTemplate({ data, sectionUpdates, generating }: TemplateProps) {
  const { header, valuation, growth, charts, thesis, verdict } = useSections(data, sectionUpdates)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="max-w-4xl mx-auto bg-[#faf8f3] text-stone-900 shadow-lg" id="report-content">
      <div className="px-8 pt-6 pb-3">
        <div className="text-center border-b-4 border-double border-stone-900 pb-3">
          <p className="text-[9px] uppercase tracking-[0.5em] text-stone-500 font-sans mb-1">{today}</p>
          <h1 className="font-serif text-4xl font-black tracking-tight leading-none">THE RESEARCH DAILY</h1>
          <p className="text-[9px] uppercase tracking-[0.4em] text-stone-500 font-sans mt-1.5">Equity Research &bull; Fundamental Analysis &bull; Investment Intelligence</p>
        </div>
      </div>

      <ReportSection title="" filled={!!header}>
        {header && (
          <div className="px-8 pb-4">
            <div className="border-b border-stone-300 pb-4">
              <h2 className="font-serif text-3xl font-black leading-tight">{header.companyName}</h2>
              <p className="text-xs text-stone-500 mt-1 font-sans">{header.ticker} &bull; {header.exchange} {header.sector && `\u2022 ${header.sector}`}</p>
              <div className="flex items-baseline gap-6 mt-3">
                <div>
                  <span className="font-serif text-2xl font-bold">${header.currentPrice?.toLocaleString()}</span>
                  <span className={`ml-2 text-sm font-bold ${header.gapFromHigh < 0 ? 'text-red-700' : 'text-emerald-700'}`}>{header.gapFromHigh >= 0 ? '+' : ''}{header.gapFromHigh?.toFixed(1)}% from 52W High</span>
                </div>
                <span className="text-xs text-stone-500">MCap {header.marketCap}</span>
                <span className="text-xs text-stone-500">52W High ${header.high52w?.toLocaleString()}</span>
              </div>
              {header.description && (
                <p className="text-[12px] font-serif text-stone-700 leading-relaxed mt-3 first-letter:text-2xl first-letter:font-bold first-letter:float-left first-letter:mr-1 first-letter:leading-none">{header.description}</p>
              )}
            </div>
          </div>
        )}
      </ReportSection>

      <div className="px-8 pb-6">
        <div className="grid grid-cols-3 gap-0">
          <div className="pr-4 border-r border-stone-300">
            <ReportSection title="" filled={!!valuation}>
              {valuation && (<div><SectionTitle>Valuation</SectionTitle><div className="space-y-0">
                <MetricRow label="P/E Ratio"><AnimatedNumber value={valuation.pe} suffix="x" /></MetricRow>
                <MetricRow label="P/S Ratio"><AnimatedNumber value={valuation.ps} suffix="x" /></MetricRow>
                <MetricRow label="EV/EBITDA"><AnimatedNumber value={valuation.evEbitda} suffix="x" /></MetricRow>
                <MetricRow label="PEG Ratio"><AnimatedNumber value={valuation.peg} suffix="x" /></MetricRow>
                <MetricRow label="P/B Ratio"><AnimatedNumber value={valuation.pbr} suffix="x" /></MetricRow>
              </div></div>)}
            </ReportSection>
          </div>
          <div className="px-4 border-r border-stone-300">
            <ReportSection title="" filled={!!growth}>
              {growth && (<div><SectionTitle>Growth &amp; Margins</SectionTitle><div className="space-y-0">
                <MetricRow label="Rev. Growth YoY"><span className={(growth.revenueGrowthYoy ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}><AnimatedNumber value={growth.revenueGrowthYoy ? growth.revenueGrowthYoy * 100 : null} suffix="%" /></span></MetricRow>
                <MetricRow label="Gross Margin"><AnimatedNumber value={growth.grossMargin ? growth.grossMargin * 100 : null} suffix="%" /></MetricRow>
                <MetricRow label="Op. Margin"><AnimatedNumber value={growth.operatingMargin ? growth.operatingMargin * 100 : null} suffix="%" /></MetricRow>
                <MetricRow label="FCF Margin"><AnimatedNumber value={growth.fcfMargin ? growth.fcfMargin * 100 : null} suffix="%" /></MetricRow>
              </div></div>)}
            </ReportSection>
          </div>
          <div className="pl-4">
            <ReportSection title="" filled={!!verdict}>
              {verdict && (<div><SectionTitle>Analyst Verdict</SectionTitle><div className="mb-3"><VerdictBadge result={verdict.result} /></div>
                <p className="text-[11px] font-serif text-stone-700 leading-relaxed italic">&ldquo;{verdict.reason}&rdquo;</p></div>)}
            </ReportSection>
          </div>
        </div>

        <SectionDivider />

        <div className="grid grid-cols-2 gap-0 mt-3">
          <div className="pr-4 border-r border-stone-300">
            <ReportSection title="" filled={!!charts}>{charts && (<div><SectionTitle>Price History (12M)</SectionTitle><PriceChart data={charts.priceHistory} /></div>)}</ReportSection>
          </div>
          <div className="pl-4">
            <ReportSection title="" filled={!!charts}>{charts && (<div><SectionTitle>Revenue Trend</SectionTitle><RevenueTrendChart data={charts.revenueTrend} /></div>)}</ReportSection>
          </div>
        </div>

        <SectionDivider />

        <ReportSection title="" filled={!!thesis}>
          {thesis && (
            <div className="mt-3">
              <SectionTitle>Investment Thesis</SectionTitle>
              <p className="text-[12px] font-serif text-stone-800 leading-relaxed mb-4 first-letter:text-3xl first-letter:font-bold first-letter:float-left first-letter:mr-1 first-letter:leading-none">{thesis.summary}</p>
              <div className="grid grid-cols-2 gap-0">
                <div className="pr-4 border-r border-stone-300">
                  <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-800 font-sans mb-2 border-b border-emerald-800 pb-0.5 inline-block">Bull Case</div>
                  <ul className="space-y-1.5">{thesis.bullPoints.map((p, i) => (<li key={i} className="text-[11px] font-serif text-stone-700 flex gap-1.5 leading-snug"><span className="text-emerald-700 font-bold shrink-0">{i + 1}.</span>{p}</li>))}</ul>
                </div>
                <div className="pl-4">
                  <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-red-800 font-sans mb-2 border-b border-red-800 pb-0.5 inline-block">Bear Case</div>
                  <ul className="space-y-1.5">{thesis.bearPoints.map((p, i) => (<li key={i} className="text-[11px] font-serif text-stone-700 flex gap-1.5 leading-snug"><span className="text-red-700 font-bold shrink-0">{i + 1}.</span>{p}</li>))}</ul>
                </div>
              </div>
            </div>
          )}
        </ReportSection>

        <div className="mt-6 pt-2 border-t-2 border-stone-900 text-center">
          <p className="text-[8px] uppercase tracking-[0.4em] text-stone-400 font-sans">This report is generated for informational purposes only &bull; Not financial advice</p>
        </div>
      </div>
    </div>
  )
}
