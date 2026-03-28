# DhanSetu — Architecture Document

> AI Concierge Platform for The Economic Times Ecosystem
> Version 1.0 | March 2026

---

## 1. System Overview

DhanSetu is a **multi-agent autonomous workflow platform** that transforms a cold, anonymous ET visitor into a deeply profiled, fully served financial user — in a single 3-minute conversation. It orchestrates 7 specialised agents in sequence, each with a distinct responsibility, feeding enriched data forward to the next.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER INTERACTION LAYER                              │
│                                                                              │
│   Browser (React 18 + TypeScript + Vite)                                    │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│   │  AI Concierge│ │  Dashboard   │ │ Journey Map  │ │  Marketplace │      │
│   │    Chat      │ │  (Insights)  │ │ (Goal Steps) │ │  (Services)  │      │
│   └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘      │
│          │                │                │                │               │
│   ┌──────┴───────┐ ┌──────┴───────┐ ┌──────┴───────┐                       │
│   │ Profile      │ │  Discover ET │ │  Profile     │                        │
│   │ Memory       │ │  (Content)   │ │  Viewer      │                        │
│   └──────────────┘ └──────────────┘ └──────────────┘                        │
│                           │  Zustand Store + localStorage                    │
└───────────────────────────┼─────────────────────────────────────────────────┘
                            │  REST + WebSocket (Socket.io)
                            │
┌───────────────────────────▼─────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                                    │
│                                                                              │
│   Express.js + TypeScript (Port 3001)                                        │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│   │  /api/auth   │ │  /api/chat   │ │/api/recommend│ │/api/dashboard│      │
│   │  JWT Auth    │ │  Session Mgmt│ │  ations      │ │  Goals, Data │      │
│   └──────────────┘ └──────┬───────┘ └──────────────┘ └──────────────┘      │
│   ┌──────────────┐         │                                                 │
│   │/api/marketplace        │         JWT Middleware on all routes            │
│   │/api/behavioral│         │                                                 │
│   └──────────────┘         │                                                 │
└───────────────────────────┬┴────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────────────┐
│                      WORKFLOW ENGINE (engine.ts)                             │
│                                                                              │
│  processUserMessage()                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Stage Check → Route to correct agent → Collect result → Save → Emit│    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  runPostProfilingWorkflow()  [async, non-blocking, triggered after profiling]│
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Stage 2  │→ │ Stage 3  │→ │ Stage 4  │→ │ Stage 5  │→ │ Stage 6  │     │
│  │Intel.    │  │Recommend │  │Financial │  │Cross-Sell│  │Marketplace    │  │
│  │Builder   │  │Agent     │  │Navigator │  │Engine    │  │Agent     │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                          ↓                  │
│                                                    ┌──────────┐             │
│                                                    │ Stage 7  │             │
│                                                    │Feedback  │             │
│                                                    │Learning  │             │
│                                                    └──────────┘             │
└───────────────────────────┬─────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────────────┐
│                        DATA LAYER (store.ts)                                 │
│                                                                              │
│  In-Memory Maps (Supabase-ready interface)                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ users    │ │ profiles │ │ sessions │ │ recommend│ │  goals   │         │
│  │ Map<>    │ │ Map<>    │ │ Map<>    │ │ ations   │ │ Map<>    │         │
│  └──────────┘ └──────────┘ └──────────┘ │ Map<>    │ └──────────┘         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ └──────────┘                       │
│  │ signals  │ │workflow  │ │ agent    │                                     │
│  │ Array[]  │ │ States   │ │ Logs[]   │  ← Full audit trail                 │
│  └──────────┘ └──────────┘ └──────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The 7-Agent Pipeline

Each agent is a stateless TypeScript function that reads from the workflow state, applies its logic, writes to the data store, and emits a real-time Socket.io event.

### Agent 1 — Profiling Concierge
**File:** `agents/profilingAgent.ts`
**Role:** Drive a 7-step conversational onboarding to build a complete user profile.

```
User Message
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  State Machine  (7 sequential questions)             │
│                                                      │
│  Step 0: name  → extractName(text)                  │
│  Step 1: age   → extractAge(text)                   │
│  Step 2: occupation → extractOccupation(text)       │
│  Step 3: city  → extractCity(text)                  │
│  Step 4: income → extractIncome(text)               │
│  Step 5: goals → extractGoals(text)  [multi-match]  │
│  Step 6: risk  → extractRisk(text)                  │
│                                                      │
│  After Step 6 → build UserProfile → profileComplete │
└─────────────────────────────────────────────────────┘
    │
    ▼
profileComplete = true → triggers runPostProfilingWorkflow()
```

