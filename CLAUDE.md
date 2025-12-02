# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fake Google is a realistic Google search interface demo built for martech pipeline demonstrations. It simulates Google search results with AI-powered ad generation and includes an admin interface for campaign management.

**Tech Stack:**
- Next.js 15 with App Router and TypeScript
- PostgreSQL for ad storage
- Google Custom Search API integration (optional, with fallback)
- Google Gemini API for AI ad generation (optional, with template fallback)
- shadcn/ui components (Radix UI + Tailwind)
- Docker containerization

## Development Commands

```bash
# Development (traditional)
npm install
npm run dev              # Starts dev server on port 3000 with Turbopack

# Development (Docker)
./deploy.sh --dev        # Starts containerized dev environment on port 3002

# Production deployment
./deploy.sh              # Builds and starts production containers on port 3001
./deploy.sh --clean      # Clean rebuild (removes all containers/volumes)
./deploy.sh --stop       # Stop all containers
./deploy.sh --logs       # View container logs

# Port configuration (for multi-app servers)
./port-config.sh status       # Check current port usage
./port-config.sh interactive  # Interactive port configuration wizard
./port-config.sh preset multi # Preset for multi-app deployments

# Building
npm run build            # Next.js production build
npm run start            # Starts production server
npm run lint             # ESLint validation
```

## Architecture

### Application Structure

