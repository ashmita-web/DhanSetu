# DhanSetu 🏦

**AI Concierge Platform for The Economic Times Ecosystem**

DhanSetu transforms a cold, anonymous ET visitor into a fully profiled, goal-mapped, product-served financial user — in a single 3-minute conversation. It runs a 7-agent autonomous pipeline, requires zero API keys, and works completely offline.

---

## What It Does

1. **Chat Onboarding** — DhanSetu asks 7 natural questions and builds a complete financial profile (name, age, occupation, city, income, goals, risk appetite)
2. **Intelligence Layer** — Classifies the user into one of 7 financial personas (e.g. "Growth Seeker", "Legacy Builder") with behavioural tags
3. **Personalised Recommendations** — Surfaces top 10 items from an ET ecosystem catalogue (SIPs, insurance, articles, products, events) — scored and ranked by goal + risk + lifestage fit
4. **Financial Goal Roadmap** — Creates structured FinancialGoal objects with milestones, target amounts, and product suggestions for each goal
5. **Cross-Sell Engine** — Identifies high-relevance product opportunities beyond primary recommendations (tax planning, term insurance, home loans)
6. **Marketplace Matching** — Scores 8 live ET services and surfaces the top 6 matches
7. **Feedback Learning** — Computes engagement score, retention risk, and next-best-actions from behavioural signals

All of this happens **automatically, in the background**, while the user reads their first response.

---

## Pages

| Page | Description |
|---|---|
| **AI Concierge Chat** | Main conversation interface with real-time agent status panel |
| **Personalised Dashboard** | Recommendations, insights, and intelligence summary |
| **Financial Journey Map** | Goal roadmap with milestone tracker |
| **Discover ET** | Content recommendations matched to interests |
| **Services Marketplace** | ET services ranked by profile match score |
| **Profile Memory** | Full agent decision log — complete auditability |

---

## Tech Stack

**Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS + Framer Motion
- Zustand (state management with localStorage persistence)
- Socket.io client (real-time agent updates)
- Axios (HTTP with JWT auth interceptor)

**Backend**
- Node.js + Express + TypeScript
- ts-node-dev (hot reload)
- Socket.io (WebSocket server)
- JWT authentication (jsonwebtoken + bcryptjs)
- In-memory Map store (zero-config, Supabase-ready interface)

**Agents** — Pure rule-based TypeScript. Zero external AI API calls.

---

## Project Structure

```
DhanSetu/
├── backend/
│   ├── src/
│   │   ├── agents/
│   │   │   ├── profilingAgent.ts       # 7-step conversational profiler
│   │   │   ├── intelligenceBuilder.ts  # Persona + behavioural classification
│   │   │   ├── recommendationAgent.ts  # Catalogue scoring + ranking
│   │   │   ├── financialNavigator.ts   # Goal templates + milestones
│   │   │   ├── crossSellEngine.ts      # Rule-based cross-sell triggers
│   │   │   ├── marketplaceAgent.ts     # ET services scoring
│   │   │   └── feedbackAgent.ts        # Engagement + retention analysis
│   │   ├── workflow/
│   │   │   └── engine.ts               # Orchestrator + concierge chat
│   │   ├── routes/
│   │   │   ├── auth.ts                 # Login (auto-creates users)
│   │   │   ├── chat.ts                 # Message + session endpoints
│   │   │   ├── dashboard.ts            # Recommendations + goals
│   │   │   ├── recommendations.ts
│   │   │   ├── marketplace.ts
│   │   │   └── behavioral.ts           # Signal tracking
│   │   ├── database/
│   │   │   └── store.ts                # In-memory Map store
│   │   ├── middleware/
│   │   │   ├── auth.ts                 # JWT middleware
│   │   │   └── errorHandler.ts
│   │   ├── types/
│   │   │   └── index.ts                # All shared TypeScript types
│   │   └── server.ts                   # Express + Socket.io entry point
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Concierge.tsx           # Main chat page
│   │   │   ├── Dashboard.tsx
│   │   │   ├── FinancialJourney.tsx
│   │   │   ├── DiscoverET.tsx
│   │   │   ├── Marketplace.tsx
│   │   │   └── ProfileMemory.tsx
│   │   ├── components/
│   │   │   ├── chat/                   # ChatInterface, MessageBubble, AgentStatus
│   │   │   ├── layout/                 # Sidebar, Header, Layout
│   │   │   └── shared/                 # Card, LoadingSpinner
│   │   ├── store/
│   │   │   └── useAppStore.ts          # Zustand store
│   │   ├── services/
│   │   │   └── api.ts                  # Axios API layer
│   │   └── App.tsx
│   └── package.json
│
├── ARCHITECTURE.md                     # System design + agent diagrams
├── IMPACT_MODEL.md                     # Business impact with calculations
├── README.md                           # This file
└── .gitignore
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Clone and install

```bash
git clone <repo-url>
cd DhanSetu

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=3001
JWT_SECRET=your_secret_key_here_make_it_long
NODE_ENV=development
```

> No API keys needed. All 7 agents run on pure rule-based logic.

### 3. Start the backend

```bash
cd backend
npm run dev
# Server starts on http://localhost:3001
```

Health check: `curl http://localhost:3001/health`

