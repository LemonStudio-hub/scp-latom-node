# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SCP Docs is a themed documentation/intranet portal for the SCP Foundation universe. It consists of two parts:

1. **Frontend** (root) — Vue 3 + TypeScript SPA with Vite
2. **Backend API** (`worker/`) — Hono framework on Cloudflare Workers with D1 database

The frontend is at `scp-docs.scp.lat` and the API at `api.scp.lat`.

## Development Commands

### Frontend (root directory)
```bash
npm run dev        # Start dev server on port 8085
npm run build      # Type-check with vue-tsc + build with Vite
npm run preview    # Preview production build
npm test           # Run tests (vitest run)
npm run test:watch # Run tests in watch mode
npm run typecheck  # Type-check only (vue-tsc -b --noEmit)
```

### Backend (worker/ directory)
```bash
cd worker
npm run dev             # Start Wrangler dev server
npm run deploy          # Deploy to Cloudflare Workers
npm run test            # Run tests (vitest run)
npm run typecheck       # Type-check only (tsc --noEmit)
npm run db:schema       # Apply schema to remote D1 database
npm run db:schema:local # Apply schema to local D1 database
```

### Full CI Pipeline (local)
```bash
make ci            # Run typecheck + test + build (same as GitHub Actions)
make test          # Run all tests (frontend + backend)
make typecheck     # Type-check both projects
make build         # Build frontend
make coverage      # Run tests with coverage
make help          # Show all available targets
```

### Local full-stack development

`npm run dev:all` (or `make dev`) starts the frontend (8085), admin (8086), and the
Worker API (`wrangler dev`, 8787) together via `concurrently`. `.env.development.local` /
`admin/.env.development.local` (gitignored) set `VITE_API_BASE=http://localhost:8787`
so both apps talk to the local Worker instead of production in dev mode only —
delete them to fall back to `https://api.scp.lat`. (Deliberately `.development.local`,
not plain `.env.local` — Vite loads `.env.local` in every mode, which would also
leak into `vitest run` and `vite build` and break tests/production builds.)

The local D1 database starts empty. One-time setup:
```bash
make db-local       # or: cd worker && npm run db:schema:local
```

To populate local D1 with real SCP wiki data (catalog listings, not full entry
content — that's fetched lazily per-entry), run the crawler against the local
Worker. **This hits the live SCP wiki and is long-running** (each batch pulls ~30
entries with rate-limit delays; a full crawl can take hours per language) — it's
safe to `Ctrl+C` at any point since each batch commits to D1 immediately:
```bash
# In one terminal:
make dev            # or npm run dev:worker
# In another terminal, once the Worker is up:
make seed           # or: cd worker && npm run seed:crawl
```

AI chat features additionally require `GLM_API_KEY` in `worker/.dev.vars`
(gitignored, not created by default) — without it, AI chat endpoints will error
but the rest of the app works fine.

## CI/CD

### GitHub Actions
- **`.github/workflows/ci.yml`** — Runs on push/PR to `main`: type-check, test, and build for both frontend and backend
- **`.github/workflows/deploy.yml`** — Runs on push to `main` (or manual trigger): deploys frontend to Cloudflare Pages and backend to Cloudflare Workers

### Required Secrets
Set these in GitHub repo settings → Secrets and variables → Actions:
- `CLOUDFLARE_API_TOKEN` — Cloudflare API token with Pages and Workers permissions
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account ID

## Testing

Tests use **Vitest** with `happy-dom` for the frontend. Test files live in `__tests__/` directories next to the code they test.

### Frontend test coverage
- `src/services/__tests__/` — API client and response normalization
- `src/stores/__tests__/` — Pinia stores (auth, search)
- `src/composables/__tests__/` — Vue composables (useLocale, useTheme)
- `src/data/__tests__/` — Static data integrity
- `src/locales/__tests__/` — i18n key parity between en/zh
- `src/components/common/__tests__/` — UI components (Badge, Card, ClassBar)
- `src/views/__tests__/` — Page views (LoginView, RegisterView)

### Backend test coverage
- `worker/src/utils/__tests__/` — JWT and password utilities
- `worker/src/routes/__tests__/` — Auth routes (register, login, profile)
- `worker/src/__tests__/` — CORS and health check

## Architecture

### Frontend Structure

- **`src/views/`** — Page components (HomeView, CatalogView, EntryView, DocumentsView, LoginView, RegisterView, ProfileView, AboutView, NotFoundView)
- **`src/components/`** — Organized by domain:
  - `common/` — Reusable UI (Badge, Card, ClassBar)
  - `home/` — Homepage sections (HeroSection, RecentEntries, StatsGrid)
  - `layout/` — App shell (AppHeader, AppSidebar, AppFooter, SearchModal)
- **`src/stores/`** — Pinia stores: `auth.ts` (user auth state), `search.ts` (search state)
- **`src/data/`** — Static mock data: `entries.ts` (SCP entries), `documents.ts` (Foundation documents)
- **`src/services/api.ts`** — HTTP client for the backend API
- **`src/composables/`** — Vue composables: `useLocale.ts` (i18n), `useTheme.ts` (dark/light mode)
- **`src/locales/`** — i18n translation files (en.ts, zh.ts)

### Backend Structure (worker/)

- **`src/index.ts`** — Hono app entry point with CORS configuration
- **`src/routes/auth.ts`** — Authentication endpoints (register, login, profile)
- **`src/middleware/auth.ts`** — JWT auth middleware
- **`src/utils/`** — JWT (jose library) and password (bcrypt-style) utilities
- **`src/types.ts`** — TypeScript interfaces for Cloudflare bindings (D1, JWT_SECRET, etc.)

### Data Model

The app uses two main data types defined in `src/types/index.ts`:

- **`ScpEntry`** — SCP objects with containment class (Safe/Euclid/Keter/Thaumiel/Apollyon/Neutralized), containment procedures, and description
- **`Document`** — Foundation documents (protocols, research, incidents, directives) with classification levels

### i18n

The app supports English and Chinese (zh) via vue-i18n. Locale is persisted in localStorage under key `scp-locale`. Add new translations to both `src/locales/en.ts` and `src/locales/zh.ts`.

### Routing

Routes are defined in `src/router/index.ts`. Some routes have auth guards:
- `requiresAuth: true` — Requires authenticated user (e.g., /profile)
- `requiresGuest: true` — Only for unauthenticated users (e.g., /login, /register)

### Path Aliases

`@` is aliased to `src/` in both Vite and TypeScript configs.

## Key Technical Details

- Vue 3 with `<script setup>` syntax and Composition API
- Pinia for state management
- Vue Router with HTML5 history mode
- Cloudflare Workers + D1 for the backend
- Hono framework (not Express) for the API
- jose library for JWT handling
- Volar extension recommended for VS Code
