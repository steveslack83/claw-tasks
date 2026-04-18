# OpenClaw Task Manager — Design Spec
**Date:** 2026-04-18
**Project:** Derek's £100 → £1000 MRR challenge

---

## Overview

A kanban-style web SaaS that lets OpenClaw users visually manage tasks for their AI agent. Currently, OpenClaw is controlled via messaging apps with no visual task management interface. This fills that gap.

**Target users:** OpenClaw users (350,000+ GitHub stars, rapidly growing)
**Revenue goal:** £1,000 MRR within 30 days of launch

---

## The Problem

OpenClaw users send tasks via Telegram/Discord/WhatsApp. There is no way to:
- See what the agent is working on
- Queue multiple tasks in order
- Review completed task outputs
- Collaborate with a team on task management

---

## The Product

A web dashboard with three kanban columns:
- **Queued** — tasks waiting to be picked up
- **In Progress** — what the agent is currently doing
- **Done** — completed tasks with output/results

Users can create, reorder, and delete tasks. The agent picks them up automatically.

---

## Architecture

### Frontend
- **Framer** — for the marketing landing page and initial UI prototype
- **React (via Framer)** or lightweight Next.js for the app dashboard

### Backend
- **Supabase** — authentication, PostgreSQL database, real-time subscriptions
- Tasks table: `id, user_id, title, description, status, output, created_at, updated_at`
- API key table: `user_id, api_key, created_at`

### OpenClaw Integration (Security Model)
The agent polls outward — no inbound connections to user machines required:

1. User signs up → receives unique API key
2. User adds one line to their OpenClaw config: `TASK_MANAGER_KEY=<api_key>`
3. OpenClaw instance polls `GET /api/tasks/next` every 30 seconds
4. Agent claims a task, updates status to "in_progress"
5. On completion, posts output to `POST /api/tasks/:id/complete`
6. Dashboard updates in real time via Supabase subscriptions

No ports to open. No access to user's machine. Fully secure.

---

## Pricing

| Tier | Price | Limits |
|------|-------|--------|
| Free | £0/month | 10 tasks/month, 1 agent |
| Solo | £9/month | Unlimited tasks, 1 agent |
| Team | £29/month | Unlimited tasks, 3 agents, team access |

**To hit £1,000 MRR:** 112 Solo users, or 35 Team users, or a mix.

---

## Go-To-Market

1. **Post in OpenClaw GitHub discussions and Discord** — free, direct access to target users
2. **ProductHunt launch** — OpenClaw-adjacent tools perform well there
3. **Reddit** — r/SideProject, r/selfhosted, r/OpenClaw (if exists)
4. **£100 budget** — allocated to ProductHunt promotion or Reddit ads

---

## Budget Breakdown

| Item | Cost |
|------|------|
| Domain (.io or .app) | £12/yr |
| Supabase (free tier) | £0 |
| Framer (free tier) | £0 |
| Vercel hosting (free tier) | £0 |
| ProductHunt promotion | £88 |
| **Total** | **£100** |

---

## MVP Scope

**In scope:**
- User auth (Supabase)
- API key generation
- Task CRUD (create, read, update, delete)
- Kanban board UI
- OpenClaw polling endpoint
- Task output display
- Stripe subscription integration (3 tiers)
- Landing page (Framer)

**Out of scope (v1):**
- Mobile app
- Multiple workspace support
- Task templates
- Webhooks/notifications
- Analytics dashboard

---

## Success Criteria

- Week 1: MVP live, first 10 free users
- Week 2: First 5 paying users (£45 MRR)
- Week 3: ProductHunt launch, 50+ paying users (£450 MRR)
- Week 4: 112+ paying users (£1,008 MRR)
