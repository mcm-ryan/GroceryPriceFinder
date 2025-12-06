
# CLAUDE.md — Grocery Price Finder

This file provides **authoritative context and ground rules** for Claude (and other coding agents) when working in this repository.  
It prioritizes clarity, correctness, and cost-conscious engineering decisions.

---

## Project Overview

**Project Name:** Grocery Price Finder  
**Goal:** Build a **resume-quality MVP web application** that allows a user to:
1. Enter a grocery list
2. Share their location (opt-in)
3. Discover nearby grocery stores
4. Estimate total grocery cost per store
5. Compare stores to find the cheapest option

This is **not a production-scale system**. It is intentionally scoped to demonstrate good architecture, tradeoffs, and real-world problem solving.

---

## Non‑Goals (Do NOT Add)

These constraints are intentional. Claude should not suggest adding these unless explicitly asked.

- ❌ Mobile app (web only)
- ❌ Authentication or user accounts
- ❌ Background jobs or queues
- ❌ Microservices
- ❌ Real-time pricing
- ❌ Large-scale scraping or crawling
- ❌ More than ~5–10 stores per query

Keep the system **simple, readable, and explainable**.

---

## Current Status (As of Phase 2 Completion)

✅ Phase 1: Backend & Frontend Foundation — COMPLETE  
✅ Phase 2: Store Discovery (Geoapify) — COMPLETE  
⏳ Phase 3: Price Scraping (Walmart, Target) — NEXT

The app currently functions end-to-end using **mock price data** and **real store discovery** (Geoapify).

---

## High-Level Architecture

### Frontend
- React + TypeScript
- Vite
- Geoapify API for geocoding (same key as backend)
- Two location input modes:
  - **Precise location**: Browser `navigator.geolocation` with reverse geocoding to display city/state/zip
  - **Zip code entry**: Manual input with forward geocoding to coordinates
- Simple UI:
  - Location mode selector (radio buttons)
  - Location display or zip code input
  - Grocery list textarea
  - Compare button
  - Results cards sorted by cheapest

### Backend
- Node.js + TypeScript
- Express-style API
- Single primary endpoint: `POST /compare`
- Responsibilities:
  - Store discovery
  - Price lookup
  - Aggregation & ranking
  - Caching
  - Graceful fallbacks

### Shared Types
- Located in `packages/types`
- Backend and frontend **must** use shared types
- Mock data indicators are intentionally included

---

## Backend Design Rules

Claude **must follow these patterns** when extending the backend:

### 1. Strategy Pattern for Prices
- All price sources implement `PriceProvider`
- New stores ⇒ new provider (no conditionals)
- Providers must fail gracefully

### 2. Mock Fallback Is Mandatory
- The app must **never completely fail**
- If a provider errors:
  - Log clearly
  - Fall back to mock data
  - Mark results as mock in the response

### 3. Caching First
- In-memory cache (`node-cache`) for MVP
- Redis-ready interface, but **do not add Redis yet**
- Default TTLs:
  - Stores: 24 hours
  - Prices: 4 hours

### 4. No Silent Behavior
- Every fallback should:
  - Log a reason
  - Surface `usedMockData` flags in responses

---

## Store Discovery

### Current Implementation
- **Primary:** Geoapify Places API
- **Backup (unused):** OpenStreetMap Overpass API

### Why Geoapify
- Faster (<2s)
- Free tier (3,000 req/day)
- Better reliability than public Overpass servers

Claude should **not** suggest switching providers unless reliability/cost becomes a focus.

---

## Location Input

### Two Input Modes

The frontend supports two ways for users to provide their location:

#### 1. Precise Location (Default)
- User clicks "Use My Location" button
- Browser requests geolocation permission (opt-in)
- Frontend receives coordinates from `navigator.geolocation`
- **Reverse geocoding** via Geoapify converts coordinates → readable address
- Displays: "City, ST ZIP" (e.g., "Chicago, IL 60601")
- Backend receives raw coordinates for store discovery

**Fallback:** If reverse geocoding fails, displays raw coordinates

#### 2. Zip Code Entry
- User selects "Enter Zip Code" mode
- Enters 5-digit US zip code
- **Forward geocoding** via Geoapify converts zip code → coordinates
- Backend receives coordinates for store discovery

**Validation:** Basic format check for US zip codes (5 digits or 5+4 format)

### Implementation Details
- **Geocoding service:** `frontend/src/api/geocoding.ts`
- **API key:** Shared with backend (must be set in `frontend/.env`)
- **Error handling:** Clear messages for geocoding failures, missing API key, or invalid zip codes
- **UX:** No raw coordinates shown to user unless necessary

### Why Two Modes?
- **Precise location:** Best accuracy for finding truly nearby stores
- **Zip code:** Privacy-conscious alternative, no browser permission required

---

## Price Scraping (Phase 3 Guidelines)

Target stores:
- Walmart
- Target

Rules Claude must follow:
- ✅ Cache aggressively
- ✅ Prefer Cheerio over headless browsers
- ❌ No Puppeteer unless scraping fails completely
- ❌ No large crawl loops

Scrapers must:
- Fetch a search page
- Extract the *first reasonable match*
- Document selectors with “last verified” notes

---

## API Contract

### POST /compare
```json
{
  "latitude": number,
  "longitude": number,
  "items": [
    { "name": "milk", "quantity": 1 },
    { "name": "eggs", "quantity": 2 }
  ]
}
```

Response:
- Stores sorted by total price (cheapest first)
- Per-item prices
- Mock data flags clearly visible

Claude **must not break this contract**.

---

## Code Quality Expectations

Claude-generated code must:
- Be TypeScript‑strict
- Avoid clever abstractions
- Use explicit naming
- Favor readability over brevity
- Include comments where tradeoffs exist

This code may be reviewed by humans — optimize for clarity.

---

## Allowed Improvements

Claude *may* suggest:
- Minor performance improvements
- Clearer naming
- Safer error handling
- Additional documentation
- Better logging
- Refactoring for readability

Claude should **ask before**:
- Adding dependencies
- Changing architecture
- Expanding scope

---

## Development Commands (Reference)

```bash
npm run dev:backend    # Backend on :3001
npm run dev:frontend   # Frontend on :5173
```

Health check:
```bash
curl http://localhost:3001/health
```

---

## Guiding Principle

> This project exists to demonstrate **good engineering judgment**, not maximum completeness.

If there is a choice between:
- Simple & correct ✅
- Complex & impressive ❌

Always choose **simple & correct**.

---

_Last updated: 2025‑11‑30_
