import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function validateApiKey(key: string): Promise<string | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('key', key)
    .single()
  if (error || !data) return null
  return data.user_id
}
