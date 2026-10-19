# 🚀 ডিপ্লয়মেন্ট ব্লুপ্রিন্ট — extrainweb02 সার্ভার (Portainer 2)

## 🤖 AI এজেন্টের জন্য নির্দেশ

**পুরো ফাইলটা আগে পড়ুন, তারপর কাজ শুরু করুন।**

এই ফাইলটা `extrainweb01` সার্ভারের ব্লুপ্রিন্টের সমান্তরাল। একই VPS-এ চালিত
**দ্বিতীয় Portainer instance** (Portainer 2) এর জন্য নির্দিষ্ট। এই সার্ভারের সব
তথ্য এখানে যাচাই করা অবস্থায় লেখা আছে — IP, প্রক্সি, নেটওয়ার্ক, ফায়ারওয়াল,
কোন পোর্ট দখলে, গিট কনভেনশন। এগুলো নিয়ে ব্যবহারকারীকে প্রশ্ন করবেন না।

⚠️ **এই ব্লুপ্রিন্ট Portainer 2 এর জন্য। Portainer 1 (extrainweb01) এর সাথে
কখনো গুলিয়ে ফেলবেন না।** পাথ, পোর্ট রেঞ্জ, নেটওয়ার্ক, কন্টেইনার নেমিং সব আলাদা।

যা করবেন:

1. §0-খ টেবিলের তথ্যগুলো ব্যবহারকারীর কাছ থেকে চেয়ে নিন — প্রজেক্টের নাম,
   **stack type (Node/Next/Laravel)**, রিপো ঠিকানা, ডোমেইন, ইত্যাদি।
   §0-ক-তে ⬜ চিহ্ন থাকলে সেটাও চাইবেন।
2. §2-ঘ টেবিল থেকে পরবর্তী খালি পোর্ট নিন (রেঞ্জ **7000–7999**)।
   **Portainer 2 → Containers → Published Ports** দেখে নিশ্চিত হন, probe করে নয়।
3. Stack অনুযায়ী টেমপ্লেট বেছে নিন:
   - **Node.js / Next.js** → §3খ
   - **Laravel (PHP)** → §3গ
4. §9-এর চেকলিস্ট ধরে এগোন (stack অনুযায়ী section পড়ুন)।
5. ডিপ্লয় শেষে **§2-ঘ-এর পোর্ট রেজিস্ট্রি আর §0-এর ফাঁকা ঘর আপডেট করে দিন।**

**সিক্রেট চাইবেন না।** পাসওয়ার্ড, টোকেন, কানেকশন স্ট্রিং ব্যবহারকারী নিজে
Portainer-এ বসাবেন। উদাহরণে কখনো এমন পাসওয়ার্ড লিখবেন না যা হুবহু কাজ করে —
`PUT_YOUR_OWN_PASSWORD_HERE` ধরনের স্পষ্ট প্লেসহোল্ডার দিন।

---

> **এই ফাইলটা সব Portainer 2 প্রজেক্টের জন্য একটাই।** নতুন প্রজেক্ট শুরু করলে
> এই ফাইলটা সেই প্রজেক্ট ফোল্ডারে কপি করুন।
>
> ⚠️ এই ফাইল **কখনো git-এ কমিট হয় না** (প্রতি প্রজেক্টের `.gitignore`-এ যোগ
> করুন)। কারণ এতে সব প্রজেক্টের পোর্ট ও সার্ভার তথ্য জমা হয়, যা কোনো একটা
> ক্লায়েন্ট রিপোতে থাকা উচিত নয়।

---

## 0. ⚠️ যে তথ্যগুলো আপনার কাছ থেকে লাগবে

নতুন প্রজেক্ট ডিপ্লয়ের আগে এই দুই টেবিল পূরণ করুন। AI এজেন্টকে কাজ দেওয়ার সময়
এই ফাইলটা পড়তে বললে সে এখান থেকেই মান নেবে, আর যেটা ফাঁকা সেটা চেয়ে নেবে।

### ক. সার্ভারের তথ্য — একবার পূরণ করলেই সব প্রজেক্টে চলবে

| # | তথ্য | মান | অবস্থা |
|---|---|---|---|
| A1 | সার্ভার IP | `164.68.126.31` | ✅ যাচাই করা (Portainer 1 এর সাথে একই VPS) |
| A2 | Portainer 2 URL | `https://164.68.126.31:9543` (বা `http://164.68.126.31:9500`) | ✅ যাচাই করা |
| A3 | Portainer 2 লগইন | ইউজার `extrainweb02`, পাসওয়ার্ড নিজের কাছে | ✅ AI-কে দেবেন না |
| A4 | রিভার্স প্রক্সি | **Traefik v3.6**, কন্টেইনার `coolify-proxy`, 80 ও 443 ধরে আছে (Coolify এর সাথে shared) | ✅ যাচাই করা |
| A5 | প্রক্সির ডকার নেটওয়ার্কের নাম | `coolify` — bridge, `10.0.1.0/24`, **Attachable: true** | ✅ যাচাই করা |
| A6 | SSL কে দেয়? | **Cloudflare proxied**, জোন মোড `Flexible` | ✅ যাচাই করা |
| A7 | DNS প্রোভাইডার ও জোন | *(প্রজেক্ট অনুযায়ী পূরণ করুন)* | ⬜ |
| A8 | আইসোলেটেড স্টোরেজ পাথ | `/var/www/p2-demos/<project>/` (symlink → `/opt/portainer2/data/projects/`) | ✅ যাচাই করা |
| A9 | Portainer 2 এর মোট স্টোরেজ | **20GB isolated** (loop device, filesystem-level hard limit) | ✅ যাচাই করা |
| A10 | Portainer 2 এর ডকার নেটওয়ার্ক | `portainer2-network` — bridge, `172.31.0.0/16` (Portainer এর নিজস্ব, প্রজেক্টে ব্যবহার হয় না) | ✅ যাচাই করা |
| A11 | RAM ও CPU | 8.3 GB RAM, 4 CPU cores (Coolify + Portainer 1 এর সাথে shared) | ✅ যাচাই করা |

### খ. প্রজেক্টের তথ্য — প্রতিটা নতুন প্রজেক্টে আলাদা

| # | তথ্য | কেন লাগে |
|---|---|---|
| B1 | প্রজেক্টের নাম (lowercase) | কন্টেইনার নাম, স্ট্যাক নাম, ভলিউম ফোল্ডার |
| **B1.5** | **Stack type: Node/Next / Laravel / অন্য** | কোন টেমপ্লেট ব্যবহার হবে (§3খ / §3গ) |
| B2 | GitHub রিপো URL | Portainer এখান থেকে ক্লোন করে |
| B3 | কোন GitHub অ্যাকাউন্ট দিয়ে পুশ হবে | নিচে §1 দেখুন, ডিফল্ট `saidebinsabid` |
| B4 | ব্রাঞ্চ | ডিফল্ট `main` |
| B5 | ওয়েবসাইটের ডোমেইন | `CLIENT_DOMAIN` |
| B6 | API-এর ডোমেইন (আলাদা ব্যাকএন্ড থাকলে, শুধু Node/Next) | `API_DOMAIN` |
| B7 | ডাটাবেস কানেকশন | Coolify-তে নতুন DB বানিয়ে **Internal URL** নেবেন, §4 দেখুন। Node/Next → MongoDB, Laravel → PostgreSQL/MySQL |
| B8 | অন্য সিক্রেট (JWT / APP_KEY ইত্যাদি) | অ্যাপের এনভ |

> **সিক্রেট কখনো রিপোতে যাবে না।** সবই Portainer → Stack → Environment
> variables-এ বসবে।

---

## 1. Git কনভেনশন

