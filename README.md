# 🚀 AlphaAlerts — Pro Hub

**AlphaAlerts Pro** is a high-performance SaaS hub for crypto traders, delivering real-time signals, smart alerts, and bot control with a clean, modern UI.

This repo contains the **Next.js App Router frontend** for the AlphaAlerts ecosystem.  
It integrates with a FastAPI backend, crypto payments (Solana USDC), and Telegram-based signal delivery.

---

## ✨ Features

### 🧠 Trading Intelligence
- Real-time crypto signal dashboard
- BTC / ETH / SOL live ticker
- Visual market trends & performance stats
- Low-latency alert delivery focus

### 🔐 Authentication & Access
- JWT-based auth (stored client-side)
- `/me` endpoint for user entitlements
- Manual admin approval flow (for early access)
- Designed for future auto on-chain verification

### 💸 Crypto Payments (No Stripe)
- USDC on Solana
- Users submit transaction hash
- Backend verifies & activates access
- Admin approval endpoint for safety during beta

### 🖥️ UI / UX
- Next.js App Router (modern architecture)
- Responsive, dark-mode-first design
- Animated stat counters & slide-in cards
- Bottom live ticker bar
- Custom favicon + branding

---

## 🧱 Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Lucide Icons**
- **IntersectionObserver animations**

### Backend (separate repo)
- **FastAPI**
- **JWT auth**
- **PostgreSQL**
- **Solana RPC**
- **Telegram Bot API**

---

## 📁 Project Structure

```txt
hub-frontend/
├─ app/
│  ├─ layout.tsx        # Root layout, navbar, footer, favicon
│  ├─ page.tsx          # Landing / marketing page
│  ├─ login/
│  ├─ pricing/
│  ├─ dashboard/
│  └─ favicon.ico
│
├─ components/
│  ├─ HeroChart.tsx
│  ├─ BottomTickerBar.tsx
│  └─ ...
│
├─ lib/
│  └─ api.ts            # API helpers
│
├─ public/
│
├─ styles/
│
└─ README.md
```

---

## ⚙️ Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_BRAND=AlphaAlerts
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_TELEGRAM_URL=https://t.me/alphaalerts
NEXT_PUBLIC_X_URL=https://x.com/alphaalerts
```

---

## 🧪 Running Locally

```bash
npm install
npm run dev
```

App will run at:

```
http://localhost:3000
```

---

## 🔐 Authentication Flow (Simplified)

1. User registers / logs in
2. JWT saved in localStorage
3. Frontend calls `/me`
4. Backend returns:
   - `is_active`
   - `plan`
5. UI unlocks dashboard features

---

## 💰 Payment Flow (USDC on Solana)

1. User selects a plan
2. Sends USDC to provided wallet
3. Submits transaction hash
4. Backend stores payment as pending
5. Admin approves via `/admin/crypto/approve`
6. User access is activated

⚠️ **Auto on-chain verification planned for next phase**

---

## 🗺️ Roadmap

- ✅ Marketing landing page
- ✅ Live ticker bar
- ✅ Crypto payment submission
- ✅ Admin approval flow
- 🔄 Auto Solana tx verification
- 🔄 Telegram private channel access
- 🔄 Bot control panel
- 🔄 Usage-based plans
- 🔄 Webhook management UI

---

## 🧠 Philosophy

AlphaAlerts is built with:

- **Speed over noise**
- **Signal quality > quantity**
- **Real trader workflows**
- **Minimal fluff**

---

## 📄 License

Private / Proprietary

© Huston Solutions
