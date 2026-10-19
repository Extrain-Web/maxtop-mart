# 🚀 Deployment Guide — Maxtop Mart

**Frontend → Vercel · Backend → Render (free) · Keep-alive → cron-job.org**

> বাংলায় সংক্ষেপে: frontend যাবে Vercel-এ, backend যাবে Render-এ (free plan),
> আর Render যেন ঘুমিয়ে না যায় তার জন্য cron-job.org দিয়ে প্রতি ১০ মিনিটে backend-এ
> একটা ping মারব। নিচের ধাপগুলো ঠিকঠাক follow করলেই দুই জায়গায় perfectly deploy হবে।

---

## Why this split?

The backend uses **Socket.IO** (real-time revenue / net-profit / order tracking, notifications, chat)
and a **background cron** (courier auto-sync). Those need a **long-running server** — which Render
provides but Vercel serverless does **not**. So:

| Part | Host | Reason |
|------|------|--------|
| `maxtop-mart-client` (Next.js) | **Vercel** | Best-in-class for Next.js, zero-config |
| `maxtop-mart-backend` (Express) | **Render** | Persistent process → Socket.IO + cron work |
| Keep-alive ping | **cron-job.org** | Render free sleeps after 15 min idle |
| Database | MongoDB Atlas | already configured |
| Image uploads | Cloudinary | already configured (persistent) |

Everything is already wired for this. Files: backend `render.yaml`, `render.env`, `index.js`;
both folders have `.env.example`. Secrets (`.env`, `render.env`) are **gitignored** — never committed.

---

## Prerequisites

- Accounts: **GitHub**, **Render** (render.com), **Vercel** (vercel.com), **cron-job.org** — all free.
- Git installed locally.
- The two folders will become **two separate GitHub repos** (simplest path).

---

## Part A — Push both folders to GitHub (two repos)