| আইটেম | মান |
|---|---|
| পুশ অ্যাকাউন্ট | **`saidebinsabid`** (`saidebinsabid6@gmail.com`) |
| ব্রাঞ্চ | **`main`**, সব আপডেট এখানেই যায় |
| প্রোটোকল | HTTPS + Personal Access Token (SSH কী নয়) |

মেশিনে একাধিক GitHub অ্যাকাউন্ট লগইন থাকলে পুশের আগে অবশ্যই:

```bash
gh auth switch --hostname github.com --user saidebinsabid
```

না করলে রিপো থাকা সত্ত্বেও পুশে **"Repository not found"** আসে।

প্রতি প্রজেক্টে লোকাল আইডেন্টিটি সেট করে নিন:

```bash
git config user.name "saidebinsabid"
git config user.email "saidebinsabid6@gmail.com"
```

---

## 2. সার্ভারে কী চলছে ও পোর্ট রেজিস্ট্রি

### ক. হোস্টের নিজস্ব সার্ভিস — এই পোর্টগুলো কখনো ব্যবহার করবেন না

*(2026-09-14-এ Portainer 2 → Containers থেকে যাচাই করা)*

| পোর্ট | কে ধরে আছে |
|---|---|
| `80`, `443`, `8080` | `coolify-proxy` — **Traefik v3.6**, সব ডোমেইন রাউটিং এর মধ্য দিয়ে যায় |
| `8000` | `coolify` ড্যাশবোর্ড |
| `6001`, `6002` | `coolify-realtime` |
| `9000`, `9443` | **Portainer 1** (`portainer`, extrainweb01) ⚠️ **ধোরবেন না** |
| `9500`, `9543` | **Portainer 2** (`portainer2`, extrainweb02) — আপনি এখানে |
| `27017`, `27018`, `27817` | ডাটাবেস প্রক্সি (mongo, nginx) — Coolify এর |
| `5001–5004` | **Portainer 1 এর প্রজেক্টস** (utsob-backend, utsob-client, market-backend, market-client) ⚠️ **ধোরবেন না** |
| `22` | SSH |

সার্ভারে মোট ২২টা কন্টেইনার চলছে (Coolify's + Portainer 1's projects + দুই
Portainer নিজে)। ওগুলোর অনেকটার published port নেই, Traefik দিয়ে রাউট হয়।

> ⚠️ **Coolify, Portainer 1 বা Portainer 1 এর deployed প্রজেক্টের কোনো কন্টেইনার,
> স্ট্যাক বা নেটওয়ার্ক ছোঁবেন না।** আমাদের Portainer 2 এর স্ট্যাক শুধু প্রক্সি
> নেটওয়ার্কে *যোগ দেবে*, কখনো সেটা বদলাবে না।

### খ. ডকার নেটওয়ার্ক — *(2026-09-14-এ Portainer 2 → Networks থেকে যাচাই করা)*

| নাম | সাবনেট | Attachable | কাজ |
|---|---|---|---|
| `coolify` | `10.0.1.0/24` | ✅ **true** | Traefik এখানে শোনে, আমাদের স্ট্যাক এখানেই যোগ দেবে |
| `portainer-network` | `172.30.0.0/16` | false | **Portainer 1 এর নিজস্ব** — ছোঁবেন না |
| `portainer2-network` | `172.31.0.0/16` | false | **Portainer 2 এর নিজস্ব** — ছোঁবেন না |
| `<name>_isolated_net` | ডকার নিজে থেকে বেছে নেয় | false | Portainer 1 এর deployed প্রজেক্টের — ছোঁবেন না |
| `bridge` | `10.0.0.0/24` | false | ডকার ডিফল্ট |
| `host`, `none` | — | — | ডকার সিস্টেম |

`coolify` **attachable** বলেই বাইরের স্ট্যাক `external: true` দিয়ে এতে যোগ দিতে
পারে। কম্পোজে `PROXY_NETWORK`-এর ডিফল্ট মান এটাই, তাই আলাদা করে সেট করার
দরকার নেই।

আমাদের `isolated_net` ডকার নিজে থেকে `172.x` রেঞ্জ থেকে সাবনেট নেবে, তাই
`10.0.1.0/24` বা Portainer এর নিজস্ব নেটওয়ার্কের সাথে সংঘর্ষ হবে না।

### গ. ফায়ারওয়াল ⚠️ — *(2026-09-14-এ যাচাই করা)*

বাইরে থেকে শুধু নির্দিষ্ট কিছু পোর্ট খোলা।

| পোর্ট | বাইরে থেকে | উত্তর |
|---|---|---|
| `80` | ✅ খোলা | Traefik `404` |
| `443` | ✅ খোলা | Traefik `503` |
| `8000` | ✅ খোলা | Coolify `302` |
| `9000`, `9443` | ✅ খোলা | Portainer 1 `200` |
| `9500`, `9543` | ✅ খোলা | Portainer 2 `200` |
| `5001–5004` | ✅ খোলা | Portainer 1 এর প্রজেক্টস |
| `7000–7999` | ❌ বন্ধ (probe করে timeout) | Portainer 2 এর জন্য reserved |

**এর মানে কী।** 7000–7999 রেঞ্জের পোর্টগুলো ডকারে publish হলেও ইন্টারনেট থেকে
সরাসরি ধরা যাবে না। তাই `http://<IP>:7001` ব্যাকআপ পথটা কাজ করবে না, সব ট্রাফিক
Traefik-এর 80/443 দিয়েই যেতে হবে।

সমস্যা নয়, কারণ ডোমেইন রাউটিংই আসল পথ। তবে ব্যাকআপ পথ দরকার হলে সার্ভারে
`sudo ufw allow <PORT>/tcp` দিয়ে খুলতে হবে।

> ⚠️ পোর্ট খালি কিনা **probe করে বোঝা যাবে না** এই সার্ভারে, কারণ খালি আর বন্ধ
> দুটোতেই timeout আসে। সবসময় **Portainer 2 → Containers → Published Ports**
> দেখে নিশ্চিত হন।

### ঘ. আমাদের প্রজেক্টের পোর্ট — নিরাপদ রেঞ্জ 7000–7999 (Portainer 2 ONLY)

⚠️ **5000-6000 রেঞ্জ Portainer 1 ব্যবহার করে। এখানে কখনো ব্যবহার করবেন না।**

| পোর্ট | প্রজেক্ট | অবস্থা |
|---|---|---|
| 7001 | *(প্রথম প্রজেক্ট)* | খালি |
| 7002 | *(পরবর্তী প্রজেক্ট)* | খালি |
| 7003+ | ... | খালি |

> 📌 **7000–7999 রেঞ্জ পুরোটাই fresh।** Portainer 2 নতুন, কোনো প্রজেক্ট
> এখনো deploy করা নেই। প্রথম প্রজেক্ট **7001** থেকে শুরু করবে।

> ⚠️ পোর্ট নেওয়ার আগে **সবসময়** Portainer 2 → Containers → **Published Ports**
> কলাম দেখে নিন। এই রেজিস্ট্রি পুরোনো হয়ে যেতে পারে। অথবা probe করুন:
>
> ```bash
> curl -s -o /dev/null --connect-timeout 5 -w "%{http_code}\n" http://<A1>:<PORT>/
> ```
>
> `000` আর exit code `7` (connection refused) মানে পোর্ট খালি।

### ঙ. ডাটাবেস রেজিস্ট্রি — কোন DB কোন প্রজেক্টের

