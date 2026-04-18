'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function SignOutButton() {
  const supabase = createClient()
  const router = useRouter()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <button onClick={signOut} className="text-sm text-gray-400 hover:text-gray-700">
      Sign out
    </button>
  )
}
