export interface MetricItem {
  label: string
  value: string
  suffix?: string
}

export interface ChartDataPoint {
  name: string
  value: number
}

export interface BulletPoint {
  text: string
}

export interface OnePagerData {
  // Header
  companyName: string
  logo?: string
  headline: string
  highlightNumber: string
  subtitle: string

  // Left column
  introText: string
  objectivesTitle: string
  objectives: BulletPoint[]
  solutionTitle: string
  solutionText: string
  resultsTitle: string
  results: BulletPoint[]

  // Right column
  metrics: MetricItem[]
  chartTitle: string
  chartData: ChartDataPoint[]
  chart2Title: string
  chart2Data: ChartDataPoint[]
  conclusionTitle: string
  conclusionText: string

  // Style
  template: 'warm' | 'modern' | 'bold'
}

export const SAMPLE_DATA: OnePagerData = {
  companyName: 'RIPOSARE',
  headline: 'How A Seasonal Referral Program Drove Our Growth to',
  highlightNumber: '25%',
  subtitle: 'Hospitality Case Study — Q4 2024',

  introText: 'RIPOSARE, a boutique hotel chain specializing in Mediterranean-inspired retreats, implemented a strategic seasonal referral program to boost customer acquisition during traditionally slower months.',
  objectivesTitle: 'Objectives',
  objectives: [
    { text: 'Increase new customer acquisition by 20% during off-season' },
    { text: 'Improve customer retention rate through incentivized referrals' },
    { text: 'Measure ROI of referral vs. traditional marketing spend' },
  ],
  solutionTitle: 'Program Overview',
  solutionText: 'We launched a 30-day referral campaign offering existing guests a 15% discount on their next stay for each successful referral. New guests received a complimentary spa treatment upon booking.',
  resultsTitle: 'Revenue Impact',
  results: [
    { text: '20% increase in quarterly revenue ($72K → $86K)' },
    { text: '10% improvement in profit margin' },
    { text: '35% of new bookings came through referrals' },
    { text: 'Customer acquisition cost reduced by 40%' },
  ],

  metrics: [
    { label: 'Revenue Growth', value: '20', suffix: '%' },
    { label: 'New Customers', value: '847' },
    { label: 'Referral Rate', value: '35', suffix: '%' },
    { label: 'NPS Score', value: '72' },
  ],
  chartTitle: 'Customer Satisfaction',
  chartData: [
    { name: '5 Star', value: 72 },
    { name: '4 Star', value: 18 },
    { name: '3 Star', value: 6 },
    { name: '2 Star', value: 3 },
    { name: '1 Star', value: 1 },
  ],
  chart2Title: 'Monthly Revenue ($K)',
  chart2Data: [
    { name: 'Month 1', value: 72 },
    { name: 'Month 2', value: 74 },
    { name: 'Month 3', value: 76 },
    { name: 'Month 4', value: 81 },
    { name: 'Month 5', value: 86 },
  ],
  conclusionTitle: 'Conclusion',
  conclusionText: 'The seasonal referral program exceeded all targets, delivering 25% overall growth. The program will be expanded to all properties in 2025 with enhanced digital tracking and tiered reward structures.',

  template: 'warm',
}

// === Report Generator v2 Types ===

export interface ReportHeader {
  companyName: string
  ticker: string
  exchange: string
  sector: string
  description?: string
  currentPrice: number
  marketCap: string
  high52w: number
  gapFromHigh: number
}

export interface ReportValuation {
  pe: number | null
  ps: number | null
  evEbitda: number | null
  peg: number | null
  pbr: number | null
}

export interface ReportGrowth {
  revenueGrowthYoy: number | null
  grossMargin: number | null
  operatingMargin: number | null
  fcfMargin: number | null
}

export interface ReportCharts {
  priceHistory: { date: string; price: number }[]
  revenueTrend: { quarter: string; revenue: number }[]
}

export interface ReportThesis {
  summary: string
  bullPoints: string[]
  bearPoints: string[]
}

export interface ReportVerdict {
  result: 'pass_tier1' | 'pass_tier2' | 'watch' | 'fail'
  reason: string
}

export interface ReportData {
  header: ReportHeader
  valuation: ReportValuation
  growth: ReportGrowth
  charts: ReportCharts
  thesis: ReportThesis
  verdict: ReportVerdict
}

export type ReportSectionKey = keyof ReportData

export interface Report {
  id: string
  title: string
  ticker: string
  folder_id: string | null
  status: 'generating' | 'complete' | 'error'
  data: Partial<ReportData>
  version: number
  created_at: string
  updated_at: string
}

export interface ReportVersion {
  id: string
  report_id: string
  version: number
  data: ReportData
  created_at: string
}

export interface ReportFolder {
  id: string
  name: string
  parent_id: string | null
  sort_order: number
  created_at: string
  children?: ReportFolder[]
}

export interface ChatMessage {
  id: string
  report_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface SectionUpdate {
  section: ReportSectionKey
  data: ReportData[ReportSectionKey]
}
