'use client'
import { motion } from 'framer-motion'

type Task = {
  id: string
  title: string
  description?: string
  status: 'queued' | 'in_progress' | 'done'
  output?: string
  created_at: string
}

export function TaskCard({ task, onDelete }: { task: Task; onDelete: (id: string) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
        <button
          onClick={() => onDelete(task.id)}
          className="text-gray-300 hover:text-red-400 text-xs flex-shrink-0 mt-0.5"
        >
          ✕
        </button>
      </div>
      {task.description && (
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
      )}
      {task.output && (
        <div className="mt-2 bg-gray-50 rounded p-2">
          <p className="text-xs text-gray-500 font-mono line-clamp-3">{task.output}</p>
        </div>
      )}
      <p className="text-[10px] text-gray-300 mt-2">
        {new Date(task.created_at).toLocaleDateString()}
      </p>
    </motion.div>
  )
}
