import type { MarketData } from './market-data'

export function buildReportPrompt(ticker: string, marketData: MarketData, existingResearch?: Record<string, unknown>): string {
  return `You are a stock research analyst. Generate a structured analysis for ${ticker}.

MARKET DATA (pre-fetched, use as-is):
${JSON.stringify(marketData, null, 2)}

${existingResearch ? `PRIOR RESEARCH:\n${JSON.stringify(existingResearch, null, 2)}` : 'No prior research available.'}

Generate analysis in this exact JSON format:
{
  "thesis": {
    "summary": "2-3 sentence investment thesis",
    "bullPoints": ["3-5 bull case points"],
    "bearPoints": ["2-4 bear/risk points"]
  },
  "verdict": {
    "result": "pass_tier1 | pass_tier2 | watch | fail",
    "reason": "1 sentence verdict justification"
  },
  "sectorTag": "Primary sector (e.g. Cybersecurity, Cloud, Fintech)"
}

Rules:
- Be specific to ${ticker}, not generic
- Bull/bear points should reference actual metrics from the market data
- Verdict: pass_tier1 = strong buy, pass_tier2 = buy, watch = monitor, fail = avoid
- Return ONLY valid JSON, no markdown or explanation`
}

export function buildChatPrompt(
  reportData: Record<string, unknown>,
  chatHistory: { role: string; content: string }[],
  userMessage: string
): string {
  return `You are refining a stock research report. Here is the current report data:

${JSON.stringify(reportData, null, 2)}

CONVERSATION HISTORY:
${chatHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

USER REQUEST: ${userMessage}

Modify the report based on the user's request. Return JSON with:
1. "message": A natural conversational reply to the user explaining what you changed and why (2-3 sentences, in the same language as the user's message)
2. "sections": Only the sections that changed

{
  "message": "설명 메시지...",
  "sections": {
    "sectionKey": { ...updated section data... }
  }
}

EDITABLE SECTIONS AND FIELDS:
- "header": { companyName, ticker, exchange, sector, description (company intro text), currentPrice, marketCap, high52w, gapFromHigh }
- "valuation": { pe, ps, evEbitda, peg, pbr } (all numbers or null)
- "growth": { revenueGrowthYoy, grossMargin, operatingMargin, fcfMargin } (decimals, e.g. 0.25 = 25%)
- "thesis": { summary (string), bullPoints (string[]), bearPoints (string[]) }
- "verdict": { result ("pass_tier1"|"pass_tier2"|"watch"|"fail"), reason (string) }
- "charts": { priceHistory [{date, price}], revenueTrend [{quarter, revenue}] }
- "layout": { columns (2 or 3), sectionOrder (array of "valuation"|"growth"|"charts"|"thesis"|"verdict"), showCharts (boolean), thesisStyle ("split" for bull/bear columns or "unified" for single block) }

When the user asks to add/change content, update the appropriate field in the matching section.
For company intro/description, use header.description.
For layout changes (reorder sections, hide charts, change columns, merge bull/bear), update the "layout" section.
Return ONLY valid JSON, no markdown or explanation.`
}
