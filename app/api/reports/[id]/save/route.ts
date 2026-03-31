import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getSupabase()

  const { data: report, error: getErr } = await sb.from('reports').select('data, version').eq('id', id).single()
  if (getErr) return NextResponse.json({ error: getErr.message }, { status: 500 })

  const newVersion = report.version + 1

  const { error: snapErr } = await sb.from('report_versions').insert({
    report_id: id,
    version: report.version,
    data: report.data,
  })
  if (snapErr) return NextResponse.json({ error: snapErr.message }, { status: 500 })

  const { error: updateErr } = await sb.from('reports').update({ version: newVersion }).eq('id', id)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ version: newVersion })
}
