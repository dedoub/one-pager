'use client'

import type { ReportData, ReportHeader, ReportValuation, ReportGrowth, ReportCharts, ReportThesis, ReportVerdict, ReportLayout } from '@/lib/types'

export type TemplateId = 'newspaper' | 'modern' | 'executive' | 'compact'

export const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: 'newspaper', label: 'Newspaper' },
  { id: 'modern', label: 'Modern' },
  { id: 'executive', label: 'Executive' },
  { id: 'compact', label: 'Compact' },
]

export interface TemplateProps {
  data: Partial<ReportData>
  sectionUpdates: Map<string, unknown>
  generating: boolean
}

export function useSections(data: Partial<ReportData>, sectionUpdates: Map<string, unknown>) {
  return {
    header: (sectionUpdates.get('header') ?? data.header) as ReportHeader | undefined,
    valuation: (sectionUpdates.get('valuation') ?? data.valuation) as ReportValuation | undefined,
    growth: (sectionUpdates.get('growth') ?? data.growth) as ReportGrowth | undefined,
    charts: (sectionUpdates.get('charts') ?? data.charts) as ReportCharts | undefined,
    thesis: (sectionUpdates.get('thesis') ?? data.thesis) as ReportThesis | undefined,
    verdict: (sectionUpdates.get('verdict') ?? data.verdict) as ReportVerdict | undefined,
    layout: (sectionUpdates.get('layout') ?? data.layout) as ReportLayout | undefined,
  }
}

export function VerdictLabel({ result }: { result: string }) {
  const labels: Record<string, string> = {
    pass_tier1: 'STRONG BUY',
    pass_tier2: 'BUY',
    watch: 'HOLD',
    fail: 'AVOID',
  }
  return <>{labels[result] ?? result}</>
}

export function formatPct(v: number | null | undefined, multiply = false): string {
  if (v == null) return 'N/A'
  const val = multiply ? v * 100 : v
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`
}

export function formatNum(v: number | null | undefined, decimals = 1, suffix = ''): string {
  if (v == null) return 'N/A'
  return `${v.toFixed(decimals)}${suffix}`
}
