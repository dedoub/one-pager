import YahooFinance from 'yahoo-finance2'
import type { ReportHeader, ReportValuation, ReportGrowth, ReportCharts } from './types'

const yahooFinance = new YahooFinance()

export interface MarketData {
  header: ReportHeader
  valuation: ReportValuation
  growth: ReportGrowth
  charts: ReportCharts
}

export async function fetchMarketData(ticker: string): Promise<MarketData> {
  const [quote, chart] = await Promise.all([
    yahooFinance.quoteSummary(ticker, {
      modules: ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData', 'earningsTrend'],
    }),
    yahooFinance.chart(ticker, {
      period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      interval: '1wk',
    }),
  ])

  const price = quote.price
  const summary = quote.summaryDetail
  const keyStats = quote.defaultKeyStatistics
  const financial = quote.financialData

  const toNum = (v: unknown): number | null =>
    typeof v === 'number' && isFinite(v) ? v : null

  const currentPrice = toNum(price?.regularMarketPrice) ?? 0
  const high52w = toNum(summary?.fiftyTwoWeekHigh) ?? 0

  const header: ReportHeader = {
    companyName: String(price?.longName ?? price?.shortName ?? ticker),
    ticker: ticker.toUpperCase(),
    exchange: String(price?.exchangeName ?? ''),
    sector: '',
    currentPrice,
    marketCap: formatMarketCap(toNum(price?.marketCap) ?? 0),
    high52w,
    gapFromHigh: high52w ? (currentPrice - high52w) / high52w * 100 : 0,
  }

  const valuation: ReportValuation = {
    pe: toNum(summary?.trailingPE) ?? toNum(keyStats?.trailingPE),
    ps: toNum(keyStats?.priceToSalesTrailing12Months),
    evEbitda: toNum(keyStats?.enterpriseToEbitda),
    peg: toNum(keyStats?.pegRatio),
    pbr: toNum(keyStats?.priceToBook),
  }

  const growth: ReportGrowth = {
    revenueGrowthYoy: toNum(financial?.revenueGrowth),
    grossMargin: toNum(financial?.grossMargins),
    operatingMargin: toNum(financial?.operatingMargins),
    fcfMargin: financial?.freeCashflow && financial?.totalRevenue
      ? (financial.freeCashflow as number) / (financial.totalRevenue as number)
      : null,
  }

  const quotes = chart.quotes ?? []
  const priceHistory = quotes
    .filter(q => q.date && q.close)
    .map(q => ({
      date: q.date!.toISOString().split('T')[0],
      price: Math.round(q.close! * 100) / 100,
    }))

  const charts: ReportCharts = {
    priceHistory,
    revenueTrend: [],
  }

  return { header, valuation, growth, charts }
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`
  return `$${value.toLocaleString()}`
}
