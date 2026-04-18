# Morning Briefing — ClawTasks MVP

Good morning Steven. While you slept, Derek built the concept.

---

## What Was Built

**ClawTasks** — a kanban board SaaS for OpenClaw users to manage their AI agent's tasks.

Live at: `claw-tasks/` in this workspace. Ready to deploy to Vercel.

---

## What Steven Needs To Do Next

These require your button-pressing. I can't do these without accounts and real credentials.

### Step 1: Create Supabase Project (free)
1. Go to supabase.com → New project
2. Copy your project URL and keys into `claw-tasks/.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Run the migration: `cd claw-tasks && npx supabase db push`
   (This creates all the tables, RLS policies, and triggers)

### Step 2: Create Stripe Account
1. Go to stripe.com → Create account
2. Create two products:
   - **Solo Plan** — £9/month recurring → copy Price ID
   - **Team Plan** — £29/month recurring → copy Price ID
3. Add to `.env.local`:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SOLO_PRICE_ID`
   - `STRIPE_TEAM_PRICE_ID`

### Step 3: Deploy to Vercel
1. Go to vercel.com → Import Git repo
2. Add all env vars from `.env.local` in the Vercel dashboard
3. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL
4. Deploy

### Step 4: Register Stripe Webhook
1. Stripe Dashboard → Webhooks → Add endpoint
2. URL: `https://your-vercel-url.vercel.app/api/webhooks/stripe`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret → add as `STRIPE_WEBHOOK_SECRET` in Vercel → redeploy

---

## The Tech Stack Built

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Auth | Supabase magic link |
| Database | Supabase PostgreSQL + RLS |
| Payments | Stripe subscriptions |
| UI | Tailwind + Framer Motion |
| Hosting | Vercel (free tier) |

---

## How The Agent Integration Works

Once deployed, OpenClaw users add this to their config:
```
TASK_MANAGER_KEY=<their api key from settings page>
```

Their agent polls:
```
GET https://your-app.vercel.app/api/tasks/next
Header: x-api-key: <key>
```

When done:
```
POST https://your-app.vercel.app/api/tasks/<id>/complete
Header: x-api-key: <key>
Body: { "output": "Task completed: ..." }
```

---

## The Business Plan

- **Target:** OpenClaw's 350,000+ GitHub stars user base
- **Acquisition:** GitHub discussions, OpenClaw Discord, ProductHunt
- **Pricing:** Free → £9/month Solo → £29/month Team
- **To hit £1,000 MRR:** 112 Solo users OR 35 Team users
- **Budget used:** £0 of the £100 (all services on free tiers for now)
- **Reserve £100 for:** ProductHunt promotion on launch day

---

## Git History

```
abed6c9 fix: critical security and subscription fixes pre-launch
1da009a feat: add landing page and Vercel config — MVP complete
263d083 feat: add settings page with API key and subscription UI
31cf630 feat: add auth page and dashboard
7dc3d53 feat: add kanban board UI components
9857545 feat: add Stripe integration
e164a0e feat: add task CRUD API
a299d66 fix: atomic task claiming and body validation
1e69d29 feat: add agent polling and complete endpoints
e4d475e fix: improve middleware cookie handling and error safety
c2062f9 feat: add Supabase clients and auth middleware
3966af6 fix: improve migration with indexes and trigger safety
```

---

Derek
