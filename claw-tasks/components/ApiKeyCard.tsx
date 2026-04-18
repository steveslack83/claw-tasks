'use client'
import { useState } from 'react'

export function ApiKeyCard({ apiKey }: { apiKey: string }) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold mb-1">Agent API Key</h2>
      <p className="text-sm text-gray-500 mb-3">
        Add to your OpenClaw config: <code className="bg-gray-100 px-1 rounded text-xs">TASK_MANAGER_KEY=...</code>
      </p>
      <div className="flex gap-2">
        <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono truncate">
          {revealed ? apiKey : '••••••••••••••••••••••••'}
        </code>
        <button onClick={() => setRevealed(r => !r)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
          {revealed ? 'Hide' : 'Show'}
        </button>
        <button onClick={copy}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
          {copied ? '✓' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