Coolify-র `all_databases` প্রজেক্টে সব DB একসাথে থাকে (Portainer 1 আর
Portainer 2 এর সব DB সেখানেই)। Coolify নিজে থেকে `mongodb-database-<uuid>`
ধরনের নাম দেয়। **এখানে লিখে রাখলে** পরে খুঁজে পেতে সমস্যা হয় না।
UUID-টাই আসল পরিচয় — কানেকশন স্ট্রিংয়ের হোস্টনেম ওটাই।

| প্রজেক্ট | Coolify-তে নাম | UUID / হোস্টনেম | DB নাম | ইউজার |
|---|---|---|---|---|
| *(প্রথম প্রজেক্ট)* | *(পূরণ করুন)* | *(পূরণ করুন)* | *(পূরণ করুন)* | *(পূরণ করুন)* |

> 💡 **নাম বদলাতে গিয়ে "Public port is required" এরর এলে:** Public Port ঘরে
> ব্যবহার হয় না এমন একটা নম্বর (যেমন `27030`, প্রতি DB-তে আলাদা) বসিয়ে Name
> বদলে Save চাপুন। **"Make it publicly available" টিক বন্ধ থাকলে ওই নম্বরটা শুধু
> জমা থাকে, পোর্ট খোলে না।** Save-এর পর Portainer 2 → Containers-এ দেখে নিন ওই
> পোর্টে কোনো published port আসেনি।

---

## 3. আইসোলেশন নিয়ম

- **স্টোরেজ:** সব persistent ভলিউম শুধু `/var/www/p2-demos/<project_name>/`-এর
  ভিতরে (আসলে `/opt/portainer2/data/projects/<project_name>/` — 20GB isolated)।
  এর বাইরে কোনো পাথ নয়। ⚠️ `/var/www/my-secret-demos/` Portainer 1 এর, সেখানে
  কখনো লিখবেন না।
- **নেটওয়ার্ক:** প্রতি স্ট্যাকের নিজস্ব bridge নেটওয়ার্ক থাকবে
  (`<project>_isolated_net`), সেটাই প্রধান।
- **প্রক্সিতে যোগ দেওয়া:** ডোমেইন রাউটিং লাগলে স্ট্যাক Traefik-এর নেটওয়ার্কে
  **`external: true`** হিসেবে *যোগ দেবে*, কখনো সেটা তৈরি বা পরিবর্তন করবে না।
- **নামকরণ:** `container_name` হবে `p2_project_<project_name>`, একাধিক
  সার্ভিস থাকলে `p2_project_<project>_<service>`।
  ⚠️ `secret_project_` prefix Portainer 1 ব্যবহার করে, এখানে ব্যবহার করবেন না।
- **পোর্ট:** সবসময় `ports:` ম্যাপিং রাখুন। ডোমেইন রাউটিং ভাঙলে এটাই ব্যাকআপ পথ।
- **সাবনেট:** আমাদের `isolated_net` ডকার নিজে থেকেই আলাদা সাবনেট দেবে,
  কিন্তু Networks পেজে মিলিয়ে নিন Coolify-এর `10.0.1.x` বা Portainer এর
  `172.30.x` / `172.31.x` এর সাথে conflict নেই।

---

## 3খ. টেমপ্লেট — কপি করে শুরু করুন

`<project>` জায়গায় প্রজেক্টের নাম আর পোর্ট বদলালেই নতুন প্রজেক্টে কাজ করবে।

### ক. `docker-compose.yml` — রিপোর একদম উপরে

```yaml
services:
  backend:
    container_name: p2_project_<project>_backend
    build:
      context: ./<backend-folder>
      dockerfile: Dockerfile
    ports:
      - "<PORT_A>:5000"
    environment:
      NODE_ENV: production
      PORT: "5000"
      MONGO_URI: ${MONGO_URI:?MONGO_URI must be set as a Portainer stack environment variable}
      JWT_SECRET: ${JWT_SECRET:?JWT_SECRET must be set as a Portainer stack environment variable}
      CORS_ORIGINS: "https://${CLIENT_DOMAIN:?CLIENT_DOMAIN must be set},http://localhost:3000"
    volumes:
      - ${DATA_ROOT:-/var/www/p2-demos}/<project>/uploads:/app/uploads
    restart: always
    labels:
      traefik.enable: "true"
      traefik.docker.network: ${PROXY_NETWORK:-coolify}
      traefik.http.routers.<project>-api.rule: "Host(`${API_DOMAIN:?API_DOMAIN must be set}`)"
      traefik.http.routers.<project>-api.entrypoints: http
      traefik.http.routers.<project>-api.service: <project>-api
      traefik.http.services.<project>-api.loadbalancer.server.port: "5000"
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:5000/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks: [isolated_net, proxy_net]

  client:
    container_name: p2_project_<project>_client
    build:
      context: ./<client-folder>
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_SERVER_URL: "https://${API_DOMAIN}"
    ports:
      - "<PORT_B>:3000"
    environment:
      NODE_ENV: production
      PORT: "3000"
    restart: always
    depends_on: [backend]
    labels:
      traefik.enable: "true"
      traefik.docker.network: ${PROXY_NETWORK:-coolify}
      traefik.http.routers.<project>.rule: "Host(`${CLIENT_DOMAIN}`)"
      traefik.http.routers.<project>.entrypoints: http
      traefik.http.routers.<project>.service: <project>
      traefik.http.routers.<project>-www.rule: "Host(`www.${CLIENT_DOMAIN}`)"
      traefik.http.routers.<project>-www.entrypoints: http
      traefik.http.routers.<project>-www.service: <project>
      traefik.http.services.<project>.loadbalancer.server.port: "3000"
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:3000/ || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks: [isolated_net, proxy_net]

networks:
  isolated_net:
    driver: bridge
  proxy_net:
    external: true
    name: ${PROXY_NETWORK:-coolify}
```

**কেন এভাবে লেখা**

- `${VAR:?বার্তা}` মানে ভেরিয়েবল না দিলে ডিপ্লয় সাথে সাথেই থামবে, আধা-চালু
  কন্টেইনার তৈরি হবে না।
- `entrypoints: http` — Cloudflare `Flexible` মোডে ৮০ পোর্টে আসে, তাই TLS
  Traefik-এ লাগে না।
- এক কন্টেইনারে একাধিক রাউটার থাকলে প্রতিটাতে `.service` লিখতেই হবে,
  নাহলে Traefik কোন সার্ভিসে পাঠাবে বুঝতে পারে না।
- `ports:` রেখে দিন। ফায়ারওয়ালে বন্ধ থাকলেও সার্ভারের ভিতর থেকে পরীক্ষা করা যায়।
- **`DATA_ROOT` ডিফল্ট `/var/www/p2-demos`** — Portainer 1 এর `/var/www/my-secret-demos`
  থেকে আলাদা।

### খ. Node ব্যাকএন্ডের `Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache su-exec
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY . .
ENV PORT=5000
EXPOSE 5000
CMD ["sh", "-c", "mkdir -p /app/uploads && chown -R node:node /app/uploads && exec su-exec node node server.js"]
```

আপলোড ফোল্ডারটা হোস্টের bind mount, মালিক root। তাই root হিসেবে চালু হয়ে
মালিকানা ঠিক করে তারপর `node` ইউজারে নেমে যায়।

### গ. Next.js ক্লায়েন্টের `Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_SERVER_URL=http://localhost:5000
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
ENV NODE_OPTIONS=--max-old-space-size=2048
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

`next.config.ts`-এ `output: "standalone"` দিতে হবে, নাহলে `.next/standalone`
তৈরি হবে না আর ইমেজ চালু হবে না।

### ঘ. `.gitattributes` — রিপোর একদম উপরে

```
* text=auto eol=lf
*.png binary
*.jpg binary
*.jpeg binary
*.webp binary
*.ico binary
*.pdf binary
```

