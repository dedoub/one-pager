import { NextRequest } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { fetchMarketData } from '@/lib/market-data'
import { generateAnalysis } from '@/lib/ai'
import type { ReportData, SectionUpdate } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { ticker, folderId } = await req.json()
  if (!ticker) return new Response('ticker required', { status: 400 })

  const sb = getSupabase()

  const { data: report, error: createErr } = await sb
    .from('reports')
    .insert({
      title: `${ticker.toUpperCase()} Analysis`,
      ticker: ticker.toUpperCase(),
      folder_id: folderId ?? null,
      status: 'generating',
    })
    .select('id')
    .single()

  if (createErr) return new Response(JSON.stringify({ error: createErr.message }), { status: 500 })

  const reportId = report.id

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      try {
        send('reportId', { id: reportId })

        const marketData = await fetchMarketData(ticker)

        const sections: SectionUpdate[] = [
          { section: 'header', data: marketData.header },
          { section: 'valuation', data: marketData.valuation },
          { section: 'growth', data: marketData.growth },
          { section: 'charts', data: marketData.charts },
        ]

        for (const update of sections) {
          send('section', update)
          await delay(200)
        }

        let existingResearch: Record<string, unknown> | undefined
        try {
          const { data: research } = await sb
            .from('stock_research')
            .select('*')
            .ilike('ticker', ticker)
            .order('scan_date', { ascending: false })
            .limit(1)
            .single()
          if (research) existingResearch = research
        } catch {
          // No existing research, that's fine
        }

        const analysis = await generateAnalysis(ticker, marketData, existingResearch)

        const enrichedHeader = { ...marketData.header, sector: analysis.sectorTag }
        send('section', { section: 'header', data: enrichedHeader })
        await delay(200)

        send('section', { section: 'thesis', data: analysis.thesis })
        await delay(200)

        send('section', { section: 'verdict', data: analysis.verdict })

        const fullData: ReportData = {
          header: enrichedHeader,
          valuation: marketData.valuation,
          growth: marketData.growth,
          charts: marketData.charts,
          thesis: analysis.thesis,
          verdict: analysis.verdict,
        }

        await sb.from('reports').update({ data: fullData, status: 'complete' }).eq('id', reportId)

        send('done', { status: 'complete' })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        await sb.from('reports').update({ status: 'error' }).eq('id', reportId)
        send('error', { message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
