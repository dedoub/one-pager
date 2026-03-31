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

  const header: ReportHeader = {
    companyName: price?.longName ?? price?.shortName ?? ticker,
    ticker: ticker.toUpperCase(),
    exchange: price?.exchangeName ?? '',
    sector: '',
    currentPrice: price?.regularMarketPrice ?? 0,
    marketCap: formatMarketCap(price?.marketCap ?? 0),
    high52w: summary?.fiftyTwoWeekHigh ?? 0,
    gapFromHigh: summary?.fiftyTwoWeekHigh
      ? ((price?.regularMarketPrice ?? 0) - summary.fiftyTwoWeekHigh) / summary.fiftyTwoWeekHigh * 100
      : 0,
  }

  const valuation: ReportValuation = {
    pe: summary?.trailingPE ?? keyStats?.trailingPE ?? null,
    ps: keyStats?.priceToSalesTrailing12Months ?? null,
    evEbitda: keyStats?.enterpriseToEbitda ?? null,
    peg: keyStats?.pegRatio ?? null,
    pbr: keyStats?.priceToBook ?? null,
  }

  const growth: ReportGrowth = {
    revenueGrowthYoy: financial?.revenueGrowth ?? null,
    grossMargin: financial?.grossMargins ?? null,
    operatingMargin: financial?.operatingMargins ?? null,
    fcfMargin: financial?.freeCashflow && financial?.totalRevenue
      ? financial.freeCashflow / financial.totalRevenue
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
