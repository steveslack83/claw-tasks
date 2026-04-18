import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="text-5xl mb-6">🦞</div>
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Your OpenClaw agent,<br />finally organised.
        </h1>
        <p className="text-xl text-gray-500 mb-8 max-w-xl mx-auto">
          ClawTasks is a kanban board for your AI agent. Queue tasks, track progress,
          review outputs — all in one place.
        </p>
        <Link href="/auth"
          className="inline-block bg-black text-white px-8 py-3 rounded-xl text-lg font-medium hover:bg-gray-800">
          Get started free →
        </Link>
        <div className="mt-20 grid grid-cols-3 gap-8 text-left">
          {[
            { icon: '📋', title: 'Queue tasks visually', body: 'Queue, track, and prioritise what your agent works on next.' },
            { icon: '🔒', title: 'Secure by design', body: 'Your agent polls out — we never touch your machine.' },
            { icon: '💳', title: 'Simple pricing', body: 'Free to start. £9/mo for unlimited tasks. £29/mo for teams.' },
          ].map(f => (
            <div key={f.title} className="bg-gray-50 rounded-2xl p-6">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