- **app/page.tsx**: Main entry point - renders SearchResultsPage with useSearch hook
- **app/admin/page.tsx**: Admin interface for campaign management (accordion-based UI)
- **app/components/**: React components (GoogleHomepage, SearchResultsPage, PaidAds, OrganicResults, etc.)
- **app/hooks/useSearch.ts**: Core search logic and state management
- **app/api/**: Next.js API routes (ads, search, generate, version)
- **components/ui/**: shadcn/ui components (accordion, button, card, dialog, input, select, etc.)
- **lib/utils.ts**: Utility functions (cn helper for Tailwind class merging)

### Database Schema

The ads table is auto-created on first API call (see [app/api/ads/route.js:7](app/api/ads/route.js#L7)):

```sql
CREATE TABLE ads (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  title TEXT NOT NULL,
  display_url TEXT NOT NULL,
  final_url TEXT NOT NULL,
  description TEXT NOT NULL,
  description2 TEXT,
  priority INTEGER DEFAULT 1,
  utm_source TEXT DEFAULT 'google',
  utm_medium TEXT DEFAULT 'paid_search',
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

Sample data is loaded from [init-db.sql](init-db.sql) on container startup.

### API Routes

**GET/POST/DELETE /api/ads**
- GET with ?q=keyword: Returns matching ads (limit 3, ordered by priority)
- GET without params: Returns all ads for admin
- POST: Create/update ads with automatic UTM parameter injection
- DELETE: Remove ads by index

**POST /api/ads/generate**
- AI-powered ad generation using Google Gemini API
- Fallback to template-based generation if API unavailable
- Accepts: keyword, displayUrl, landingUrl, numAds (default 3), customPrompt
- Returns: ads array with campaign names

**GET /api/search**
- Google Custom Search API integration with localization support (gl, lr, hl, location params)
- Fallback to localized demo results if API not configured
- Returns 10 organic search results

**GET /api/version**
- Returns package.json version for health checks

### Key Patterns

**1. Database Auto-Initialization**
All API routes call `ensureDbAndTable()` to create the database schema if it doesn't exist. This means the app is self-initializing.

**2. API Fallback Strategy**
Both search and ad generation gracefully degrade:
- Search: Google API → Localized fallback results
- Ad Generation: Gemini API (15s timeout) → Template-based fallback

**3. UTM Parameter Auto-Generation**
The `buildUtm()` function ([app/api/ads/route.js:167](app/api/ads/route.js#L167)) automatically generates UTM parameters:
- utm_content: Set to ad title
- utm_term: Set to search keyword
- utm_source, utm_medium, utm_campaign: From database fields

**4. Google Analytics 4 Tracking**
The app includes comprehensive GA4 tracking via [app/components/GoogleAnalytics.tsx](app/components/GoogleAnalytics.tsx):
- Customer side: Page views, searches, ad clicks, organic clicks
- Admin side: Campaign management actions, AI generation events
- Only loads when NEXT_PUBLIC_GA_TRACKING_ID is configured

**5. Port Management**
The app uses configurable ports to avoid conflicts on multi-app servers:
- Production: APP_PORT=3001, DB_PORT=5433
- Development: DEV_APP_PORT=3002, DEV_DB_PORT=5434
- Use `./port-config.sh` to manage port configuration

### Environment Variables

See [.env.example](.env.example) for all configuration options. Required variables:
- **DATABASE_URL**: PostgreSQL connection string (auto-configured in Docker)

Optional APIs (app works without these):
- **GOOGLE_SEARCH_API_KEY**: Google Custom Search API key
- **GOOGLE_SEARCH_ENGINE_ID**: Custom Search Engine ID
- **GOOGLE_GEMINI_API_KEY**: Google Gemini API key for AI ad generation
- **NEXT_PUBLIC_GA_TRACKING_ID**: Google Analytics 4 tracking ID

### Docker Architecture

Two compose files:
- **docker-compose.yml**: Production deployment (port 3001)
- **docker-compose.dev.yml**: Development with hot reload (port 3002)

Both include:
- PostgreSQL 16 container with volume persistence
- Next.js app container (multi-stage build for production)
- Health checks and automatic restarts

The `./deploy.sh` script orchestrates Docker operations with smart options for clean builds, logs, and environment switching.

## Important Implementation Details

### Admin Interface
The admin page ([app/admin/page.tsx](app/admin/page.tsx)) uses a modal-based approach with the dialog component. Campaign management is done through accordion UI for organizing ads by keyword.

### Search Functionality
The useSearch hook ([app/hooks/useSearch.ts](app/hooks/useSearch.ts)) manages:
- Search query state
- Fetching ads and organic results in parallel
- Loading states
- Navigation between home and results

### Component Organization
- **app/components/**: Application-specific components (Google-themed UI)
- **components/ui/**: Reusable shadcn/ui components
- Client components use "use client" directive (Next.js App Router requirement)

### Styling
- Tailwind CSS 4 with custom configuration
- Google-accurate CSS for search interface realism
- shadcn/ui for consistent component design
- cn() utility in lib/utils.ts for conditional class merging

## Testing the Application

1. Start the app: `./deploy.sh` or `npm run dev`
2. Access homepage at http://localhost:3001 (or 3000 for local dev)
3. Access admin at http://localhost:3001/admin
4. Search for "mortgage" or "home loan" to see pre-loaded ads
5. Use AI generation in admin (requires GOOGLE_GEMINI_API_KEY)

## Common Development Scenarios

**Adding a new ad field:**
1. Update database schema in [init-db.sql](init-db.sql)
2. Update ensureDbAndTable() in [app/api/ads/route.js](app/api/ads/route.js)
3. Update GET/POST/DELETE route handlers to include new field
4. Update admin UI to capture/display the field

**Modifying AI ad generation:**
- Update prompt in [app/api/ads/generate/route.ts](app/api/ads/generate/route.ts)
- Adjust getDefaultPrompt() or generateFallbackAds() functions
- Test with and without GOOGLE_GEMINI_API_KEY to verify fallback

**Changing search behavior:**
- Modify [app/api/search/route.js](app/api/search/route.js)
- Update getLocalizedFallbackResults() for demo results
- Test localization with ?gl=uk or ?location=London parameters

**Port conflicts:**
1. Run `./port-config.sh status` to check current ports
2. Run `./port-config.sh interactive` to change ports
3. Rebuild containers: `./deploy.sh --clean`