**Extraction logic:** Keyword regex + number parsing (no LLM needed). Handles natural language like "I earn around 60k", "I'm in Bangalore", "I want to grow my wealth and retire early".

---

### Agent 2 — Intelligence Builder
**File:** `agents/intelligenceBuilder.ts`
**Role:** Classify the user into a persona and generate a behavioural intelligence report.

```
UserProfile  →  IntelligenceReport
                ┌─────────────────────────────┐
                │ persona        (7 types)     │
                │ segment                      │
                │ behavioralTags  (12+ tags)   │
                │ contentAffinities            │
                │ productAffinities            │
                │ riskProfile                  │
                │ wealthPotential  (4 levels)  │
                │ engagementStrategy           │
                │ insights[]  (2–5 bullets)    │
                └─────────────────────────────┘
```

**7 Personas:** Young Learner → Early Career Starter → Young Professional → Life Milestone Builder → Wealth Accumulator → Prime Wealth Builder → Pre-Retirement Planner

---

### Agent 3 — Recommendation Engine
**File:** `agents/recommendationAgent.ts`
**Role:** Score and rank a curated catalogue of 16 ET ecosystem items and surface the top 10.

```
Catalogue (16 items)          Scoring Function
┌──────────────────┐          ┌───────────────────────────────┐
│ 5 × Mutual Funds │          │ base_score (60–95)            │
│ 3 × Insurance    │    →     │ + 20 if goal matches          │
│ 4 × Articles     │          │ + 15 if risk matches          │
│ 2 × ET Products  │          │ + 10 if lifestage matches     │
│ 1 × NPS Service  │          │ - 20 if risk mismatch         │
│ 1 × Events       │          └───────────────────────────────┘
└──────────────────┘
          │
          ▼
   Sorted + deduplicated by category → Top 10 → saved to DB
```

---

### Agent 4 — Financial Navigator
**File:** `agents/financialNavigator.ts`
**Role:** Convert raw goals into structured FinancialGoal objects with milestones, target amounts, and product suggestions.

```
"wealth_creation" goal  →  FinancialGoal {
  title:    "Wealth Creation via SIP — ₹1 Crore Goal"
  category: "wealth"
  target:   ₹1,00,00,000
  years:    10
  milestones: [
    "Start first SIP of ₹500–₹2,000/month",
    "Increase SIP by 10% each year (step-up)",
    "Diversify across large-cap, mid-cap, flexi-cap",
    ...6 steps total
  ]
  suggestedProducts: ["ET Money", "Mirae Asset", ...]
}
```

8 goal templates: emergency_fund, wealth_creation, retirement, home_purchase, education, travel, vehicle_purchase, wedding.

---

### Agent 5 — Cross-Sell Engine
**File:** `agents/crossSellEngine.ts`
**Role:** Apply business rules to identify cross-sell opportunities beyond the primary recommendation set.

```
Profile Triggers → Cross-Sell Rules
┌──────────────────────────────────────────────────────────┐
│  income > ₹50K/mo      → Tax Planning Advisory          │
│  goals ∋ home_purchase → Home Loan Comparison Tool      │
│  age < 30              → Term Life Insurance alert       │
│  goals ∋ retirement    → NPS Tier-2 suggestion          │
│  goals ∋ wealth        → ET Prime Markets               │
│  fund_recs present     → ET Money Smart Deposit (FD)    │
│  goals ∋ education     → Education Loan Pre-Approval    │
└──────────────────────────────────────────────────────────┘
Top 3 by relevance score → appended to recommendations
```

---

### Agent 6 — Marketplace Agent
**File:** `agents/marketplaceAgent.ts`
**Role:** Score 8 live ET services against the user profile and return top 6 matches.

**Services scored:** ET Money SIP, Insurance Marketplace, Home Loan Comparison, Demat/Trading, NPS Account, Smart Deposit (FD), Credit Card Marketplace, Stock Screener.

Scoring: `base(50) + goal_bonus(30–40) + risk_bonus(15–25) + income_bonus(10–20) + age_bonus(15–20)` → capped at 100.

---

### Agent 7 — Feedback Learning Agent
**File:** `agents/feedbackAgent.ts`
**Role:** Analyse behavioural signals to compute engagement score, retention risk, and next-best-actions.

