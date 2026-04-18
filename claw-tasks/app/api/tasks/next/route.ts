import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateApiKey } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const key = request.headers.get('x-api-key')
  if (!key) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const userId = await validateApiKey(key)
  if (!userId) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'queued')
    .order('position', { ascending: true })
    .limit(1)

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ task: null })
  }

  const task = tasks[0]
  await supabase
    .from('tasks')
    .update({ status: 'in_progress' })
    .eq('id', task.id)

  return NextResponse.json({ task: { ...task, status: 'in_progress' } })
}
