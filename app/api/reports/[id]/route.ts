import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getSupabase()

  const [reportRes, chatsRes, versionsRes] = await Promise.all([
    sb.from('reports').select('*').eq('id', id).single(),
    sb.from('report_chats').select('*').eq('report_id', id).order('created_at'),
    sb.from('report_versions').select('id, version, data, created_at').eq('report_id', id).order('version'),
  ])

  if (reportRes.error) return NextResponse.json({ error: reportRes.error.message }, { status: 500 })

  return NextResponse.json({
    ...reportRes.data,
    chats: chatsRes.data ?? [],
    versions: versionsRes.data ?? [],
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const sb = getSupabase()
  const { error } = await sb.from('reports').update({ folder_id: body.folder_id }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getSupabase()
  const { error } = await sb.from('reports').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
