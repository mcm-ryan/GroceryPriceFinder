
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

## Current Status (As of Phase 2.5 Completion)

✅ Phase 1: Backend & Frontend Foundation — COMPLETE
✅ Phase 2: Store Discovery (Geoapify) — COMPLETE
✅ Phase 2.5: Product Database & Autocomplete — COMPLETE
⏳ Phase 3: Price Scraping (Walmart, Target) — NEXT

The app currently functions end-to-end using **mock price data**, **real store discovery** (Geoapify), and **structured product data** from PostgreSQL.

---

## High-Level Architecture

### Frontend
- React + TypeScript
- Vite
- Downshift for autocomplete
- Geoapify API for geocoding (same key as backend)
- Two location input modes:
  - **Precise location**: Browser `navigator.geolocation` with reverse geocoding to display city/state/zip
  - **Zip code entry**: Manual input with forward geocoding to coordinates
- Simple UI:
  - Location mode selector (radio buttons)
  - Location display or zip code input
  - **Product autocomplete** (searches database as user types)
  - **Selected products list** (with quantity controls)
  - Compare button
  - Results cards sorted by cheapest

### Backend
- Node.js + TypeScript
- Express-style API
- PostgreSQL + Drizzle ORM
- Primary endpoints:
  - `POST /compare` - Compare prices across stores
  - `GET /products/search` - Search product database
- Responsibilities:
  - Product database management
  - Store discovery (Geoapify)
  - Price lookup (currently mock)
  - Aggregation & ranking
  - Caching (productId-based)
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

## Product Database (Phase 2.5)

### Database Setup

The application uses **PostgreSQL** with **Drizzle ORM** for structured product data.

**Database Configuration:**
- Host/Port/Name/User/Password configured via `.env` (see `backend/.env`)
- Connection pooling with `pg` (node-postgres)
- Database name: `grocery_price_finder`
- User: `grocery_user`

### Schema

**Products Table** (`backend/src/db/schema.ts`):
```typescript
{
  id: serial (PRIMARY KEY)
  name: varchar(255)           // Display name: "Whole Milk"
  normalizedName: varchar(255) // Search key: "whole milk"
  category: varchar(100)       // "Dairy", "Produce", etc.
  brand: varchar(100)          // Optional
  size: varchar(50)            // "1 gallon", "12 oz", etc.
  unit: varchar(20)            // "gallon", "oz", "lb"
  searchTerms: text            // Comma-separated for matching
  isCommon: boolean            // Common items shown first
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Indexes:**
- `idx_products_normalized_name` on `normalizedName`
- `idx_products_category` on `category`
- `idx_products_common` on `isCommon`

### Seeded Data

The database is seeded with **50 products** across 6 categories:
- Dairy (10 items, 5 common)
- Produce (12 items, 3 common)
- Bakery (6 items, 2 common)
- Meat (8 items, 2 common)
- Pantry (10 items, 2 common)
- Beverages (4 items, 1 common)

**Seed Script:** `backend/src/db/seed.ts`

### Product Service

**Location:** `backend/src/services/productService.ts`

Key methods:
- `searchProducts(query, limit)` - Search by name or search terms
- `getProductById(id)` - Fetch single product
- `getProductsByIds(ids)` - Batch fetch (returns Map)

**Search Behavior:**
- Empty query → returns common products only
- Query provided → searches `normalizedName` and `searchTerms`
- Results sorted by `isCommon DESC, normalizedName ASC`

### API Endpoints

**GET /products/search**
```
Query params:
  - q: search query (optional, empty = common products)
  - limit: max results (1-100, default 10)

Response:
{
  "products": [
    {
      "id": 1,
      "name": "Whole Milk",
      "category": "Dairy",
      "size": "1 gallon",
      "unit": "gallon",
      "displayName": "Whole Milk (1 gallon)"
    }
  ]
}
```

### Frontend Integration

**Components:**
- `ProductAutocomplete` - Downshift-powered search with debouncing
- `SelectedProductsList` - Shows selected items with quantity controls

**User Flow:**
1. User types in autocomplete (e.g., "milk")
2. Frontend calls `/products/search?q=milk`
3. User selects product from dropdown
4. Product added to list with quantity=1
5. User can adjust quantity or remove items
6. On compare, frontend sends `productId` and `quantity` to backend

### Cache Updates

**Important:** Price caching now uses `productId` instead of item name.

**Before (Phase 1-2):**
```typescript
cacheService.getPrice(storeName, itemName)
```

**After (Phase 2.5):**
```typescript
cacheService.getPrice(storeName, productId)
```

This provides stable cache keys since product IDs never change, unlike names which can vary.

### Database Maintenance

**Migrations:** Handled by Drizzle Kit
- Config: `backend/drizzle.config.ts`
- Migrations: `backend/drizzle/`
- Run migrations: `npx drizzle-kit push` (or generate with `drizzle-kit generate`)

**Adding Products:**
- Update `backend/src/db/seed.ts` and re-run seed script
- Or use ProductService methods to insert programmatically

Claude should **not** suggest adding:
- ❌ Price history tables (not needed for MVP)
- ❌ Store-specific product mappings (Phase 3 concern)
- ❌ User-generated product lists (no auth in MVP)
- ❌ Product images (nice-to-have, not essential)

---

## Price Scraping (Phase 3 Guidelines)

Target stores:
- Walmart
- Target

Rules Claude must follow:
- ✅ Cache aggressively (now uses productId-based keys)
- ✅ Prefer Cheerio over headless browsers
- ❌ No Puppeteer unless scraping fails completely
- ❌ No large crawl loops

Scrapers must:
- Fetch a search page using `product.normalizedName`
- Extract the *first reasonable match*
- Document selectors with "last verified" notes

---

## API Contract

### POST /compare

**Request:**
```json
{
  "latitude": number,
  "longitude": number,
  "items": [
    { "productId": 1, "quantity": 1 },
    { "productId": 4, "quantity": 2 }
  ]
}
```

**Response:**
```json
{
  "stores": [
    {
      "id": "walmart-1",
      "name": "Walmart Supercenter",
      "address": "123 Main St",
      "distance": 1500,
      "items": [
        {
          "itemName": "Whole Milk",
          "price": 4.99,
          "currency": "USD",
          "isMockData": true
        }
      ],
      "total": 12.99,
      "usedMockData": true,
      "mockDataReason": "Scraper not yet implemented"
    }
  ],
  "timestamp": "2025-12-06T18:00:00.000Z"
}
```

**Key Points:**
- Stores sorted by total price (cheapest first)
- Backend fetches product details from database using productIds
- Per-item prices with mock data flags
- `usedMockData` and `mockDataReason` for transparency

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

_Last updated: 2025‑12‑06 (Phase 2.5: Product Database Integration)_
