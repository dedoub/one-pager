import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const folderId = req.nextUrl.searchParams.get('folder_id')
  const sb = getSupabase()

  let query = sb.from('reports').select('id, title, ticker, folder_id, status, version, created_at, updated_at').order('updated_at', { ascending: false })

  if (folderId === 'null') {
    query = query.is('folder_id', null)
  } else if (folderId) {
    query = query.eq('folder_id', folderId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
