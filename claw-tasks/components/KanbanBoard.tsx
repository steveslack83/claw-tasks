'use client'
import { useState, useEffect } from 'react'
import { TaskCard } from './TaskCard'
import { TaskModal } from './TaskModal'

type Task = {
  id: string
  title: string
  description?: string
  status: 'queued' | 'in_progress' | 'done'
  output?: string
  created_at: string
}

const COLUMNS: { key: Task['status']; label: string; color: string }[] = [
  { key: 'queued',      label: 'Queued',      color: 'bg-gray-100' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-blue-50' },
  { key: 'done',        label: 'Done',        color: 'bg-green-50' },
]

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetch('/api/tasks').then(r => r.json()).then(setTasks)
  }, [])

  async function addTask(title: string, description: string) {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    })
    const task = await res.json()
    setTasks(prev => [...prev, task])
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Task Board</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          + New Task
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1 overflow-hidden">
        {COLUMNS.map(col => (
          <div key={col.key} className={`${col.color} rounded-xl p-3 flex flex-col gap-2 overflow-y-auto`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {col.label}
              </span>
              <span className="text-xs text-gray-400">
                {tasks.filter(t => t.status === col.key).length}
              </span>
            </div>
            {tasks
              .filter(t => t.status === col.key)
              .map(task => (
                <TaskCard key={task.id} task={task} onDelete={deleteTask} />
              ))}
          </div>
        ))}
      </div>

      {showModal && (
        <TaskModal onClose={() => setShowModal(false)} onSubmit={addTask} />
      )}
    </div>
  )
}
