# OpenClaw Task Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a kanban SaaS at `claw-tasks.app` where OpenClaw users manage agent tasks visually, with Supabase backend, Stripe subscriptions, and a polling REST API for agent integration.

**Architecture:** Next.js 14 App Router for full-stack, Supabase for auth/PostgreSQL/real-time, Stripe for billing. OpenClaw agents poll outward to `/api/tasks/next` — no inbound connections to user machines.

**Tech Stack:** Next.js 14, TypeScript, Supabase, Stripe, Tailwind CSS, Framer Motion, Vercel

---

## File Map

```
app/
  layout.tsx                    # Root layout, fonts
  page.tsx                      # Landing page
  auth/
    page.tsx                    # Sign in / sign up
  dashboard/
    layout.tsx                  # Dashboard shell (sidebar + header)
    page.tsx                    # Kanban board
    settings/
      page.tsx                  # API key + subscription management
  api/
    tasks/
      route.ts                  # GET list, POST create
      [id]/
        route.ts                # PATCH update, DELETE
        complete/
          route.ts              # POST — agent marks task done
      next/
        route.ts                # GET — agent polls for next queued task
    webhooks/
      stripe/
        route.ts                # Stripe webhook handler
components/
  KanbanBoard.tsx               # Three-column drag board
  TaskCard.tsx                  # Individual card (title, status, output)
  TaskModal.tsx                 # Create / edit task form
  ApiKeyCard.tsx                # Show/copy/regenerate API key
lib/
  supabase/
    client.ts                   # Browser Supabase client
    server.ts                   # Server Supabase client (cookies)
  stripe.ts                     # Stripe singleton
  api-auth.ts                   # Validate agent API key from header
middleware.ts                   # Redirect unauthenticated users from /dashboard
supabase/
  migrations/
    001_initial.sql             # Full schema
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`

- [ ] **Step 1: Bootstrap Next.js app**

```bash
npx create-next-app@latest claw-tasks --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd claw-tasks
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr stripe framer-motion @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install -D supabase
```

- [ ] **Step 3: Create `.env.local`**

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SOLO_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev
```
Expected: App running at `http://localhost:3000`

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: scaffold Next.js app with dependencies"
```

---

## Task 2: Database Schema

**Files:**
- Create: `supabase/migrations/001_initial.sql`

- [ ] **Step 1: Initialise Supabase locally**

```bash
npx supabase init
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

- [ ] **Step 2: Write migration**

Create `supabase/migrations/001_initial.sql`:

```sql
-- API keys for agent polling auth
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null unique,
  key text unique not null default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz default now()
);
alter table api_keys enable row level security;
create policy "Users own their api key" on api_keys
  for all using (auth.uid() = user_id);

-- Tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  status text not null default 'queued'
    check (status in ('queued', 'in_progress', 'done')),
  output text,
  position integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table tasks enable row level security;
create policy "Users own their tasks" on tasks
  for all using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
create trigger tasks_updated_at before update on tasks
  for each row execute procedure update_updated_at();

-- Subscriptions
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'free'
    check (plan in ('free', 'solo', 'team')),
  updated_at timestamptz default now()
);
alter table subscriptions enable row level security;
create policy "Users read own subscription" on subscriptions
  for select using (auth.uid() = user_id);

-- Auto-create subscription + api key on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into subscriptions (user_id) values (new.id);
  insert into api_keys (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

- [ ] **Step 3: Push migration**

```bash
npx supabase db push
```
Expected: Migration applied, tables visible in Supabase dashboard.

- [ ] **Step 4: Commit**

```bash
git add supabase/ && git commit -m "feat: add database schema"
```

---

## Task 3: Supabase Clients + Middleware

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `middleware.ts`

- [ ] **Step 1: Browser client**

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Server client**

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

- [ ] **Step 3: Middleware**

Create `middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }
  if (user && request.nextUrl.pathname === '/auth') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth'],
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/ middleware.ts && git commit -m "feat: add Supabase clients and auth middleware"
```

---

## Task 4: Agent API — Polling + Complete Endpoints

**Files:**
- Create: `lib/api-auth.ts`, `app/api/tasks/next/route.ts`, `app/api/tasks/[id]/complete/route.ts`

- [ ] **Step 1: Write failing test for api-auth**

Create `__tests__/api-auth.test.ts`:

```typescript
import { validateApiKey } from '@/lib/api-auth'

