# Grocery Price Finder

A web application that helps users compare grocery prices across nearby stores. Enter a grocery list, share your location, and find the cheapest option.

## Project Structure

```
GroceryPriceFinder/
├── backend/              # Node.js + Express API
├── frontend/             # React + TypeScript + Vite
├── packages/
│   └── types/           # Shared TypeScript types
├── PROJECT_CONTEXT.md   # Project requirements and architecture
└── package.json         # Root workspace configuration
```

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Key Dependencies**: axios, cors, dotenv

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript

### Shared
- **Types**: Centralized TypeScript definitions in `packages/types`

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (v9 or higher)
- Google Places API key (for store discovery)

## Setup Instructions

### 1. Clone the repository
```bash
git clone <repository-url>
cd GroceryPriceFinder
```

### 2. Install dependencies

Install all workspace dependencies:
```bash
npm run install:all
```

Or install individually:
```bash
npm install                                              # Root
npm install --workspace=@grocery-price-finder/types     # Types
npm install --workspace=backend                          # Backend
npm install --workspace=frontend                         # Frontend
```

### 3. Configure environment variables

Create a `.env` file in the `backend/` directory:
```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your Google Places API key:
```
PORT=3001
GOOGLE_PLACES_API_KEY=your_actual_api_key_here
```

## Development

### Run backend server
```bash
npm run dev:backend
```
Backend will run on `http://localhost:3001`

### Run frontend dev server
```bash
npm run dev:frontend
```
Frontend will run on `http://localhost:5173` (default Vite port)

### Run both concurrently
Open two terminal windows and run each command in separate terminals.

## Build

### Build all packages
```bash
npm run build:all
```

### Build individually
```bash
npm run build:types     # Build shared types
npm run build:backend   # Build backend
npm run build:frontend  # Build frontend
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status.

### Compare Prices
```
POST /compare
Content-Type: application/json

{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "items": [
    { "name": "milk", "quantity": 1 },
    { "name": "eggs", "quantity": 2 }
  ]
}
```
Returns price comparison across nearby stores.

## MVP Scope

This is a **resume-quality MVP** with the following constraints:
- Web only (no mobile app)
- No real-time price updates
- No authentication (initial version)
- Max ~5 stores per query
- Simple, readable codebase

See `PROJECT_CONTEXT.md` for full requirements and architecture details.

## License

MIT
