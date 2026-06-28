.PHONY: all ci test test-frontend test-backend typecheck build clean help dev db-local seed

# ─── Default target ────────────────────────────────────────────────
all: ci

# ─── Full CI pipeline (matches GitHub Actions) ────────────────────
ci: typecheck test build
	@echo ""
	@echo "✅ All checks passed"

# ─── Tests ─────────────────────────────────────────────────────────
test: test-frontend test-backend

test-frontend:
	@echo "━━━ Frontend tests ━━━"
	npm test

test-backend:
	@echo "━━━ Backend tests ━━━"
	cd worker && npm test

# ─── Type-check ────────────────────────────────────────────────────
typecheck:
	@echo "━━━ Frontend type-check ━━━"
	npm run typecheck
	@echo "━━━ Backend type-check ━━━"
	cd worker && npm run typecheck

# ─── Build ─────────────────────────────────────────────────────────
build:
	@echo "━━━ Frontend build ━━━"
	npm run build

# ─── Coverage ──────────────────────────────────────────────────────
coverage:
	@echo "━━━ Frontend coverage ━━━"
	npm run test:coverage
	@echo "━━━ Backend coverage ━━━"
	cd worker && npm run test:coverage

# ─── Install ───────────────────────────────────────────────────────
install:
	npm ci
	cd worker && npm ci

# ─── Local dev ───────────────────────────────────────────────────────
# Starts frontend (8085) + admin (8086) + worker API (8787) together.
# Frontend/admin point at the local worker via .env.development.local (VITE_API_BASE).
dev:
	npm run dev:all

# Apply the D1 schema to the local (miniflare) database. Safe to re-run.
db-local:
	cd worker && npm run db:schema:local

# Seed the local D1 with real SCP wiki data via the crawler.
# Requires `make dev` (or `npm run dev:worker`) running in another terminal.
# Long-running and safe to interrupt — each batch commits to D1 as it goes.
seed:
	cd worker && npm run seed:crawl

# ─── Clean ─────────────────────────────────────────────────────────
clean:
	rm -rf node_modules dist coverage
	rm -rf worker/node_modules worker/coverage

# ─── Help ──────────────────────────────────────────────────────────
help:
	@echo "Available targets:"
	@echo "  all (default) - Run full CI pipeline: typecheck + test + build"
	@echo "  ci            - Same as 'all'"
	@echo "  test          - Run all tests (frontend + backend)"
	@echo "  test-frontend - Run frontend tests only"
	@echo "  test-backend  - Run backend tests only"
	@echo "  typecheck     - Run TypeScript type-checking for both projects"
	@echo "  build         - Build the frontend for production"
	@echo "  coverage      - Run tests with coverage reporting"
	@echo "  install       - Install dependencies for both projects"
	@echo "  clean         - Remove node_modules, dist, and coverage"
	@echo "  dev           - Start frontend + admin + worker API locally"
	@echo "  db-local      - Apply D1 schema to the local database"
	@echo "  seed          - Seed local D1 with real data via the crawler (run worker dev first)"
	@echo "  help          - Show this help"
