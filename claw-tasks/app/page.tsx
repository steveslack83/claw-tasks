'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay } },
})

const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, delay } },
})

const PLANS = [
  {
    name: 'Free',
    price: '£0',
    period: 'forever',
    features: ['Up to 10 tasks', 'Kanban board', 'Agent polling API', 'Magic link auth'],
    cta: 'Get started',
    href: '/auth',
    highlight: false,
  },
  {
    name: 'Solo',
    price: '£9',
    period: 'per month',
    features: ['Unlimited tasks', 'Priority support', 'Task history', 'API key management'],
    cta: 'Start Solo',
    href: '/auth',
    highlight: true,
  },
  {
    name: 'Team',
    price: '£29',
    period: 'per month',
    features: ['Everything in Solo', 'Multiple agents', 'Team dashboard', 'Webhook notifications'],
    cta: 'Start Team',
    href: '/auth',
    highlight: false,
  },
]

const FEATURES = [
  {
    icon: '📋',
    title: 'Visual task queue',
    body: 'Drag, drop, and prioritise tasks in a clean kanban board. Your agent always knows what to work on next.',
  },
  {
    icon: '🤖',
    title: 'Built for AI agents',
    body: 'Simple polling API your OpenClaw agent uses to claim tasks and post results. No webhooks needed.',
  },
  {
    icon: '🔒',
    title: 'Secure by design',
    body: 'Your agent polls out — we never connect to your machine. API keys scoped per user.',
  },
  {
    icon: '⚡',
    title: 'Live status updates',
    body: 'Watch tasks move from queued → in progress → done in real time as your agent works.',
  },
  {
    icon: '📊',
    title: 'Full output history',
    body: 'Every task result is stored so you can review what your agent did, when, and why.',
  },
  {
    icon: '💳',
    title: 'Simple pricing',
    body: 'Free to start. Upgrade when you need more. No surprise fees, no complicated tiers.',
  },
]

// Static kanban preview
const PREVIEW_TASKS = {
  queued: ['Write blog post', 'Research competitors'],
  in_progress: ['Send weekly report'],
  done: ['Scrape product data', 'Update README'],
}

function KanbanPreview() {
  const cols = [
    { label: 'Queued', key: 'queued', color: 'bg-gray-100 text-gray-600' },
    { label: 'In Progress', key: 'in_progress', color: 'bg-blue-50 text-blue-600' },
    { label: 'Done', key: 'done', color: 'bg-green-50 text-green-600' },
  ]
  return (
    <div className="grid grid-cols-3 gap-3 p-5 bg-gray-50 rounded-2xl border border-gray-200 text-left select-none pointer-events-none">
      {cols.map(col => (
        <div key={col.key}>
          <div className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-3 ${col.color}`}>
            {col.label}
          </div>
          <div className="space-y-2">
            {PREVIEW_TASKS[col.key as keyof typeof PREVIEW_TASKS].map(task => (
              <div key={task} className="bg-white rounded-xl px-3 py-2.5 text-xs text-gray-700 font-medium shadow-sm border border-gray-100">
                {task}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-lg">
          <span>🦞</span> ClawTasks
        </div>
        <Link href="/auth" className="text-sm font-medium bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
          Sign in →
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
        <motion.div initial="hidden" animate="show" variants={fadeIn(0)}>
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-6">
            Built for OpenClaw agents
          </span>
        </motion.div>

        <motion.h1
          initial="hidden" animate="show" variants={fadeUp(0.1)}
          className="text-6xl font-extrabold tracking-tight text-gray-900 mb-5 leading-[1.1]"
        >
          Your agent works.<br />
          <span className="text-indigo-600">You stay in control.</span>
        </motion.h1>

        <motion.p
          initial="hidden" animate="show" variants={fadeUp(0.2)}
          className="text-xl text-gray-500 max-w-xl mx-auto mb-10"
        >
          ClawTasks is a kanban board for your OpenClaw AI agent.
          Queue tasks, track progress, review outputs — all in one place.
        </motion.p>

        <motion.div
          initial="hidden" animate="show" variants={fadeUp(0.3)}
          className="flex items-center justify-center gap-4 flex-wrap"
        >
          <Link href="/auth" className="bg-black text-white px-7 py-3 rounded-xl text-base font-semibold hover:bg-gray-800 transition-colors shadow-lg shadow-black/10">
            Get started free →
          </Link>
          <a href="#pricing" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            See pricing ↓
          </a>
        </motion.div>

        <motion.div
          initial="hidden" animate="show" variants={fadeUp(0.45)}
          className="mt-14 max-w-2xl mx-auto"
        >
          <KanbanPreview />
        </motion.div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 border-t border-gray-100 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp(0)}
            className="text-3xl font-bold text-center mb-14"
          >
            Everything your agent needs
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp(i * 0.07)}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
              >
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp(0)}
            className="text-3xl font-bold text-center mb-3"
          >
            Simple, honest pricing
          </motion.h2>
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp(0.1)}
            className="text-center text-gray-500 mb-14"
          >
            Start free. Upgrade when you're ready.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp(i * 0.1)}
                className={`rounded-2xl p-7 flex flex-col ${
                  plan.highlight
                    ? 'bg-black text-white shadow-2xl shadow-black/20 scale-105'
                    : 'bg-gray-50 border border-gray-100 text-gray-900'
                }`}
              >
                <div className={`text-xs font-bold uppercase tracking-widest mb-4 ${plan.highlight ? 'text-indigo-400' : 'text-gray-400'}`}>
                  {plan.name}
                </div>
                <div className="mb-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className={`text-sm ml-1 ${plan.highlight ? 'text-gray-400' : 'text-gray-400'}`}>/ {plan.period}</span>
                </div>
                <ul className="mt-5 mb-7 space-y-2 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className={`text-sm flex items-center gap-2 ${plan.highlight ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className={plan.highlight ? 'text-indigo-400' : 'text-green-500'}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${
                    plan.highlight
                      ? 'bg-white text-black hover:bg-gray-100'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 text-center text-sm text-gray-400">
        <div className="mb-1">🦞 ClawTasks — Kanban for your OpenClaw agent</div>
        <div>Built for makers who let their agents do the work.</div>
      </footer>
    </main>
  )
}