CRLF নিয়ে ইমেজে গেলে শেল স্ক্রিপ্ট বুট হওয়ার সময় `\r` এরর দিয়ে মরে যায়।

### ঙ. ক্লায়েন্টে API URL একটা জায়গায় রাখুন

হার্ডকোড করা `http://localhost:5000` ছড়িয়ে থাকলে প্রোডাকশনে সব ভাঙে। একটা
মডিউলে আনুন:

```ts
// src/lib/api.ts
export const SERVER =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000";
export const API = `${SERVER}/api`;
```

Next.js এই মান **বিল্ড টাইমে** bundle-এ বসায়, তাই কম্পোজের `build.args` দিয়ে
পাঠাতে হয়। শুধু রানটাইম এনভ দিলে কাজ হবে না, আর বদলালে রিবিল্ড লাগবে।

### চ. ব্যাকএন্ডে দুইটা জিনিস রাখুন

```js
// CORS এনভ থেকে, হার্ডকোড নয়
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',').map((o) => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} is not allowed`));
  },
  credentials: true
}));

// healthcheck যেন হিট করার মতো কিছু পায়
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// কন্টেইনারে 0.0.0.0-তে বাঁধতে হয়
app.listen(PORT, '0.0.0.0', () => console.log(`চালু: ${PORT}`));
```

---

## 3গ. Laravel প্রজেক্টের জন্য টেমপ্লেট (PHP 8.3)

⚠️ **উপরের §3খ (Node/Next) template Laravel এর জন্য নয়।** Laravel প্রজেক্ট
হলে এই §3গ পুরোটা follow করবেন।

Laravel প্রজেক্ট single-service pattern এ deploy হয়। শুধু একটা `app` service
(backend + built-in PHP server + static files সব একসাথে)।

### ক. Laravel এর জন্য `docker-compose.yml`

```yaml
services:
  app:
    container_name: p2_project_<project>
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "<PORT_A>:10000"
    environment:
      APP_ENV: production
      APP_DEBUG: "false"
      APP_URL: "https://${CLIENT_DOMAIN:?CLIENT_DOMAIN must be set}"
      APP_KEY: ${APP_KEY:?APP_KEY must be set (php artisan key:generate --show)}
      DB_CONNECTION: ${DB_CONNECTION:-pgsql}
      DB_HOST: ${DB_HOST:?DB_HOST must be set}
      DB_PORT: ${DB_PORT:-5432}
      DB_DATABASE: ${DB_DATABASE:?DB_DATABASE must be set}
      DB_USERNAME: ${DB_USERNAME:?DB_USERNAME must be set}
      DB_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD must be set}
      LOG_CHANNEL: stderr
      SESSION_DRIVER: file
      CACHE_STORE: file
    volumes:
      - ${DATA_ROOT:-/var/www/p2-demos}/<project>/storage:/var/www/html/storage
      - ${DATA_ROOT:-/var/www/p2-demos}/<project>/uploads:/var/www/html/public/uploads
    restart: always
    labels:
      traefik.enable: "true"
      traefik.docker.network: ${PROXY_NETWORK:-coolify}
      traefik.http.routers.<project>.rule: "Host(`${CLIENT_DOMAIN}`)"
      traefik.http.routers.<project>.entrypoints: http
      traefik.http.routers.<project>.service: <project>
      traefik.http.routers.<project>-www.rule: "Host(`www.${CLIENT_DOMAIN}`)"
      traefik.http.routers.<project>-www.entrypoints: http
      traefik.http.routers.<project>-www.service: <project>
      traefik.http.services.<project>.loadbalancer.server.port: "10000"
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://127.0.0.1:10000/up || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks: [isolated_net, proxy_net]

networks:
  isolated_net:
    driver: bridge
  proxy_net:
    external: true
    name: ${PROXY_NETWORK:-coolify}
```

**কেন এভাবে**

- Laravel internal port `10000` (Node এর `5000` থেকে আলাদা, host port কোনো
  conflict নেই)।
- `/up` হলো Laravel-এর built-in health endpoint (Laravel 11+)। পুরোনো ভার্সনে
  `/` বা কাস্টম route বসাতে হবে।
- `APP_URL` অবশ্যই `https://<domain>` হতে হবে (mixed-content trap, §6 দেখুন)।
- `APP_KEY` আগে থেকে `php artisan key:generate --show` দিয়ে বানিয়ে
  Portainer env এ বসাতে হবে।
- `storage/` bind mount হয় যাতে uploaded files, logs, session persist থাকে
  container restart এ।
- PostgreSQL/MySQL ব্যবহার করলে Coolify তে DB বানিয়ে Internal hostname `DB_HOST`
  এ দিন (§4 দেখুন — MongoDB এর pattern এই ভাবেই PostgreSQL/MySQL এও কাজ করে)।

### খ. Laravel এর `Dockerfile` (PHP 8.3 + PostgreSQL)

```dockerfile
# syntax=docker/dockerfile:1
FROM php:8.3-cli-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip curl ca-certificates \
        libpq-dev libzip-dev libpng-dev \
        libjpeg62-turbo-dev libfreetype6-dev libonig-dev libicu-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        pdo pdo_pgsql pgsql gd zip bcmath mbstring intl exif opcache \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Production OPcache — image immutable, timestamp check skip
RUN { \
      echo 'opcache.enable=1'; \
      echo 'opcache.memory_consumption=128'; \
      echo 'opcache.max_accelerated_files=10000'; \
      echo 'opcache.validate_timestamps=0'; \
      echo 'opcache.interned_strings_buffer=16'; \
    } > /usr/local/etc/php/conf.d/opcache.ini

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Dependencies আগে যাতে Docker layer cache কাজে লাগে
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist \
    --no-autoloader --no-scripts

# Application code
COPY . .

# Autoload optimize + permissions
RUN composer dump-autoload --optimize --no-scripts \
    && composer clear-cache \
    && chmod -R ug+rw storage bootstrap/cache

# MySQL চাইলে নিচেরটা যোগ করুন:
# RUN docker-php-ext-install pdo_mysql mysqli

ENV PORT=10000
EXPOSE 10000

CMD ["sh", "docker/start.sh"]
```

### গ. Laravel এর `docker/start.sh`

রিপোতে `docker/start.sh` নামে ফাইল বানান:

```bash
#!/bin/sh
set -e

cd /var/www/html

# Storage symlink (public/storage → storage/app/public)
php artisan storage:link || true

# Config, route, view cache — production optimization
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Migration — production এ auto-run risky, প্রয়োজন হলে uncomment
# php artisan migrate --force

# Built-in PHP server (small/medium project এ ঠিক আছে)
exec php -S 0.0.0.0:${PORT:-10000} -t public
```

⚠️ **CRLF trap:** `start.sh` **অবশ্যই LF line ending এ থাকতে হবে**। CRLF থাকলে
`\r` error দিয়ে container instant crash হবে। `.gitattributes` এ যোগ করুন:

```
docker/*.sh text eol=lf
```

### ঘ. Laravel এর `AppServiceProvider.php` — HTTPS force

`app/Providers/AppServiceProvider.php` এর `boot()` method এ যোগ করুন:

```php
use Illuminate\Support\Facades\URL;

public function boot(): void
{
    // APP_URL https:// দিয়ে শুরু হলেই force করি
    // APP_ENV=production দিয়ে না — তাহলে http://IP:PORT fallback ভেঙে যায়
    if (str_starts_with((string) config('app.url'), 'https://')) {
        URL::forceScheme('https');
    }
}
```

**কেন এভাবে?** `APP_ENV=production` দেখে force করলে backup port access ভাঙে
(raw `http://IP:PORT` unstyled দেখাবে)। `APP_URL` scheme দেখে করলে subdomain এ
https এবং raw port এ http দুইটাই কাজ করে।

