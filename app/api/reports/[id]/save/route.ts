import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getSupabase()

  const { data: report, error: getErr } = await sb.from('reports').select('data, version').eq('id', id).single()
  if (getErr) return NextResponse.json({ error: getErr.message }, { status: 500 })

  const newVersion = report.version + 1

  const [snapRes, updateRes] = await Promise.all([
    sb.from('report_versions').insert({
      report_id: id,
      version: report.version,
      data: report.data,
    }),
    sb.from('reports').update({ version: newVersion }).eq('id', id),
  ])

  if (snapRes.error) return NextResponse.json({ error: snapRes.error.message }, { status: 500 })
  if (updateRes.error) return NextResponse.json({ error: updateRes.error.message }, { status: 500 })

  return NextResponse.json({ version: newVersion })
}