From each folder, initialise git and push. (Secrets are gitignored, so `.env` / `render.env` won't upload.)

**Backend:**
```bash
cd E:/Work/maxtop-mart/maxtop-mart-backend
git init
git add .
git commit -m "Maxtop Mart backend"
git branch -M main
git remote add origin https://github.com/<you>/maxtop-mart-backend.git
git push -u origin main
```

**Frontend:**
```bash
cd E:/Work/maxtop-mart/maxtop-mart-client
git init
git add .
git commit -m "Maxtop Mart frontend"
git branch -M main
git remote add origin https://github.com/<you>/maxtop-mart-client.git
git push -u origin main
```

> After pushing, open each repo on GitHub and confirm **`.env` and `render.env` are NOT there**.

---

## Part B — Backend on Render

1. **MongoDB Atlas first (important):** Atlas → **Network Access** → **Add IP** → `0.0.0.0/0`
   (Allow from anywhere). Render's free-tier outbound IP is dynamic, so this is required or the
   backend can't reach the database.

2. Render Dashboard → **New +** → **Blueprint** → connect the **backend** repo → Render reads
   `render.yaml` → **Apply**.
   *(Or **New + → Web Service** manually with: Build `npm install --include=dev && npm run build`,
   Start `npm start`, Health Check Path `/`, Plan **Free**, Region **Singapore**.)*

3. **Environment** tab → the easiest way: open **`.env.render`** locally, copy everything, and use
   Render's **"Add from .env"** paste box. (Or add each key by hand.) It already contains your real
   `DATABASE_URL`, JWT secrets, and Cloudinary keys — just replace the 4 `# TODO` URL lines once you
   know your Render + Vercel URLs.

4. Click **Deploy**. When it's live you get a URL like `https://maxtop-mart-backend.onrender.com`.

5. **Test it:** open that URL in a browser — you should see
   `{"success":true,"message":"🛒 Maxtop Mart API Server is running!"}`.

---

## Part C — Frontend on Vercel

1. Vercel → **Add New → Project** → import the **frontend** repo. Framework auto-detects as **Next.js**
   (Root Directory = the repo root; Build `next build`; Output auto).

2. **Environment Variables** (Production) — add:
   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://maxtop-mart-backend.onrender.com/api` *(your Render URL + `/api`)* |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-client.vercel.app` *(set after first deploy, then redeploy)* |
   | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | *(optional — only if using Google login)* |

3. **Deploy** → you get `https://your-client.vercel.app`.
   The Socket.IO URL for real-time is derived automatically from `NEXT_PUBLIC_API_URL` — nothing else to set.

---

## Part D — Wire the two URLs together (do not skip)

Once you know both real URLs, update the backend env on **Render** → **Environment**:

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://your-client.vercel.app` |
| `BACKEND_URL` | `https://maxtop-mart-backend.onrender.com` |
| `PAYMENT_BACKEND_URL` | `https://maxtop-mart-backend.onrender.com` |
| `PAYMENT_FRONTEND_URL` | `https://your-client.vercel.app` |

Then **Manual Deploy → Deploy latest commit** on Render. On Vercel, set `NEXT_PUBLIC_SITE_URL` to the
real Vercel URL and **Redeploy**.

---

## Part E — Keep the backend awake (cron-job.org) 🔑

Render's **free** plan sleeps after 15 minutes of no traffic (next request then cold-starts ~50s).
An external ping every <15 min keeps it awake 24/7.

1. Sign in at **https://cron-job.org** → **Create cronjob**.
2. **Title:** `Maxtop Mart backend keep-alive`
3. **URL:** `https://maxtop-mart-backend.onrender.com/`  *(the health root; `/api/health` also works)*
4. **Schedule:** every **10 minutes** (`*/10 * * * *`).
5. **Save** → **Enable**.

That's it — the backend stays warm, so Socket.IO stays connected and the courier cron keeps running.
*(One always-on free Render service uses ~730 of the 750 free instance-hours/month — it fits.)*

> ⚡ Don't want to depend on the pinger? Upgrade the Render service to **Starter ($7/mo)** — it never
> sleeps, no cold starts. Then you can delete the cron-job.org job.

---

## Part F — Verify the live site

1. Open the Vercel URL → homepage + products load.
2. **Login:** `admin@gmail.com` / `admin@gmail.com` → Admin Dashboard.
3. Dashboard shows live **Revenue / Net Profit / AOV** (LIVE badges).
4. Place a test order + pay (dev-simulation gateway) → watch the dashboard figures update **in real
   time** (proves Socket.IO works across Render + Vercel).
5. Admin → Payments → **Export Report → PDF / Excel** downloads.

---

## Enabling real payment gateways & courier later

Everything is **enable-on-key-drop**. When you have merchant credentials, add them on **Render →
Environment** and redeploy:

- **bKash / SSLCommerz** — real API code is complete; add the keys and they go **live instantly**.
- **Nagad / Rocket** — fully wired through the app; add keys + set `NAGAD_LIVE=true` / `ROCKET_LIVE=true`.
  The only remaining bit is each provider's session HTTP call — share the merchant API doc and it's a
  ~15-line addition per gateway.
- **Steadfast courier** — add `STEADFAST_API_KEY` + `STEADFAST_SECRET_KEY` (optionally `STEADFAST_AUTO_SYNC=true`).

Until keys are added, gateways run through the built-in **dev-simulation** so the whole flow keeps working.

---

## Notes & gotchas

- **MongoDB Atlas Network Access must include `0.0.0.0/0`** (Part B step 1) or Render can't connect.
- **Images** use Cloudinary (`res.cloudinary.com` is already allowed in `next.config.ts`). If you ever
  switch to local disk uploads, add your Render hostname to `next.config.ts → images.remotePatterns`.
- **CORS** is permissive by default so the frontend is never accidentally blocked; setting `FRONTEND_URL`
  is still good practice.
- **Redeploy after any env-var change** on either platform — env vars are read at boot/build time.
- **`autoDeploy` is on** in `render.yaml` — pushing to the backend repo's `main` auto-redeploys.
  Vercel auto-deploys the frontend on every push too.
