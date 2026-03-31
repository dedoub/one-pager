import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { refineReport } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { reportId, message } = await req.json()
  if (!reportId || !message) return NextResponse.json({ error: 'reportId and message required' }, { status: 400 })

  const sb = getSupabase()

  const { data: report, error: reportErr } = await sb
    .from('reports')
    .select('data')
    .eq('id', reportId)
    .single()
  if (reportErr) return NextResponse.json({ error: reportErr.message }, { status: 500 })

  const { data: history } = await sb
    .from('report_chats')
    .select('role, content')
    .eq('report_id', reportId)
    .order('created_at', { ascending: false })
    .limit(20)

  const chatHistory = (history ?? []).reverse()

  await sb.from('report_chats').insert({ report_id: reportId, role: 'user', content: message })

  const result = await refineReport(report.data, chatHistory, message)

  const updatedData = { ...report.data }
  for (const [key, value] of Object.entries(result.sections)) {
    if (key in updatedData || ['header', 'valuation', 'growth', 'charts', 'thesis', 'verdict'].includes(key)) {
      const existing = (updatedData as Record<string, unknown>)[key]
      // Deep merge: preserve existing fields, overlay new ones
      if (existing && typeof existing === 'object' && !Array.isArray(existing) && value && typeof value === 'object' && !Array.isArray(value)) {
        (updatedData as Record<string, unknown>)[key] = { ...existing, ...(value as Record<string, unknown>) }
      } else {
        (updatedData as Record<string, unknown>)[key] = value
      }
    }
  }

  await Promise.all([
    sb.from('reports').update({ data: updatedData }).eq('id', reportId),
    sb.from('report_chats').insert({ report_id: reportId, role: 'assistant', content: result.message }),
  ])

  return NextResponse.json({
    sections: result.sections,
    message: result.message,
    updatedData,
  })
}
