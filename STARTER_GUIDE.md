# 🛍️ E-commerce Starter Kit — Reusable Template Guide

**একটা সম্পূর্ণ ফুল-স্ট্যাক single-vendor ই-কমার্স বেস** (Next.js + Express/TypeScript + MongoDB), তৈরি করা হয়েছে যাতে **যেকোনো নতুন ই-কমার্স প্রজেক্টের জন্য বারবার রিইউজ** করা যায়।

> মূল ধারণা: **ব্যাকএন্ড + অ্যাডমিন + ডেটা মডেল + API = রিইউজেবল কোর** (রাখো, শুধু টিউন করো)। **ফ্রন্টএন্ড ডিজাইন/UI = শেল** (প্রতি প্রজেক্টে পুরো বদলাও)। এই গাইডটা নতুন সেশনে পড়িয়ে দিলেই নতুন প্রজেক্ট অনুযায়ী পারফেক্টলি মানিয়ে নেওয়া যাবে।

---

## এক নজরে (Bangla summary)

- এটা কোনো নির্দিষ্ট প্রজেক্ট নয় — এটা একটা **টেমপ্লেট/বয়লারপ্লেট**। এই একটা ফোল্ডার (`ecommerce-starter/`) নিয়ে যেকোনো নতুন ই-কমার্স প্রজেক্ট শুরু করা যায়।
- ভেতরে দুটো আলাদা ফোল্ডার: `client/` (Next.js ফ্রন্টএন্ড) আর `server/` (Express ব্যাকএন্ড)।
- **কোনো আসল সিক্রেট নেই, `.git` নেই** — clean clone। শুধু `.env.example` টেমপ্লেট আছে।
- নতুন প্রজেক্টে সাধারণত যা বদলাবে: (১) **ডিজাইন/UI পুরোটা**, (২) **ব্র্যান্ড নাম**, (৩) **নতুন খালি ডাটাবেজ**, (৪) **ছবি স্টোরেজ**। ব্যাকএন্ড লজিক, অ্যাডমিন প্যানেল, API — বেশিরভাগ একই থাকে।

---

## 🧠 রিইউজ ফিলোসফি — KEEP vs REPLACE

| রাখো (reusable core) | বদলাও (per-project) |
|---|---|
| ✅ পুরো `server/` — Express API, Mongoose মডেল, auth, পেমেন্ট, কুরিয়ার, রিয়েল-টাইম | 🎨 `client/` এর UI/ডিজাইন — কম্পোনেন্ট, পেজ লেআউট, স্টাইল, থিম |
| ✅ অ্যাডমিন ড্যাশবোর্ডের ফাংশনালিটি (প্রোডাক্ট/অর্ডার/ক্যাটাগরি/কুপন/ফিন্যান্স/সেটিংস) | 🎨 ব্র্যান্ড নাম, লোগো, রঙ, ফন্ট, হোমপেজ সেকশন |
| ✅ `client/` এর **ডেটা লেয়ার** — `src/redux/api/*` (RTK Query), slices, hooks | 🎨 প্রোডাক্ট ক্যাটাগরি স্ট্রাকচার, কনটেন্ট |
| ✅ ডেটা মডেল / API কন্ট্রাক্ট / রিয়েল-টাইম socket ইভেন্ট | ⚙️ কোন optional ফিচার অন (পেমেন্ট গেটওয়ে, কুরিয়ার, AI সার্চ) |

> **রিডিজাইনের মূল ট্রিক:** `client/src/redux/api/*` (API কল), slices আর hooks **অপরিবর্তিত রাখো** — শুধু `client/src/components/*` আর `client/src/app/*` এর ভিজুয়াল অংশ নতুন ডিজাইনে লেখো। তাহলে ব্যাকএন্ডের সাথে কানেকশন ভাঙবে না, শুধু চেহারা বদলাবে।

---

## 📁 Structure

```
ecommerce-starter/
├── client/                  ← Next.js 16 (App Router) ফ্রন্টএন্ড
│   ├── src/app/             ← পেজ/রুট (redesign এখানে)
│   ├── src/components/      ← UI কম্পোনেন্ট (redesign এখানে)
│   ├── src/redux/api/       ← RTK Query API লেয়ার (রাখো — ব্যাকএন্ড কানেকশন)
│   ├── src/redux/slices/    ← Redux state (রাখো)
│   └── .env.example
├── server/                  ← Express + TypeScript + MongoDB ব্যাকএন্ড
│   ├── src/app/modules/     ← ফিচার মডিউল (auth, product, order, payment, ...)
│   ├── src/app/config/      ← কনফিগ (env)
│   ├── render.yaml          ← Render ডিপ্লয় ব্লুপ্রিন্ট
│   └── .env.example
├── STARTER_GUIDE.md         ← এই ফাইল
├── systemfeaturetesting.md  ← সম্পূর্ণ ফিচার ইনভেন্টরি (কী কী আছে জানতে)
└── DEPLOYMENT.md            ← ডিপ্লয়মেন্ট গাইড
```

