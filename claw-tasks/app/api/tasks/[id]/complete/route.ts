import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateApiKey } from '@/lib/api-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const key = request.headers.get('x-api-key')
  if (!key) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const userId = await validateApiKey(key)
  if (!userId) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

  const { id } = await params
  const { output } = await request.json()

  const { error } = await supabase
    .from('tasks')
    .update({ status: 'done', output })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
