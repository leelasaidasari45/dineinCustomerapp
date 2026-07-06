# DineIn — Customer Pre-Order App

> Order ahead, arrive to perfection.

A Swiggy/Zomato-style food pre-ordering platform where customers order **before** arriving at a restaurant, choose their arrival time, pay 50% advance — and walk in to food that's ready exactly when they are.

## Features

- 🔐 **Auth** — Email signup/login via Supabase Auth
- 🍽️ **Restaurant Discovery** — Browse, search, filter by cuisine
- 📋 **Menu** — Category tabs, veg/non-veg indicators, scroll-spy
- 🛒 **Cart** — Quantity controls, GST calculation
- ⏰ **Arrival Time Picker** — Quick slots (15/30/45/60 min) or custom time
- 💳 **Payment** — Razorpay sandbox, 50% advance split visualization
- ✅ **Order Success** — SVG checkmark animation + confetti burst
- 📡 **Live Tracking** — Supabase Realtime subscription, animated status stepper
- 📦 **Order History** — All past orders with status

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS v3
- **Routing**: React Router v6
- **State**: Zustand
- **Backend**: Supabase (shared project)
- **Realtime**: Supabase Realtime
- **Payments**: Razorpay Sandbox
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Toasts**: Sonner

## Getting Started

```bash
npm install
npm run dev
```

## Seed the Database

First, get your Supabase **service role key** from Dashboard → Settings → API.

```bash
SUPABASE_SERVICE_ROLE_KEY=your_key_here node scripts/seed.js
```

This seeds 6 restaurants with 50+ menu items.

## Supabase Setup

The app uses the shared project at `https://tpusmiojzdalqrxjzph.supabase.co`.

Required tables (create via SQL editor):
```sql
-- See full schema in the prompt documentation
```

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Deploy — `vercel.json` handles SPA routing automatically
