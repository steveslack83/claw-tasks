'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/dashboard` },
    })
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <div className="text-2xl mb-1">🦞</div>
        <h1 className="text-xl font-bold mb-1">ClawTasks</h1>
        <p className="text-sm text-gray-500 mb-6">Kanban for your OpenClaw agent</p>
        {sent ? (
          <p className="text-sm text-green-600">Check your email for a magic link ✓</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button type="submit"
              className="w-full bg-black text-white text-sm py-2 rounded-lg hover:bg-gray-800">
              Continue with Email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