// Mock Supabase service client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: { user_id: 'user-123' }, error: null }))
        }))
      }))
    }))
  }))
}))

test('returns user_id for valid key', async () => {
  const result = await validateApiKey('valid-key')
  expect(result).toBe('user-123')
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx jest __tests__/api-auth.test.ts
```
Expected: FAIL — `validateApiKey` not found.

- [ ] **Step 3: Implement api-auth**

Create `lib/api-auth.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function validateApiKey(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('key', key)
    .single()
  if (error || !data) return null
  return data.user_id
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx jest __tests__/api-auth.test.ts
```
Expected: PASS

- [ ] **Step 5: Implement polling endpoint**

Create `app/api/tasks/next/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateApiKey } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const key = request.headers.get('x-api-key')
  if (!key) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const userId = await validateApiKey(key)
  if (!userId) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

  // Claim the next queued task atomically
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'queued')
    .order('position', { ascending: true })
    .limit(1)

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ task: null })
  }

  const task = tasks[0]
  await supabase
    .from('tasks')
    .update({ status: 'in_progress' })
    .eq('id', task.id)

  return NextResponse.json({ task: { ...task, status: 'in_progress' } })
}
```

- [ ] **Step 6: Implement complete endpoint**

Create `app/api/tasks/[id]/complete/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateApiKey } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const key = request.headers.get('x-api-key')
  if (!key) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const userId = await validateApiKey(key)
  if (!userId) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

  const { output } = await request.json()

  const { error } = await supabase
    .from('tasks')
    .update({ status: 'done', output })
    .eq('id', params.id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 7: Commit**

```bash
git add lib/api-auth.ts app/api/tasks/ __tests__/ && git commit -m "feat: add agent polling and complete endpoints"
```

---

## Task 5: Task CRUD API

**Files:**
- Create: `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts`

- [ ] **Step 1: Task list + create endpoint**

Create `app/api/tasks/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('position', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, description } = await request.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  // Position: after last queued task
  const { count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: user.id, title: title.trim(), description, position: count ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2: Task update + delete endpoint**

Create `app/api/tasks/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const allowed = ['title', 'description', 'status', 'position']
  const updates = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/tasks/ && git commit -m "feat: add task CRUD API"
```

---

## Task 6: Stripe Integration

**Files:**
- Create: `lib/stripe.ts`, `app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Stripe singleton**

Create `lib/stripe.ts`:

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export const PLANS = {
  solo: process.env.STRIPE_SOLO_PRICE_ID!,
  team: process.env.STRIPE_TEAM_PRICE_ID!,
}
```

- [ ] **Step 2: Webhook handler**

Create `app/api/webhooks/stripe/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.created') {
    const sub = event.data.object as any
    const priceId = sub.items.data[0].price.id
    const plan = priceId === process.env.STRIPE_SOLO_PRICE_ID ? 'solo' : 'team'

    await supabase
      .from('subscriptions')
      .update({
        stripe_subscription_id: sub.id,
        stripe_customer_id: sub.customer,
        plan,
      })
      .eq('stripe_customer_id', sub.customer)
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as any
    await supabase
      .from('subscriptions')
      .update({ plan: 'free', stripe_subscription_id: null })
      .eq('stripe_customer_id', sub.customer)
  }

  return NextResponse.json({ received: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/stripe.ts app/api/webhooks/ && git commit -m "feat: add Stripe webhook handler"
```

---

## Task 7: Kanban Board UI

**Files:**
- Create: `components/TaskCard.tsx`, `components/TaskModal.tsx`, `components/KanbanBoard.tsx`

- [ ] **Step 1: TaskCard component**

Create `components/TaskCard.tsx`:

```typescript
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
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing"
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
```

- [ ] **Step 2: TaskModal component**

Create `components/TaskModal.tsx`:

```typescript
'use client'
import { useState } from 'react'

export function TaskModal({ onClose, onSubmit }: {
  onClose: () => void
  onSubmit: (title: string, description: string) => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    await onSubmit(title, description)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">New Task</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What should your agent do?"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Additional context (optional)"
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800">
              Cancel
            </button>
            <button type="submit" disabled={loading || !title.trim()}
              className="px-4 py-2 text-sm bg-black text-white rounded-lg disabled:opacity-40">
              {loading ? 'Adding…' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: KanbanBoard component**

Create `components/KanbanBoard.tsx`:

```typescript
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
```

- [ ] **Step 4: Commit**

```bash
git add components/ && git commit -m "feat: add kanban board UI components"
```

---

## Task 8: Auth Page + Dashboard

**Files:**
- Create: `app/auth/page.tsx`, `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`

- [ ] **Step 1: Auth page**

Create `app/auth/page.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
```

- [ ] **Step 2: Dashboard layout**

Create `app/dashboard/layout.tsx`:

```typescript
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-lg">🦞 ClawTasks</Link>
        <nav className="flex gap-4 text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-black">Board</Link>
          <Link href="/dashboard/settings" className="hover:text-black">Settings</Link>
        </nav>
      </header>
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Dashboard page**

Create `app/dashboard/page.tsx`:

```typescript
import { KanbanBoard } from '@/components/KanbanBoard'

export default function DashboardPage() {
  return <KanbanBoard />
}
```

- [ ] **Step 4: Commit**

```bash
git add app/ && git commit -m "feat: add auth page and dashboard"
```

---

## Task 9: Settings Page (API Key + Subscription)

**Files:**
- Create: `app/dashboard/settings/page.tsx`, `components/ApiKeyCard.tsx`

- [ ] **Step 1: ApiKeyCard component**

Create `components/ApiKeyCard.tsx`:

```typescript
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
        Add this to your OpenClaw config: <code className="bg-gray-100 px-1 rounded text-xs">TASK_MANAGER_KEY=...</code>
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
```

- [ ] **Step 2: Settings page**

Create `app/dashboard/settings/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { ApiKeyCard } from '@/components/ApiKeyCard'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: apiKeyRow } = await supabase
    .from('api_keys')
    .select('key')
    .eq('user_id', user!.id)
    .single()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user!.id)
    .single()

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-bold">Settings</h1>
      <ApiKeyCard apiKey={apiKeyRow?.key ?? ''} />
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
```

- [ ] **Step 3: Checkout API route**

Create `app/api/checkout/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth', request.url))

  const plan = request.nextUrl.searchParams.get('plan') as 'solo' | 'team'
  if (!PLANS[plan]) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: PLANS[plan], quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    customer_email: user.email,
    metadata: { user_id: user.id },
  })

  return NextResponse.redirect(session.url!)
}
```

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/settings/ components/ApiKeyCard.tsx app/api/checkout/ && git commit -m "feat: add settings page with API key and Stripe checkout"
```

