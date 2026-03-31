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

  const modifiedSections = await refineReport(report.data, chatHistory, message)

  const updatedData = { ...report.data }
  for (const [key, value] of Object.entries(modifiedSections)) {
    if (key in updatedData || ['header', 'valuation', 'growth', 'charts', 'thesis', 'verdict'].includes(key)) {
      (updatedData as Record<string, unknown>)[key] = value
    }
  }

  const assistantMsg = `Updated sections: ${Object.keys(modifiedSections).join(', ')}`
  await Promise.all([
    sb.from('reports').update({ data: updatedData }).eq('id', reportId),
    sb.from('report_chats').insert({ report_id: reportId, role: 'assistant', content: assistantMsg }),
  ])

  return NextResponse.json({
    sections: modifiedSections,
    updatedData,
  })
}
