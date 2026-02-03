# Resume Inventory (auto-generated)

This report is meant to help you write a resume by listing what your codebase shows.

Tip: send this file to ChatGPT and ask it to turn it into resume bullets.

## Skills (quick view)

**Languages:** Python, TypeScript
**Frontend:** Framer Motion, Next.js, React, Tailwind CSS
**Backend:** Clerk Auth, Supabase (Postgres)
**DevOps/Cloud:** Vercel Deployments
**APIs/Integrations:** REST APIs, Supabase Auth, Telegram Bot API, WebSockets
**Crypto/Trading Domain:** Signal logic (RSI, MACD, EMA, VWAP, ATR), Solana ecosystem (DEX, explorers, aggregators)
**Practices:** Async programming (asyncio), Environment-based config (.env)

---

## hub-frontend

**Path:** `C:\Projects\saas_hub\hub-frontend`

**Files scanned:** 83
**Top file types:** .tsx=45, .html=12, .ts=11, .json=6, .md=5, .js=2, .css=1, .txt=1

**Env/config files found (review for safety):**
- `.env.example`
- `.env.local`

**Dependencies (signals):**
- npm_dependencies: @supabase/ssr, @supabase/supabase-js, @vercel/analytics, clsx, framer-motion, lightweight-charts, lucide-react, next, qrcode.react, react, react-dom, recharts, sonner, tailwind-merge
- npm_devDependencies: @types/node, @types/react, autoprefixer, eslint, eslint-config-next, postcss, tailwindcss, typescript

**Scripts (from package.json):**
- dev: `next dev`
- build: `next build`
- start: `next start`

**Key signals found (count = number of files that matched):**
- Environment Vars: 31
- Next.js: 28
- React: 25
- TypeScript: 20
- Async: 15
- Solana: 15
- Framer Motion: 7
- Telegram API: 6
- Supabase: 4
- Tailwind CSS: 4
- Vercel: 3
- WebSockets: 3
- HTTP Requests: 2
- Clerk: 1
- Python: 1
- Technical Indicators: 1

**Evidence samples (example files that triggered signals):**
- Next.js: `middleware.ts`, `next-env.d.ts`, `package-lock.json`, `package.json`, `tsconfig.json`, `app\layout.tsx`, `app\manifest.ts`, `app\page.tsx`
- React: `package-lock.json`, `package.json`, `app\error.tsx`, `app\layout.tsx`, `app\billing\page.tsx`, `app\dashboard\page.tsx`, `app\login\page.tsx`, `app\pricing\layout.tsx`
- TypeScript: `AUDIT_REPORT.md`, `package-lock.json`, `package.json`, `PROJECT_AUDIT.md`, `tsconfig.json`, `app\layout.tsx`, `app\loading.tsx`, `app\api\market\route.ts`
- Tailwind CSS: `package-lock.json`, `package.json`, `app\globals.css`, `components\ui.tsx`
- Framer Motion: `package-lock.json`, `package.json`, `app\billing\page.tsx`, `app\dashboard\page.tsx`, `app\pricing\page.tsx`, `app\privacy\page.tsx`, `components\HomePage.tsx`
- Vercel: `package-lock.json`, `package.json`, `app\layout.tsx`
- Supabase: `package-lock.json`, `package.json`, `app\auth\callback\route.ts`, `components\SupabaseProvider.tsx`
- Clerk: `PROJECT_AUDIT.md`
- Python: `public\Part2-python-scanner-bots.html`
- Telegram API: `PROJECT_AUDIT.md`, `app\layout.tsx`, `app\contact\page.tsx`, `components\BottomTickerBar.tsx`, `components\StructuredData.tsx`, `components\SubmitTxForm.tsx`
- WebSockets: `PROJECT_AUDIT.md`, `app\dashboard\page.tsx`, `components\BtcMiniChart.tsx`
- HTTP Requests: `package-lock.json`, `app\privacy\page.tsx`
- Async: `package-lock.json`, `app\api\market\route.ts`, `app\auth\callback\route.ts`, `app\billing\page.tsx`, `app\dashboard\page.tsx`, `app\login\page.tsx`, `app\pay\[slug]\page.tsx`, `app\waitlist\page.tsx`
- Environment Vars: `CHANGELOG.md`, `PROJECT_AUDIT.md`, `app\layout.tsx`, `app\manifest.ts`, `app\page.tsx`, `app\robots.ts`, `app\sitemap.ts`, `app\auth\callback\route.ts`
- Technical Indicators: `app\pricing\page.tsx`
- Solana: `app\manifest.ts`, `app\page.tsx`, `app\Part1-source-node.html`, `app\api\market\route.ts`, `app\pay\[slug]\page.tsx`, `app\pricing\head.tsx`, `app\pricing\layout.tsx`, `app\pricing\page.tsx`

**API / endpoint hints (from code text):**
- http://localhost:3000
- http://localhost:8000
- https://api.alternative.me/fng/?limit=1&format=json
- https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=
- https://api.coingecko.com/api/v3/simple/price?ids=bitcoin
- https://axiom.xyz
- https://dashboard.clerk.com/apps/app_38CceyZfhr8fPczSJvmYzgnoEuT/instances/ins_38Ccez1ZVCTf06fqtoteroHjTsw/api-keys
- https://dashboard.clerk.com/apps/claim?token=7nzufm6nbyerni549smeli46fqm116zb3fy1hep0
- https://eslint.org/version-support
- https://feross.org/support
- https://fonts.googleapis.com
- https://fonts.googleapis.com/css2?family=Sora:wght
- https://fonts.gstatic.com
- https://github.com/chalk/ansi-regex?sponsor=1
- https://github.com/chalk/ansi-styles?sponsor=1
- https://github.com/chalk/chalk?sponsor=1
- https://github.com/privatenumber/get-tsconfig?sponsor=1
- https://github.com/privatenumber/resolve-pkg-maps?sponsor=1
- https://github.com/sponsors/ai
- https://github.com/sponsors/epoberezkin
- https://github.com/sponsors/feross
- https://github.com/sponsors/inspect-js
- https://github.com/sponsors/isaacs
- https://github.com/sponsors/jonschlinkert
- https://github.com/sponsors/ljharb
- (and 35 more)

**Notes / warnings:**
- Possible secret-like pattern detected in app\pay\[slug]\page.tsx. Review and ensure secrets are in env vars, not committed.


---

## Next step

Send `inventory.md` back into ChatGPT and we will convert it into:

- a clean project list
- strong resume bullets
- a targeted resume for your job title
