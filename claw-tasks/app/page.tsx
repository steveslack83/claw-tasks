'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const features = [
  { icon: '📋', title: 'Queue tasks visually', body: 'Queue, track, and prioritise what your agent works on next.' },
  { icon: '🔒', title: 'Secure by design', body: 'Your agent polls out — we never touch your machine.' },
  { icon: '💳', title: 'Simple pricing', body: 'Free to start. £9/mo for unlimited tasks. £29/mo for teams.' },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="text-5xl mb-6">
            🦞
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-5xl font-bold tracking-tight text-gray-900 mb-4"
          >
            Your OpenClaw agent,<br />finally organised.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-xl text-gray-500 mb-8 max-w-xl mx-auto"
          >
            ClawTasks is a kanban board for your AI agent. Queue tasks, track progress,
            review outputs — all in one place.
          </motion.p>

          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <Link
              href="/auth"
              className="inline-block bg-black text-white px-8 py-3 rounded-xl text-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Get started free →
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left"
        >
          {features.map(f => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  )
}