```
BehavioralSignals[]  →  FeedbackInsights {
  engagementScore     (0–100)
  preferredCategories (top 5)
  nextBestActions     (4 items)
  contentSuggestions  (4 articles)
  retentionRisk       (low / medium / high)
  upsellReadiness     (boolean)
}
```

---

## 3. Agent Communication Pattern

```
Frontend                  Backend Engine              Agents
   │                           │                        │
   │── POST /api/chat/message ─►│                        │
   │                           │── runProfilingAgent() ─►│
   │                           │◄─ { response, done? } ──│
   │◄── HTTP response ─────────│                        │
   │                           │                        │
   │         [profileComplete = true]                   │
   │                           │── setTimeout(500ms) ──►│
   │                           │                        │
   │◄── WS: stage=intel,       │── runIntelligenceBuilder()
   │         status=running    │◄─ IntelligenceReport ──│
   │◄── WS: status=complete ───│                        │
   │◄── WS: stage=recommend,   │── runRecommendationAgent()
   │         status=running    │◄─ Recommendation[] ────│
   │◄── WS: status=complete ───│                        │
   │    ... (repeat for        │── runFinancialNavigator()
   │        stages 4,5,6,7)    │── runCrossSellEngine()
   │                           │── runMarketplaceAgent()
   │                           │── runFeedbackLearningAgent()
   │◄── WS: stage=completed,   │
   │    full data payload ─────│
   │                           │
   │── GET /api/dashboard ─────►│ (reads from DB)
   │◄── full dashboard JSON ───│
```

**Socket.io events emitted:** `workflow_update` with `{ stage, agentName, status, data? }` — frontend listens and updates the AgentStatus panel in real-time.

---

## 4. Error Handling Logic

```
┌──────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING LAYERS                          │
│                                                                   │
│  Layer 1 — Workflow Engine (engine.ts)                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  try { ... } catch(error) {                                │  │
│  │    state.retryCount++                                      │  │
│  │    if (retryCount < MAX_RETRY=3) → update state           │  │
│  │    return friendly fallback message                        │  │
│  │  }                                                         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Layer 2 — Individual Agents                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  All agents are synchronous rule-based functions.          │  │
│  │  They cannot fail on network/API errors (no HTTP calls).   │  │
│  │  Invalid inputs are handled by extractors returning        │  │
│  │  safe defaults (e.g. age=25, risk='moderate').             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Layer 3 — Agent Decision Log (Full Audit Trail)                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Every agent call → db.logAgentDecision({                  │  │
│  │    agentName, stage, input, output,                        │  │
│  │    latencyMs, success, error?                              │  │
│  │  })                                                        │  │
│  │  Viewable on /profile-memory page                         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Layer 4 — JWT Auth Middleware                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  All /api/* routes protected by authMiddleware             │  │
│  │  Invalid/expired token → 401 Unauthorized                  │  │
│  │  Frontend Axios interceptor → redirect to login            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Layer 5 — Profiling Fallbacks                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  If user gives unrecognised input at any step:             │  │
│  │    - Name extractor: takes first 2 words as name           │  │
│  │    - Age extractor: defaults to 25                         │  │
│  │    - Occupation: defaults to 'salaried'                    │  │
│  │    - Goals: defaults to ['wealth_creation']                │  │
│  │    - Risk: defaults to 'moderate'                          │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| State Management | Zustand with localStorage persistence |
| Real-time | Socket.io (WebSocket) |
| Backend | Node.js, Express, TypeScript, ts-node-dev |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Database | In-memory Map store (Supabase-ready interface) |
| Agent Logic | Pure rule-based TypeScript (zero external AI API calls) |
| HTTP Client | Axios with auth interceptor |

---

## 6. Data Flow Summary

```
Login/Register
    → JWT issued → stored in localStorage
    → sessionId created → stored in Zustand

User types message
    → POST /api/chat/message { sessionId, message }
    → ProfilingAgent processes, updates extractedData
    → On completion → 6 agents run autonomously (non-blocking)
    → Each agent → writes to DB → emits Socket.io event
    → Frontend updates in real-time

Dashboard load
    → GET /api/dashboard → reads recommendations + goals + profile
    → Displayed on 6 pages with ET branding
```

---

*DhanSetu Architecture v1.0 — Built for The Economic Times Hackathon 2026*
