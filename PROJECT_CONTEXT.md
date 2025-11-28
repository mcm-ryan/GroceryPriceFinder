# Grocery Price Comparison App — Project Context

## Project Goal
Build a **resume-quality MVP web application** that allows a user to:
1. Enter a grocery list
2. Share their location (opt-in)
3. Discover nearby grocery stores
4. Estimate the total price of the grocery list per store
5. Compare totals across stores to find the cheapest option

This project prioritizes **clarity, correctness, and real-world tradeoffs**, not full production scale.

---

## Non-Goals (Important)
- No mobile app (web only)
- No real-time price updates
- No background job queues
- No microservices
- No authentication (initial MVP)
- No more than ~5 stores per query

Keep the solution **simple and readable**.

---

## High-Level Architecture

### Frontend
- React + TypeScript
- Built with Vite (preferred) or Next.js
- Uses browser `navigator.geolocation` API (user opt-in)
- Minimal UI:
  - Grocery list input
  - “Compare Prices” button
  - Results table or list

### Backend
- Node.js + TypeScript
- Express or Fastify
- Single API endpoint for comparison
- Orchestrates:
  - Google Places API
  - Store price lookup (scraping or API)
  - Aggregation of totals

### Data Sources
- Google Places API:
  - Nearby grocery stores
  - Store website URLs
- Store websites:
  - Scraped when no public API is available
  - Respect robots.txt and rate limit requests

---

## Backend Responsibilities

The backend API should:
1. Receive grocery list + location
2. Query Google Places for nearby grocery stores
3. Normalize store data (name, address, website URL)
4. Attempt to retrieve prices:
   - Prefer API if available
   - Fall back to scraping
5. Cache prices to avoid repeated scraping
6. Return totals per store

---

## API Design (Initial MVP)

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