---

## 🏗️ Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack), React 19, Redux Toolkit + RTK Query, Tailwind |
| Backend | Node ≥20, Express, TypeScript, Mongoose |
| Database | MongoDB (Atlas অথবা লোকাল) |
| Real-time | Socket.IO (অর্ডার/পেমেন্ট/নোটিফিকেশন লাইভ) |
| Images | Cloudinary **বা** VPS ডিস্ক (`/uploads`) — অটো-সুইচ |
| Auth | JWT (access+refresh) + optional Google OAuth |

> ⚠️ `client/next.config.ts` এ `reactCompiler` **false** রাখো — true দিলে পেজ Suspense fallback-এ আটকে যায় (জানা বাগ)।

---

## ⚡ Quick start (লোকাল)

```bash
# Server
cd server
npm install
cp .env.example .env         # ভ্যালু বসাও (নিচের env সেকশন)
npm run start:dev            # http://localhost:5000  (API: /api)

# Client (নতুন টার্মিনাল)
cd client
npm install
cp .env.example .env.local
npm run dev                  # http://localhost:3000
```

> পোর্ট: server **:5000**, client **:3000**। অন্য প্রজেক্টের **:5001 এড়িয়ে চলো**।

---

## 🔧 নতুন প্রজেক্টের জন্য অ্যাডাপ্ট করা (step by step)

### 1) নতুন ডাটাবেজ
`server/.env` এ নতুন খালি `DATABASE_URL` দাও (MongoDB Atlas ফ্রি M0 বা লোকাল)। খালি DB — প্রথম রাইটে অটো তৈরি হয়।

### 2) ছবি স্টোরেজ (অটো-সুইচ, কোড বদলাতে হয় না)
- `CLOUDINARY_*` **খালি** → ছবি `server/uploads/` এ, `GET /uploads/<file>` এ সার্ভ (VPS মোড; `BACKEND_URL` সেট করো)।
- `CLOUDINARY_*` **সেট** → ক্লাউড স্টোরেজ।
- ⚠️ Render/Vercel-এর ephemeral ডিস্কে VPS মোড টেকে না → সেখানে Cloudinary দরকার।

### 3) ব্র্যান্ড রিব্র্যান্ড
নতুন প্রজেক্টের নাম দিয়ে `"Maxtop Mart"` রিপ্লেস করো:
- `client/src` — ~৩২টা ফাইল (মূলত পেজ SEO metadata `title`/`description`, `app/layout.tsx`, `app/icon.svg`, হোমপেজ টেক্সট)
- `server/src` — ~১৫টা ফাইল (SEO ডিফল্ট, ইমেইল টেমপ্লেট, `siteContent.service.ts` seed ডিফল্ট, পেমেন্ট মেসেজ)
- `client/package.json` name: `maxtop-mart-client` → নতুন নাম
- `server/package.json` name: `maxtop-mart-server` → নতুন নাম
> লোগো/ফোন/ইমেইল/ঠিকানা/পলিসি পেজ কোডে হার্ডকোড নেই — এগুলো **অ্যাডমিন প্যানেল (Site Content)** থেকে বসে। শুধু প্রথম seed ডিফল্ট বদলাতে চাইলে `server/src/app/modules/siteContent/siteContent.service.ts` দেখো।

### 4) ডিজাইন/UI রিডিজাইন (মূল কাজ)
- **রাখো:** `client/src/redux/api/*`, `client/src/redux/slices/*`, hooks — এগুলো ব্যাকএন্ড কানেকশন।
- **বদলাও:** `client/src/components/*` আর `client/src/app/*` এর ভিজুয়াল/লেআউট।
- API রেসপন্স শেপ ঠিক রেখে শুধু presentation লেখো → কিছু ভাঙবে না।

### 5) Optional ফিচার অন/অফ (enable-on-key-drop)
key ছাড়া সব ডেমো/স্যান্ডবক্স মোডে চলে; key দিলে লাইভ:
| ফিচার | env (server, key না দিলে বাদ থাকে) |
|---|---|
| Google সাইন-ইন | `GOOGLE_CLIENT_ID/SECRET` + client `NEXT_PUBLIC_GOOGLE_CLIENT_ID` |
| ইমেইল | `EMAIL_USER`, `EMAIL_PASS` (Gmail App Password) |
| bKash / SSLCommerz / Nagad / Rocket | নিজ নিজ merchant creds |
| অটো কুরিয়ার (Steadfast) | `STEADFAST_API_KEY`, `STEADFAST_SECRET_KEY` |
| AI ইমেজ সার্চ | ফ্রি এমনিতেই চলে; ভিশন key দিলে রিয়েল AI |

---

## 📝 Env reference

বিস্তারিত কমেন্টসহ টেমপ্লেট: [`server/.env.example`](server/.env.example) → `server/.env`; [`client/.env.example`](client/.env.example) → `client/.env.local`।

