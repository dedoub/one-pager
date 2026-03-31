import { callClaude } from './ai-claude'
import { callGemini } from './ai-gemini'
import { buildReportPrompt, buildChatPrompt } from './prompts'
import type { MarketData } from './market-data'
import type { ReportData, ReportThesis, ReportVerdict } from './types'

async function callAI(prompt: string): Promise<string> {
  if (process.env.AI_PROVIDER === 'claude') {
    return callClaude(prompt)
  }
  return callGemini(prompt)
}

function parseJSON(text: string): Record<string, unknown> {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = jsonMatch ? jsonMatch[1].trim() : text.trim()
  try {
    return JSON.parse(raw)
  } catch (e) {
    throw new Error(`Failed to parse AI response as JSON: ${(e as Error).message}\nRaw response: ${raw.slice(0, 500)}`)
  }
}

export async function generateAnalysis(
  ticker: string,
  marketData: MarketData,
  existingResearch?: Record<string, unknown>
): Promise<{ thesis: ReportThesis; verdict: ReportVerdict; sectorTag: string }> {
  const prompt = buildReportPrompt(ticker, marketData, existingResearch)
  const response = await callAI(prompt)
  const parsed = parseJSON(response)

  return {
    thesis: parsed.thesis as ReportThesis,
    verdict: parsed.verdict as ReportVerdict,
    sectorTag: (parsed.sectorTag as string) ?? '',
  }
}

export async function refineReport(
  reportData: Partial<ReportData>,
  chatHistory: { role: string; content: string }[],
  userMessage: string
): Promise<Record<string, unknown>> {
  const prompt = buildChatPrompt(reportData, chatHistory, userMessage)
  const response = await callAI(prompt)
  const parsed = parseJSON(response)
  return (parsed.sections as Record<string, unknown>) ?? parsed
}