### ঙ. Laravel এর `.dockerignore`

রিপোর root এ `.dockerignore` বানান:

```
.git
.gitignore
.env
.env.*
node_modules
vendor
storage/logs/*
storage/framework/cache/*
storage/framework/sessions/*
storage/framework/views/*
tests
phpunit.xml
.phpunit.result.cache
README.md
docker-compose.yml
Dockerfile
```

`vendor/` build time এ install হবে, commit করে ইমেজে যাবে না।

### চ. Laravel এর জন্য Portainer stack এ Environment variables

```
CLIENT_DOMAIN=<website domain>
APP_KEY=<php artisan key:generate --show দিয়ে বানানো, base64:... দিয়ে শুরু>
DB_CONNECTION=pgsql
DB_HOST=<Coolify PostgreSQL container UUID hostname>
DB_PORT=5432
DB_DATABASE=<db name>
DB_USERNAME=<db user>
DB_PASSWORD=<db password>
```

MySQL হলে `DB_CONNECTION=mysql` এবং `DB_PORT=3306`।

### ছ. Laravel প্রজেক্টে যা যা check করবেন deploy এর আগে

- `composer.json` এ `"php": "^8.3"` আছে
- `bootstrap/cache/` এবং `storage/` এ write permission থাকবে (Dockerfile এ handled)
- `.env.example` এ সব required variable listed
- Laravel version 11+ হলে `/up` endpoint auto আসে, পুরোনো হলে routes এ যোগ করুন:
  ```php
  Route::get('/up', fn() => response()->json(['status' => 'ok']));
  ```
- Frontend asset (Vite/Mix) build করা লাগবে? তাহলে Dockerfile এ Node stage যোগ
  করতে হবে — নিচের §3গ-জ দেখুন।

### জ. Laravel + Vite/Mix asset build লাগলে multi-stage Dockerfile

Blade template দিয়ে render হয় এবং Vite compile করা asset দরকার হলে:

```dockerfile
# Stage 1: Node দিয়ে asset build
FROM node:22-alpine AS assets
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Stage 2: PHP image (উপরের §3গ-খ এর পুরোটা এখানে)
FROM php:8.3-cli-bookworm
# ... (উপরের Dockerfile এর সব যেভাবে আছে) ...
WORKDIR /var/www/html
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --no-autoloader --no-scripts
COPY . .
# Vite compiled asset copy করুন
COPY --from=assets /app/public/build ./public/build
RUN composer dump-autoload --optimize --no-scripts \
    && chmod -R ug+rw storage bootstrap/cache
ENV PORT=10000
EXPOSE 10000
CMD ["sh", "docker/start.sh"]
```

---

## 4. ডাটাবেস — Coolify-তে প্রতি প্রজেক্টের আলাদা DB

সব ডাটাবেস Coolify-র একটা প্রজেক্টের ভিতরে থাকে (Portainer 1 আর Portainer 2
দুইটার জন্যই একই `all_databases` প্রজেক্ট)। প্রতি অ্যাপের জন্য আলাদা একটা DB।
অ্যাপের স্ট্যাক আর ডাটাবেস দুটোই `coolify` নেটওয়ার্কে থাকে, তাই **কন্টেইনারের নাম
দিয়েই সংযোগ হয়** — কোনো পোর্ট ইন্টারনেটে খুলতে হয় না।

### ক. Coolify-তে `all_databases` প্রজেক্ট আগে থেকেই আছে

Portainer 1 এর সময় বানানো — নতুন করে বানাতে হবে না। Coolify → Projects এ
`all_databases` দেখতে পাবেন।

### খ. প্রতি নতুন প্রজেক্টে — একটা নতুন Database

**Stack অনুযায়ী কোন DB বেছে নেবেন:**

| Stack | Recommended DB | Image |
|---|---|---|
| Node.js / Next.js / MERN | MongoDB | `mongo:7` |
| Laravel (default) | PostgreSQL | `postgres:16-alpine` |
| Laravel (alternative) | MySQL | `mysql:8` বা `mariadb:11` |
| যেকোনো relational data | PostgreSQL | `postgres:16-alpine` |

1. Coolify → **Projects** → `all_databases` → environment (সাধারণত `production`)
2. **+ New** / **Add Resource** → **Databases** → **MongoDB** / **PostgreSQL** / **MySQL**
3. ঘরগুলো পূরণ করুন:

| ঘর | মান |
|---|---|
| Name | `<project>-<db-type>`, যেমন `myproject-postgres` |
| Version / Image | উপরের টেবিল অনুযায়ী |
| Root username | `<project>_user`, যেমন `myproject_user` |
| Root password | শক্ত র‍্যান্ডম স্ট্রিং, কোথাও লিখে রাখুন |
| Database name | `<project>` (PostgreSQL/MySQL এ জরুরি, MongoDB এ optional) |

> ঘরের নাম Coolify-র সংস্করণভেদে একটু আলাদা হতে পারে। "Initial database" নামে
> ঘর থাকলে সেখানে প্রজেক্টের ডাটাবেস নাম দিন। MongoDB এর ক্ষেত্রে না থাকলেও
> সমস্যা নেই — প্রথম লেখার সময় নিজেই ডাটাবেস বানিয়ে নেয়। PostgreSQL/MySQL এ
> initial database name **অবশ্যই** দিতে হবে।

4. **Deploy** চাপুন।
5. ⚠️ **"Make it publicly available" সুইচ বন্ধ রাখুন।** আমাদের অ্যাপ একই ডকার
   নেটওয়ার্কে আছে, বাইরে খোলার দরকার নেই। খুললে Coolify একটা প্রক্সি কন্টেইনার
   বানিয়ে ইন্টারনেটে পোর্ট খুলে দেয়, যা অপ্রয়োজনীয় ঝুঁকি।

### গ. কানেকশন স্ট্রিং — কোনটা নেবেন

ডিপ্লয় শেষ হলে ডাটাবেসের পেজে দুইরকম URL দেখাবে।

| ধরন | ব্যবহার |
|---|---|
| **Internal** | ✅ এটাই `MONGO_URI` / `DB_HOST` এ বসবে |
| Public / External | ❌ শুধু নিজের মেশিন থেকে Compass দিয়ে দেখতে চাইলে |

Internal URL-এর হোস্টনেম হলো কন্টেইনারের UUID, দেখতে এমন:

```
mongodb://myproject_user:PASSWORD@a1b2c3d4e5f6g7h8:27017/?directConnection=true
```

বসানোর আগে দুইটা জিনিস হাতে ঠিক করুন:

1. `:27017/` এর ঠিক পরে, `?` এর আগে **ডাটাবেসের নাম** বসান
2. শেষে **`&authSource=admin`** যোগ করুন — Coolify root ইউজার বানায়, তাই
   পরিচয় যাচাই `admin` ডাটাবেসে হয়

চূড়ান্ত রূপ:

```
mongodb://myproject_user:PASSWORD@a1b2c3d4e5f6g7h8:27017/myproject-db?directConnection=true&authSource=admin
```

**PostgreSQL এর জন্য (Laravel):**

Coolify Internal URL হবে এমন:
```
postgres://myproject_user:PASSWORD@a1b2c3d4e5f6g7h8:5432/myproject
```

Laravel এ পুরো URL ব্যবহার হয় না — আলাদা field এ:
- `DB_HOST=a1b2c3d4e5f6g7h8` (শুধু UUID hostname)
- `DB_PORT=5432`
- `DB_DATABASE=myproject`
- `DB_USERNAME=myproject_user`
- `DB_PASSWORD=PASSWORD`
- `DB_CONNECTION=pgsql`

