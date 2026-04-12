# Job Tracker

![Status](https://img.shields.io/badge/status-in%20progress-yellow)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages%20%2B%20Workers-F38020?logo=cloudflare&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38BDF8?logo=tailwindcss&logoColor=white)

> Track your job applications with a timeline of stages.

---

## Live App

**Frontend (Cloudflare Pages):** https://job-application-manager.pages.dev/

---

## How it works

| User | Experience |
|------|------------|
| **Guest** | Use the app freely — data saved in local browser storage |
| **Owner** | Log in to sync data to Cloudflare KV (persistent, cross-device) |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (static export) → Cloudflare Pages |
| API | Cloudflare Worker + Hono |
| Storage | Cloudflare KV |
| Forms | React Hook Form |
| Styling | Tailwind CSS v4 |

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create env file
cp .env.local.example .env.local
# set NEXT_PUBLIC_WORKER_URL=http://localhost:8787

# 3. Run the Worker (separate terminal)
cd worker
cp .dev.vars.example .dev.vars   # fill in your secrets
npm run dev

# 4. Run the frontend
npm run dev
```

---

## Deploy

```bash
# Worker
cd worker && npm run deploy

# Frontend
npm run build && npx wrangler pages deploy out --project-name=your-project-name
```
