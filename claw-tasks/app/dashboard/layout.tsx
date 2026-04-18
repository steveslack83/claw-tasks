import Link from 'next/link'
import { SignOutButton } from '@/components/SignOutButton'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-lg">🦞 ClawTasks</Link>
        <nav className="flex gap-4 items-center text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-black">Board</Link>
          <Link href="/dashboard/settings" className="hover:text-black">Settings</Link>
          <SignOutButton />
        </nav>
      </header>
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