---

## Task 10: Landing Page + Deploy

**Files:**
- Create: `app/page.tsx`

- [ ] **Step 1: Landing page**

Create `app/page.tsx`:

```typescript
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
            { icon: '📋', title: 'Queue tasks visually', body: 'Drag, drop, and prioritise what your agent works on next.' },
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
```

- [ ] **Step 2: Deploy to Vercel**

```bash
npm install -g vercel
vercel --prod
```

Set environment variables in Vercel dashboard (all keys from `.env.local`).

- [ ] **Step 3: Register Stripe webhook**

In Stripe dashboard → Webhooks → Add endpoint:
- URL: `https://your-domain.vercel.app/api/webhooks/stripe`
- Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

Copy webhook signing secret → add as `STRIPE_WEBHOOK_SECRET` in Vercel env vars → redeploy.

- [ ] **Step 4: Smoke test**

1. Visit landing page — renders correctly
2. Sign up with email — magic link arrives, redirects to `/dashboard`
3. Create a task — appears in Queued column
4. Call `GET /api/tasks/next` with `x-api-key` header — returns task, moves to In Progress
5. Call `POST /api/tasks/:id/complete` — moves to Done with output
6. Visit `/dashboard/settings` — API key visible, upgrade links work

- [ ] **Step 5: Final commit**

```bash
git add app/page.tsx && git commit -m "feat: add landing page — MVP complete"
```

---

## OpenClaw Integration Snippet

Include this in documentation / settings page for users to copy into their OpenClaw config:

```python
# In your OpenClaw SOUL.md or skill file:
# Poll ClawTasks every 30 seconds for queued jobs
import httpx, time, os

TASK_API = "https://your-domain.vercel.app/api/tasks"
KEY = os.environ["TASK_MANAGER_KEY"]

def poll_and_execute():
    r = httpx.get(f"{TASK_API}/next", headers={"x-api-key": KEY})
    task = r.json().get("task")
    if not task:
        return
    # ... execute task ...
    output = f"Completed: {task['title']}"
    httpx.post(f"{TASK_API}/{task['id']}/complete",
               headers={"x-api-key": KEY},
               json={"output": output})
```
