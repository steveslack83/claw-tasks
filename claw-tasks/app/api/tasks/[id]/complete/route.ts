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
  let output: string | undefined
  try {
    const body = await request.json()
    output = body.output
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('tasks')
    .update({ status: 'done', output })
    .eq('id', id)
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: 'Task not found or not in progress' }, { status: 409 })
  }
  return NextResponse.json({ success: true })
}