**MySQL এর জন্য:** একই pattern কিন্তু `DB_PORT=3306` এবং `DB_CONNECTION=mysql`।

### ঘ. যাচাই

Portainer 2 → **Containers** → ডাটাবেস কন্টেইনার → **Connected networks**-এ
`coolify` আছে কিনা দেখুন। না থাকলে অ্যাপ কন্টেইনার ওকে নাম দিয়ে খুঁজে পাবে না।

স্ট্যাক চালু হওয়ার পর অ্যাপের লগে DB Connected দেখা যাবে। Error থাকলে স্ট্রিং,
পাসওয়ার্ড বা নেটওয়ার্কে সমস্যা।

### ঙ. ব্যাকআপ ⚠️

ডাটাবেস এখন নিজের সার্ভারে, তাই ব্যাকআপের দায়িত্বও নিজের। Coolify-র ডাটাবেস
পেজে **Backups** ট্যাব আছে, সেখানে নিয়মিত ব্যাকআপ চালু করে রাখুন।
সার্ভার নষ্ট হলে ব্যাকআপ ছাড়া ডাটা ফেরানোর কোনো উপায় নেই।

> Coolify-র ডাটাবেসের ভলিউম Coolify নিজে সামলায়, তাই সেটা §3-এর আইসোলেটেড
> স্টোরেজ নিয়মের বাইরে। ওই নিয়ম আমাদের নিজের স্ট্যাকের ভলিউমের জন্য।

---

## 5. Portainer 2 Git-backed স্ট্যাক

*(Portainer CE 2.45-এ যাচাই করা। পুরোনো সংস্করণে রিপোর ঠিকানা আর টোকেন সরাসরি
স্ট্যাকের ফর্মে বসত, এখন আগে একটা **Source** বানাতে হয়।)*

⚠️ **নিশ্চিত হন আপনি Portainer 2 এ আছেন** (URL এ `:9543` বা `:9500` আছে,
উপরে ডান পাশে `extrainweb02` লেখা)। Portainer 1 (`:9443` / `extrainweb01`) এ
কাজ করবেন না।

### ক. প্রথমে GitOps Source বানান

Portainer 2 → App Delivery → **Sources** → **+ Add new** (বা স্ট্যাকের ফর্মে
**+ Create new source**)

| ঘর | মান |
|---|---|
| Source Name | রিপোর নাম, যেমন `<project>` |
| Repository URL | B2, শেষে `.git` ছাড়া |
| Skip TLS Verification | বন্ধ |
| Authentication | **ON** |
| Username | GitHub **অ্যাকাউন্ট নাম** (B3), ⚠️ URL নয় |
| Personal Access Token | scope `repo` |
| **Enable polling** | ⚠️ **ON** |
| **Fetch interval** | `5m` — **হাতে টাইপ করতে হবে** |

> ⚠️ **এই দুইটাই সবচেয়ে সহজে বাদ পড়ে।** `Enable polling` স্ট্যাকের ফর্মে নয়,
> Source-এর ভিতরে থাকে। বন্ধ থাকলে Portainer একবারই কোড টানবে, তারপর `git push`
> করলেও সাইট কখনো আপডেট হবে না, আর কোনো এররও দেখাবে না।
>
> `Fetch interval` ঘরে ধূসর `5m` লেখাটা শুধু উদাহরণ, ঘরটা আসলে খালি। হাতে না
> লিখলে "Invalid duration format" দেখায় আর **Continue** বাটন ধূসর থাকে।

**Continue** → **Access control**-এ `Administrators` (ডিফল্ট) → **Create**

সবুজ **Connection successful** এলে বুঝবেন টোকেন ঠিক আছে। এরপর Sources তালিকায়
`Healthy` দেখাবে।

### খ. তারপর স্ট্যাক বানান

Portainer 2 → **Stacks** → **+ Add stack**

| ঘর | মান |
|---|---|
| Name | প্রজেক্টের নাম, lowercase (B1) |
| Build method | **Repository** |
| Source | উপরে বানানো source |
| Repository reference | `refs/heads/main` |
| Compose path | `docker-compose.yml` |
| Create a Webhook | বন্ধ (polling ব্যবহার করছি) |

**Environment variables** অংশে **Advanced mode**-এ গিয়ে সব একসাথে পেস্ট করা যায়:

```
CLIENT_DOMAIN=<website hostname>
API_DOMAIN=<api hostname>
MONGO_URI=<Coolify internal url, §4গ দেখুন>
JWT_SECRET=<লম্বা র‍্যান্ডম স্ট্রিং>
```

সমান চিহ্নের দুই পাশে ফাঁকা জায়গা রাখবেন না। `PROXY_NETWORK` আর `DATA_ROOT`
ডিফল্টেই ঠিক আছে, আলাদা করে দিতে হবে না।

**Deploy the stack** চাপুন। প্রথম বিল্ডে ৫ থেকে ১০ মিনিট লাগে।

### গ. ডিপ্লয় হয়েছে কিনা বুঝবেন যেভাবে

Stacks তালিকায় স্ট্যাকটার Control কলামে **Total** লেখা থাকবে। Coolify-র
স্ট্যাকগুলোতে `Limited` লেখা থাকে, ওগুলো আমাদের নয়।

স্ট্যাকের পেজে **Managed by Git** অংশে রিপো, `Ref`, `Commit` আর `Polling: 5m`
দেখাবে। কন্টেইনার তালিকায় `p2_project_*` নামের কন্টেইনারগুলো `healthy`
হতে হবে।

কন্টেইনার তালিকায় কিছু না দেখলে ঘাবড়াবেন না, বিল্ড শেষ হওয়ার **পরে** কন্টেইনার
তৈরি হয়। অগ্রগতি দেখতে হলে স্ট্যাকের পেজে যান।

### ঘ. পরে আপডেট

`git push origin main` করলেই ৫ মিনিটের মধ্যে নিজে থেকে রিডিপ্লয় হয়। কে পুশ
করল তাতে কিছু যায় আসে না, টোকেনটা শুধু পড়ার জন্য।

সাথে সাথে চাইলে Stack → **Pull and redeploy** → **Update**।

> "changes will be overridden" ওয়ার্নিং নিরাপদ, কারণ Portainer-এর ভিতরে হাতে
> কিছু এডিট করা হয় না। Git-ই একমাত্র সোর্স অব ট্রুথ।

---

## 5খ. কন্টেইনারের ভিতরে এককালীন স্ক্রিপ্ট চালানো

seed, migration বা এককালীন কোনো কাজ চালাতে হলে অ্যাপের কন্টেইনারেই চালান।
স্ক্রিপ্ট ইমেজের ভিতরে থাকে (Dockerfile-এ `COPY . .`), আর এনভ ভেরিয়েবলও
কন্টেইনারে সেট করা, তাই আলাদা কিছু লাগে না।

Coolify (`http://<A1>:8000`) → সাইডবারে **Terminal** → সার্ভারের শেল, তারপর:

```bash
docker exec <container_name> node <script.js>
```

> Portainer-এর কন্টেইনার কনসোল কিছু সেটআপে টাইপ বা পেস্ট নেয় না। Coolify-র
> Terminal ব্যবহার করাই নিরাপদ।

**চালানোর আগে স্ক্রিপ্টটা পড়ে নিন।** `deleteMany({})` থাকলে সেটা আগের ডাটা
মুছে ফেলবে। খালি ডাটাবেসে সমস্যা নেই, কিন্তু কনটেন্ট বসানোর পর আবার চালালে
সব হারাবে।

⚠️ পাসওয়ার্ড রিসেট করার মতো স্ক্রিপ্ট (`resetAdmin.js` ধরনের) কখনো প্রোডাকশনে
চালাবেন না, ওগুলো দুর্বল ডিফল্ট পাসওয়ার্ড বসিয়ে দেয়।

