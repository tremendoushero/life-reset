# LIFE RESET — Your life, organised. Your way.

> A premium, ADHD-friendly personal life management web application designed for adults who navigate executive dysfunction, task initiation hurdles, decision paralysis, and time blindness.

Built with **React, Vite, TypeScript, Tailwind CSS, TanStack Query, Lucide icons, and Supabase PostgreSQL**.

---

## 🌟 Core Philosophy

1. **Less friction, less overwhelm.**
2. **No guilt for unfinished tasks.** Missing a day never triggers red failure alerts or breaks your progress.
3. **One small next step** instead of an infinite, paralyzing to-do list.
4. **Adaptive interface** that shifts dynamically to your current capacity.
5. **No streak pressure.** Flexible habits and gentle restarts anytime.

---

## 🚀 Key Signature Features

### 1. Adaptive Capacity Engine
Switch your workspace instantaneously to match your bandwidth:
- **Normal Day**: Full dashboard with priorities, schedule, routines, and goals.
- **Low-Energy Day**: Filters to essentials and short frictionless actions only.
- **Overwhelmed Mode**: Zero distractions. Surfaces **only one single next action**, a calming reminder, and an immediate escape hatch to unload thoughts or postpone non-essentials.
- **Focus Mode**: Minimal interface pairing a single task with an elapsed-time focus timer.
- **Brain Dump Mode**: Distraction-free space to type everything in your head without forced categorization.

### 2. Tiny-Step Rescue
Break daunting tasks into micro-steps (2-min, 5-min, 10-min, or 15-min increments).
- Includes the **"I'm stuck" diagnostic prompt** to pinpoint why you're frozen (vague task, unclear start, missing info, low energy) and offers actionable paths forward without requiring third-party AI APIs.

### 3. Gentle Restart System
Helps you return after days or weeks away.
- **No missed-day warnings or broken streaks.**
- Review past items with compassion.
- Select what still matters today, and cleanly park the rest in your Inbox.
- **Zero data loss**: never destroys tasks or history automatically.

### 4. Life Admin & "Waiting-For" Tracker
- Track pending replies, prescriptions, landlord requests, and documents.
- Set follow-up dates to immediately liberate your working memory.

### 5. Money Hub
- Monthly budget buffer, income/expense logging, recurring bills with payment status toggles, savings goals, and debt reduction tracking.

### 6. Dopamine Menu & Wellness
- Categorized dopamine activities: **Appetizers** (2-5 min quick sparks), **Entrées** (20-45 min deep recharges), **Sides** (background sensory boosts), and **Desserts** (fun bounded rewards).
- Grounding coping toolkit (5-4-3-2-1, Physiological Sigh, Half-Done Mantra).

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide icons, React Router v6, TanStack Query, Canvas Confetti.
- **Backend & Database**: Supabase PostgreSQL with 30 production tables, Foreign Keys, UUIDs, and strict Row Level Security (RLS) policies.
- **PWA**: Installable web application with service worker app-shell caching and offline safe-caching.
- **Payments**: Provider-agnostic abstraction for $19 one-time lifetime purchase with server-side entitlement verification.

---

## 📦 Getting Started Locally

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

To run with full Supabase integration, provide your project credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
*(If left empty, Life Reset automatically provides **Demo & Local Persistence Mode**, enabling instant evaluation with zero setup!)*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Run Test Suite
```bash
npm test
```

### 5. Production Build
```bash
npm run build
```

---

## 🗄️ Database Setup (Supabase)

The complete SQL schema with 30 tables, indexes, constraints, and Row Level Security is located at:
`supabase/migrations/20261110000000_initial_schema.sql`

To apply:
1. In your Supabase Dashboard, navigate to the **SQL Editor**.
2. Paste the contents of `supabase/migrations/20261110000000_initial_schema.sql`.
3. Click **Run**. All tables and RLS policies will be created and secured.

---

## 💳 Payment & Entitlement Integration

- **Model**: $19 One-Time Lifetime Purchase.
- **Local Dev / Test Mode**: Pre-configured with a safe test provider that validates entitlements without processing real cards.
- **Edge Function**: Located at `supabase/functions/verify-payment/index.ts` for secure, server-verified entitlement activation and webhook processing.

---

## 📄 License & Health Notice
© 2026 LIFE RESET. All rights reserved.
*Notice: LIFE RESET is an executive life management application designed with ADHD-friendly principles. It does not diagnose, treat, or replace medical or mental health care.*