**Server ন্যূনতম:**
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=<নতুন MongoDB>
JWT_ACCESS_SECRET=<জেনারেট হবে>
JWT_REFRESH_SECRET=<জেনারেট হবে>
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
CLOUDINARY_CLOUD_NAME=      # খালি = VPS ডিস্ক মোড
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```
**Client ন্যূনতম:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api    # অবশ্যই /api সহ
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```
> রিয়েল-টাইম Socket.IO URL অটোমেটিক `NEXT_PUBLIC_API_URL` থেকে বের হয় (`/api` বাদ দিয়ে)।

---

## 👤 First admin
1. সাইট থেকে সাধারণভাবে সাইন-আপ করো।
2. DB-তে: `db.users.updateOne({ email: "you@x.com" }, { $set: { role: "admin" } })`
3. `/dashboard/admin` অ্যাক্সেস পাবে। (চাইলে সেটআপে একটা seed স্ক্রিপ্ট দিয়ে অ্যাডমিন + ডেমো ডেটা বসানো যায়।)

---

## 🚀 Deployment
বিস্তারিত [`DEPLOYMENT.md`](DEPLOYMENT.md)। সংক্ষেপে: **server → Render** (Socket.IO + cron টেকে) বা **VPS** (persistent ডিস্কে Cloudinary ছাড়াই ছবি চলে); **client → Vercel**। ⚠️ server-কে Vercel serverless-এ দিও না।

## 🧪 Feature inventory
[`systemfeaturetesting.md`](systemfeaturetesting.md) — সেকশন ধরে ধরে কী কী ফিচার আছে + QA নোট। নতুন প্রজেক্টে কোনটা রাখবে/বাদ দেবে ঠিক করতে এটা দেখো।

## 🔒 Clone / security notes
- ❌ কোনো আসল সিক্রেট কপি হয়নি (`.env`, `.env.render`, `render.env`, `.env.local` বাদ)। শুধু `.env.example`।
- ❌ পুরোনো `.git` বাদ — fresh, আগের রিমোট/কমিট নেই।
- ❌ `node_modules`/`.next`/`dist` বাদ — `npm install` দিলেই ফিরবে।
- ✅ দুই ফোল্ডারেই `.gitignore` আছে — `git init` করলে সিক্রেট প্রোটেক্টেড।

---

## 📋 নতুন প্রজেক্ট শুরুর রেডি প্রম্পট (কপি-পেস্ট, প্রতি প্রজেক্টে রিইউজেবল)

নতুন সেশনে `ecommerce-starter/` (বা কপি করা নতুন ফোল্ডার) খুলে নিচেরটা ফাঁকা ভরে পেস্ট করো:

```
এটা একটা রিইউজেবল ই-কমার্স স্টার্টার (client/ + server/)। আমি এটা দিয়ে একটা নতুন
প্রজেক্ট বানাচ্ছি। প্রথমে STARTER_GUIDE.md পুরো পড়ো (দরকারে systemfeaturetesting.md,
DEPLOYMENT.md)। তুমি একজন সিনিয়র ফুল-স্ট্যাক + QA ডেভেলপার।

── নতুন প্রজেক্ট ──
• প্রজেক্টের নাম / ব্র্যান্ড: <নাম>
• ডিজাইন ডিরেকশন: <যেমন — মিনিমাল ফ্যাশন স্টোর / ইলেকট্রনিক্স / গ্রোসারি; রঙ, ভাইব>
• নতুন MongoDB DATABASE_URL: <বসাও>
• ছবি স্টোরেজ: <VPS ডিস্ক / Cloudinary (হলে ৩টা key)>
• সাইট URL (আপাতত লোকাল): frontend=http://localhost:3000, backend=http://localhost:5000
• কোন optional ফিচার লাগবে: <Google / Email / bKash / Nagad / কুরিয়ার / AI সার্চ — key থাকলে দাও>
• কোন ফিচার বাদ দিতে চাই (থাকলে): <...>

── তুমি যা করবে ──
1. JWT সিক্রেট জেনারেট করে server/.env + client/.env.local বানাও; npm install দাও।
2. ব্র্যান্ড রিব্র্যান্ড করো (STARTER_GUIDE এর checklist অনুযায়ী)।
3. ডিজাইন: src/redux/api/* আর slices অপরিবর্তিত রেখে components/* আর app/* এর UI
   নতুন ডিজাইন ডিরেকশনে রিডিজাইন করো — API কন্ট্রাক্ট ভেঙো না।
4. দুই সার্ভার চালিয়ে (:5000 / :3000, :5001 এড়িয়ে) প্রতিটা অংশ টেস্ট করে দেখাও।
5. প্রথম অ্যাডমিন বানানোর উপায় দেখাও / seed স্ক্রিপ্ট দাও।

অস্পষ্ট কিছু থাকলে শুরুর আগে জিজ্ঞেস করবে; প্রতিটা ধাপ টেস্ট করে এগোবে।
```
