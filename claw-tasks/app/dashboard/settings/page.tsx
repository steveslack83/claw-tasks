import { createClient } from '@/lib/supabase/server'
import { ApiKeyCard } from '@/components/ApiKeyCard'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user!.id)
    .single()

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-bold">Settings</h1>
      <ApiKeyCard />
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold mb-1">Plan</h2>
        <p className="text-sm text-gray-500 mb-3">
          Current plan: <span className="font-medium capitalize">{subscription?.plan ?? 'free'}</span>
        </p>
        <div className="flex gap-3">
          <a href="/api/checkout?plan=solo"
            className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800">
            Upgrade to Solo — £9/mo
          </a>
          <a href="/api/checkout?plan=team"
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            Team — £29/mo
          </a>
        </div>
      </div>
    </div>
  )
}
