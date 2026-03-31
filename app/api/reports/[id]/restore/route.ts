import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { versionId } = await req.json()
  if (!versionId) return NextResponse.json({ error: 'versionId required' }, { status: 400 })

  const sb = getSupabase()

  const { data: ver, error: verErr } = await sb
    .from('report_versions')
    .select('data')
    .eq('id', versionId)
    .eq('report_id', id)
    .single()
  if (verErr) return NextResponse.json({ error: verErr.message }, { status: 500 })

  const { error: updateErr } = await sb
    .from('reports')
    .update({ data: ver.data })
    .eq('id', id)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, data: ver.data })
}