---

## 6. ডোমেইন ও HTTPS

Traefik 80 আর 443 ধরে আছে, তাই সব হোস্টনেম রাউটিং ওর মধ্য দিয়েই যাবে
(Portainer 1 আর Portainer 2 দুইটার প্রজেক্টই এই একই Traefik ব্যবহার করে,
Coolify এর মালিকানায়)। স্ট্যাকে শুধু Traefik লেবেল বসালেই হবে, সার্ভারে আলাদা
কিছু করতে হবে না।

1. DNS-এ `A` রেকর্ড → সার্ভার IP (A1)।
2. Cloudflare ব্যবহার করলে **Proxied** রাখুন। HTTPS ওখান থেকেই আসে, সার্ভারে
   সার্টিফিকেট বসাতে হয় না।
3. জোনের SSL মোড `Full` আর অরিজিন প্লেইন HTTP হলে Cloudflare **503** দেয়।
   জোনের মোড না বদলে শুধু ওই হোস্টনেমের জন্য একটা **Configuration Rule** বানান:
   Field **`Hostname`** (⚠️ `URI Full` নয়), operator `equals`, setting
   SSL → **`Flexible`**।

### ⚠️ mixed-content ফাঁদ

পেজ https-এ লোড হয়, কিন্তু অ্যাপ যদি `http://` দিয়ে অ্যাসেট বা API কল বানায়,
ব্রাউজার **সব CSS, JS আর API রিকোয়েস্ট ব্লক করে**। সাইট `200` ফেরত দিলেও
ভাঙা দেখায়। তাই অ্যাপের বেস URL সবসময় `https://<domain>` হতে হবে।

Next.js-এ `NEXT_PUBLIC_*` **বিল্ড টাইমে** bundle-এ বসে, তাই এটা কম্পোজের
`build.args` দিয়ে পাঠাতে হয়। শুধু রানটাইম এনভ দিলে কাজ হবে না।

---

## 7. যাচাই

### ক. বেসলাইন, ডিপ্লয়ের **আগে** নিন আর পরে মিলিয়ে দেখুন

```bash
IP=164.68.126.31
curl -sk -o /dev/null -w "traefik-http   %{http_code}\n" http://$IP/
curl -sk -o /dev/null -w "traefik-https  %{http_code}\n" https://$IP/
curl -sk -o /dev/null -w "coolify        %{http_code}\n" http://$IP:8000/
curl -sk -o /dev/null -w "portainer1     %{http_code}\n" http://$IP:9000/
curl -sk -o /dev/null -w "portainer1-tls %{http_code}\n" https://$IP:9443/
curl -sk -o /dev/null -w "portainer2     %{http_code}\n" http://$IP:9500/
curl -sk -o /dev/null -w "portainer2-tls %{http_code}\n" https://$IP:9543/
```

**2026-09-14-এ রেকর্ড করা বেসলাইন — ডিপ্লয়ের পর এগুলো হুবহু একই থাকতে হবে:**

| চেক | প্রত্যাশিত |
|---|---|
| traefik-http | `404` |
| traefik-https | `503` |
| coolify | `302` |
| portainer1 | `200` |
| portainer1-tls | `200` |
| portainer2 | `200` |
| portainer2-tls | `200` |

সার্ভারে চলা প্রতিটা লাইভ সাইটও এই তালিকায় যোগ করুন (Portainer 1 এর utsob,
market, ইত্যাদি সহ)। কোনো মান বদলে গেলে থেমে গিয়ে রোলব্যাক করুন।

### খ. আইসোলেশন (Portainer 2 UI)

- **Containers → `p2_project_*` → Volumes**, প্রতিটা হোস্ট পাথ `/var/www/p2-demos/`
  বা `/opt/portainer2/data/projects/` দিয়ে শুরু হতে হবে।
- **Connected networks**, `<project>_isolated_net` থাকতে হবে (ডোমেইন রাউটিং
  থাকলে `coolify` নেটওয়ার্কও)।
- **Networks**, প্রজেক্টের সাবনেট Coolify-র `10.0.1.0/24` বা Portainer 1 এর
  `172.30.0.0/16` বা Portainer 2 নিজের `172.31.0.0/16` এর সাথে মিলবে না।

### গ. অ্যাপ স্মোক টেস্ট

```bash
for p in / /health /admin/login; do
  curl -s -o /dev/null -w "%{http_code} $p\n" https://<domain>$p
done
```

ব্রাউজারে DevTools → Network খুলে দেখুন সব কল `https://` দিয়ে যাচ্ছে কিনা।

### ঘ. 20GB Storage যাচাই

```bash
df -h /opt/portainer2/data
```

Used% 80% এর কাছে গেলে alarm — Coolify Terminal এ `/var/log/portainer-disk.log`
চেক করুন (auto-monitor আছে)।

---

## 8. পরিচিত ফাঁদ (Portainer 1 এর trap গুলোর সাথে সাথে এগুলোও)