### 4. Start the frontend

```bash
cd frontend
npm run dev
# App opens at http://localhost:5173
```

### 5. Use the app

1. Open `http://localhost:5173`
2. Enter any email + password to register/login (auto-creates account)
3. Start chatting with DhanSetu — it will ask you 7 questions
4. After profiling, your full dashboard populates automatically
5. Explore Dashboard, Journey Map, Marketplace, and Profile Memory pages

---

## API Endpoints

### Auth
```
POST /api/auth/login        { email, password, name? }
GET  /api/auth/me           → current user (JWT required)
```

### Chat
```
GET  /api/chat/session       → current session info (JWT required)
POST /api/chat/message       { sessionId, message } → { response, stage, agentName }
GET  /api/chat/history/:id   → message history
```

### Dashboard
```
GET /api/dashboard           → { recommendations, goals, profile, agentLogs }
GET /api/dashboard/briefing  → weekly briefing
```

### Recommendations
```
GET  /api/recommendations            → all recommendations
POST /api/recommendations/:id/interact  { interactionType }
```

### Marketplace
```
GET /api/marketplace/services   → scored ET services
```

### Behavioural
```
POST /api/behavioral/signal     { signalType, category, value }
GET  /api/behavioral/signals    → user's signal history
```

---

## Real-time Events (Socket.io)

The frontend subscribes to `user:{userId}` room and receives `workflow_update` events:

```json
{
  "stage": "recommendation",
  "agentName": "Recommendation Engine",
  "status": "running" | "complete",
  "data": { "count": 10 }
}
```

**Stages emitted:** `profiling` → `intelligence_building` → `recommendation` → `financial_navigation` → `cross_sell` → `marketplace` → `feedback_learning` → `completed`

---

## The 7-Agent Pipeline

```
User Message
     │
     ▼
[1] Profiling Concierge      — Extracts: name, age, job, city, income, goals, risk
     │ (profileComplete=true)
     ▼ (async, non-blocking)
[2] Intelligence Builder     — Derives: persona, segment, behavioural tags, insights
     │
     ▼
[3] Recommendation Engine    — Scores 16-item catalogue → top 10 recommendations
     │
     ▼
[4] Financial Navigator      — Maps goals → structured roadmaps with milestones
     │
     ▼
[5] Cross-Sell Engine        — Rule-based triggers → 3 high-relevance cross-sells
     │
     ▼
[6] Marketplace Agent        — Scores 8 ET services → top 6 matches
     │
     ▼
[7] Feedback Learning Agent  — Computes engagement score, retention risk, next actions
     │
     ▼
Dashboard populated + completion message sent to user
```

---

## Design

- **ET Brand colours:** Orange `#FF6B35`, Dark Navy `#0A0E27`
- **Font:** System sans-serif stack for fast load
- **Animations:** Framer Motion — message transitions, agent status pulses, page transitions
- **Mobile-responsive:** Tailwind breakpoints throughout

---

## Production Upgrade Path

To move from prototype to production:

| Component | Upgrade |
|---|---|
| In-memory store | Replace `store.ts` with Supabase client (interface already matches) |
| Authentication | Add Google OAuth / OTP login |
| Agent logic | Swap rule-based extractors with LLM calls (Groq free tier, Gemini, or Anthropic) |
| Recommendations | Connect to live ET content API for real-time articles |
| Deployment | Dockerise → deploy backend on Railway/Render, frontend on Vercel |
| Monitoring | Add Sentry for error tracking, PostHog for product analytics |

---

## Documents

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Full system diagram, agent communication patterns, error handling layers
- [`IMPACT_MODEL.md`](./IMPACT_MODEL.md) — Quantified business impact: cost savings, revenue uplift, ROI

---

## Author

Built for **The Economic Times Hackathon 2026**
Project: **DhanSetu** — *Setu* means "bridge" in Hindi. DhanSetu bridges every Indian to their financial goals.
