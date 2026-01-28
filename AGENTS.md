# AGENTS — Map Editor

This doc guides human and autonomous agents working in this monorepo. It summarizes project context, build/test commands, code style, testing, and security.

## Project Overview
- Purpose: A browser-based map editor (iD-inspired) that lets users draw/edit points, lines, and polygons and persist them to PostGIS. Future phases add lane-level road tools.
- Key docs: `doc/1-prd-map-editor.md`, `doc/2-architecture.md`, `doc/3-Plan.md`.
- Stack: `apps/web` (React + Vite + TypeScript + MapLibre), `apps/api` (Express + tsoa + TypeORM + PostGIS), `packages/*` (future shared libs).
- API: Resource-centric REST with OpenAPI. Feature entity stored as geometry (SRID 4326) plus tags.

## Build and Test Commands
- Install deps (root): `pnpm install`
- Lint all: `pnpm lint`
- Build all: `pnpm build`
- Typecheck all: `pnpm typecheck`
- Per app, see `apps/api/AGENTS.md` and `apps/web/AGENTS.md`.

## Code Style Guidelines
- TypeScript strict everywhere; avoid `any`. Prefer interfaces for contracts, union types for variants.
- Enforce ESLint + Prettier; fix warnings before merge.
- Architecture layering (API): Controller → Service → Repository → DB. Map ORM entities to DTOs; don’t leak ORM types.
- Imports/exports: prefer named exports; keep paths tidy (set up aliases when needed). Avoid deep relative traversal.
- Errors: custom domain errors; translate to HTTP in controllers. No raw string throws; sanitize messages.

## Testing Instructions
- Keep a test pyramid: unit (pure logic), integration (HTTP + DB), and UI tests.
- API: supertest-based route tests; DB integration under a test database/container; MSW optional for client mocks.
- Web: React Testing Library for components; MSW for API mocks; Playwright optional for E2E smoke.
- Name tests descriptively: `should <expected behavior>`; include loading/empty/error states in UI tests.

## Security Considerations
- Validate all external input at boundaries (tsoa + schema validation). Reject unknown props or strip safely.
- Never log secrets; centralize configuration and validate env at startup.
- Serialize errors safely; do not return raw Error objects.
- Database: parameterized queries via ORM; geometry must be SRID 4326 and valid (`ST_IsValid`).
- Frontend: avoid eval/dynamic code; don’t embed secrets; sanitize user-provided strings in UI.
- Attribution: display “© OpenStreetMap contributors”.

## Branching and PRs
- Branch naming: `feature/{feature-name}` (kebab-case, concise), e.g., `feature/draw-polygons`.
- PR title: concise, imperative mood (e.g., “Add polygon drawing tool”).
- PR description should include:
  - Context: what problem or requirement this addresses.
  - Solution: high-level approach and any trade-offs.
  - Verification: how you tested it (commands, screenshots/GIFs for UI).
  - Impact: migrations, API changes, performance/security considerations.
- Checklist before requesting review:
  - `pnpm lint`, `pnpm typecheck`, `pnpm build` all pass.
  - Tests added/updated where appropriate; UI states covered.
  - Docs updated (PRD/Architecture/Plan) if behavior or APIs changed.
  - API changes reflected in OpenAPI and validation schemas (tsoa) updated.
  - No secrets or unsafe logs; errors sanitized per guidelines.