| ফাঁদ | লক্ষণ | সমাধান |
|---|---|---|
| **Portainer 1 এ ভুল করে deploy** | URL এ `:9443`, container prefix `secret_project_` দেখা যাচ্ছে | Logout করে Portainer 2 (`:9543`) এ ঢুকুন |
| **`/var/www/my-secret-demos/` এ path লেখা** | Portainer 1 এর storage এ data চলে যায় (10GB, isolation নষ্ট) | সবসময় `/var/www/p2-demos/` বা `${DATA_ROOT:-/var/www/p2-demos}` |
| **Port 5000-6000 রেঞ্জ ব্যবহার** | Portainer 1 এর প্রজেক্টের সাথে conflict | 7000-7999 রেঞ্জ থেকে নিন |
| **Container prefix `secret_project_`** | Portainer 1 এর naming convention এর সাথে conflict/confusion | `p2_project_` prefix ব্যবহার করুন |
| বেস URL `http://` রয়ে গেছে | পেজ লোড হয় কিন্তু CSS, JS, API ব্লক | `https://<domain>` করুন, রিবিল্ড দিন |
| Cloudflare জোন SSL `Full`, অরিজিন HTTP | Cloudflare **503** | হোস্টনেম-ভিত্তিক রুল → SSL `Flexible` |
| Configuration Rule-এ field `URI Full` | রুল কখনো ম্যাচ করে না | field **`Hostname`** নিন |
| শেল স্ক্রিপ্টে CRLF | কন্টেইনার সাথে সাথে বন্ধ, `\r` এরর | `.gitattributes` → `* text=auto eol=lf` |
| Portainer Username ফিল্ডে রিপো URL | *"Invalid username or token"* | শুধু অ্যাকাউন্ট নাম দিন |
| একাধিক GitHub অ্যাকাউন্ট | পুশে *"Repository not found"* | `gh auth switch --user saidebinsabid` |
| অর্গ রিপোতে SSO | Portainer ক্লোন করতে পারে না | টোকেনে **Configure SSO → Authorize** |
| Windows-এ `npm install` করে lockfile কমিট | Linux বিল্ডে native deps হারায় | lockfile অপরিবর্তিত রাখুন, `npm ci` ব্যবহার করুন |
| বিল্ড আর্টিফ্যাক্ট কমিট করা থাকলেও ডকারে রিবিল্ড | ধীর বা OOM বিল্ড | `.dockerignore` দিন |
| প্রক্সি নেটওয়ার্কের নাম ভুল | স্ট্যাক ডিপ্লয়ই হয় না | `PROXY_NETWORK` ঠিক করুন (A5) |
| রেজিস্ট্রি পুরোনো | পোর্ট কনফ্লিক্ট | Portainer 2-এ Published Ports দেখে নিন |
| Source-এ `Enable polling` বন্ধ | push করলেও সাইট কখনো আপডেট হয় না, এররও নেই | Source এডিট করে ON, interval `5m` |
| `Fetch interval` ঘর খালি রেখে দেওয়া | "Invalid duration format", Continue ধূসর | ধূসর `5m` উদাহরণ মাত্র, হাতে টাইপ করুন |
| PowerShell-এ `curl` চালানো | কিছুই হয় না বা প্যারামিটার এরর | `Invoke-RestMethod` ব্যবহার করুন |
| কন্টেইনারে `curl` খোঁজা | `curl: not found` (Alpine-এ নেই) | `node -e "fetch(...)"` বা `wget` |
| কন্টেইনারের ভিতরে `docker` চালানো | `docker: not found` | Coolify Terminal-এ `localhost` বেছে নিন |
| মাইগ্রেশনে কালেকশনের নাম ধরে নেওয়া | ডাটা বসে কিন্তু অ্যাপ দেখে না | mongoose যা বানায় তাই, যেমন `Hero` → `heros` |
| উদাহরণের পাসওয়ার্ড হুবহু ব্যবহার | চ্যাটে লেখা পাসওয়ার্ড দিয়ে সাইট খোলা | নিজের ভাবা পাসওয়ার্ড, ইমেইলের সাথে না মেলে |
| ডাটাবেসের **Public** URL ব্যবহার করা | কাজ করে, কিন্তু ট্রাফিক অকারণে ইন্টারনেট ঘুরে আসে | **Internal** URL নিন (§4গ) |
| কানেকশন স্ট্রিংয়ে `authSource` নেই | `Authentication failed` | শেষে `&authSource=admin` যোগ করুন |
| স্ট্রিংয়ে ডাটাবেসের নাম বসাতে ভুলে যাওয়া | ডাটা `test` ডাটাবেসে চলে যায় | `:27017/` এর পরে নাম বসান |
| ডাটাবেস `coolify` নেটওয়ার্কে নেই | অ্যাপ হোস্টনেম resolve করতে পারে না | Portainer 2-এ Connected networks দেখুন |
| ডাটাবেসের ব্যাকআপ না নেওয়া | সার্ভার গেলে সব ডাটা শেষ | Coolify → Backups চালু রাখুন |
| **20GB storage full** | Deploy fail, container crash | Coolify Terminal এ `/var/log/portainer-disk.log` চেক, unused image prune (`docker image prune -a -f`) |
| **Laravel:** `APP_KEY` ছাড়াই deploy | 500 error, "No application encryption key has been specified" | `php artisan key:generate --show` দিয়ে বানিয়ে Portainer env এ বসান |
| **Laravel:** `APP_URL=http://IP:PORT` রেখে dep | Mixed-content, সব asset ব্লক | `APP_URL=https://<domain>` করুন |
| **Laravel:** `URL::forceScheme` `APP_ENV` দিয়ে key করা | port fallback ভাঙে | `APP_URL` scheme দেখে key করুন (§3গ-ঘ) |
| **Laravel:** `docker/start.sh` CRLF | container instant crash, cryptic `\r` error | `.gitattributes` এ `docker/*.sh text eol=lf` |
| **Laravel:** `vendor/` commit করে ইমেজে যায় | Slow build, Windows-Linux mismatch | `.dockerignore` এ `vendor` যোগ করুন |
| **Laravel:** `composer install` low-RAM এ OOM | 137 exit code build এ | Multi-stage build, বা `--no-scripts --no-autoloader` split |
| **Laravel:** health endpoint নেই | Portainer healthcheck fail | Laravel 11+ এ `/up` auto, নাহলে route যোগ করুন |
| **Laravel:** Vite build না হলে | CSS/JS 404 | Dockerfile এ Node stage যোগ করে `public/build` copy (§3গ-জ) |
| **Laravel:** PostgreSQL host name IP দিয়ে | Connection refused | Coolify internal UUID hostname দিন, IP না |
| **Laravel:** `SESSION_DRIVER=redis` কিন্তু Redis নেই | Session error | `file` driver ব্যবহার করুন যদি Redis না থাকে |
| **Laravel:** `storage/` bind mount ছাড়া | Container restart এ session/logs/uploads হারায় | Compose এ storage volume mount করুন |
| **Laravel:** `config:cache` এর পর `.env` change | Cache পুরনো config দেখায় | `php artisan config:clear && config:cache` চালান |

---

## 9. নতুন প্রজেক্টের চেকলিস্ট

### সাধারণ steps (সব stack এর জন্য):

1. এই ফাইল নতুন প্রজেক্ট ফোল্ডারে কপি করুন, `.gitignore`-এ যোগ করুন।
2. §0-এর ফাঁকা ঘরগুলো পূরণ করুন।
3. §2-ঘ থেকে পরবর্তী খালি পোর্ট (7000-7999 রেঞ্জ) নিন, **Portainer 2 এ Published
   Ports দেখে** নিশ্চিত হন।
4. **Coolify-তে এই প্রজেক্টের DB বানান, Internal URL নিন (§4)।**
   - Node/Next.js → MongoDB
   - Laravel → PostgreSQL (default) বা MySQL
5. `.gitattributes` দিন (`* text=auto eol=lf`)।
6. বেসলাইন রেকর্ড করুন (§7ক) — বিশেষ করে Portainer 1 এর সাইটগুলো যেন untouched থাকে।
7. `saidebinsabid` দিয়ে `main`-এ পুশ করুন।
8. **Portainer 2 এ (URL `:9543`, user `extrainweb02`) আগে Source বানান**
    (polling ON, interval `5m`), **তারপর** স্ট্যাক (§5)।
9. DNS আর SSL রুল বসান (§6)।
10. যাচাই করুন (§7), তারপর **§2-ঘ-এর রেজিস্ট্রি আপডেট করুন**।
11. Coolify-তে ডাটাবেসের **Backups** চালু করুন (§4ঙ)।
12. **20GB usage চেক করুন** — `df -h /opt/portainer2/data`।

### Node.js / Next.js প্রজেক্ট এর জন্য অতিরিক্ত:

13. §3খ (Node/Next template) থেকে `Dockerfile` ও `docker-compose.yml` বানান —
    container prefix `p2_project_` মনে রাখবেন।
14. ক্লায়েন্টে হার্ডকোড করা API URL সরিয়ে একটা মডিউলে আনুন (§3খ-ঙ)।
15. লোকালি `npm ci && npm run build` চালিয়ে দেখুন — ডকার ঠিক এই পথেই যাবে।

### Laravel প্রজেক্ট এর জন্য অতিরিক্ত:

13. §3গ (Laravel template) থেকে `Dockerfile`, `docker-compose.yml`,
    `docker/start.sh` বানান — container prefix `p2_project_` মনে রাখবেন।
14. `.dockerignore` দিন (`vendor/`, `node_modules/` সহ, §3গ-ঙ)।
15. `AppServiceProvider::boot()` এ `URL::forceScheme('https')` conditionally যোগ
    করুন (§3গ-ঘ)।
16. `APP_KEY` বানান: `php artisan key:generate --show` (এটা Portainer env এ বসবে,
    কমিট হবে না)।
17. `composer.json` এ PHP version check করুন (`^8.3`)।
18. Vite/Mix asset build লাগলে multi-stage Dockerfile ব্যবহার করুন (§3গ-জ)।
19. লোকালি `composer install && php artisan config:cache` চালিয়ে দেখুন — build
    ঠিকমতো হয়।
20. Laravel 11+ এর নিচে হলে `/up` route যোগ করুন।
