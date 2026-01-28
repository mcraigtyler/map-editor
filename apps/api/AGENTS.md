# AGENTS — API (apps/api)

Guidance for contributors and agents working on the Express + tsoa + TypeORM + PostGIS API.

## Project Overview
- Purpose: Resource-centric REST API for spatial Features with CRUD and bbox querying. Persists geometries to PostGIS (SRID 4326) and returns GeoJSON shapes in DTOs.
- Tech: Express, tsoa (routes + OpenAPI), TypeORM, PostgreSQL + PostGIS. Entities live under `src/data/entities`, repositories under `src/data/repositories`, controllers/services under `src/resources/*` per Architecture doc.

## Build and Test Commands
- Install (at repo root): `pnpm install`
- Lint: `pnpm -C apps/api lint`
- Build: `pnpm -C apps/api build`
- Typecheck: `pnpm -C apps/api typecheck`
- Database (local): use `./scripts/db-start.sh` and `./scripts/db-stop.sh` at repo root.
- OpenAPI: Ensure tsoa generation is wired to emit `apps/api/src/spec/openapi.json` (hook into build/watch as implemented).

## Code Style Guidelines
- TypeScript strict; no `any`. Keep controllers thin; move logic into services. Map ORM entities to DTOs explicitly.
- DTOs & mappers: define DTOs separately from entities; centralize mapping. Keep request/response types stable.
- Validation: validate request bodies/params at the boundary. Reject unknown properties; sanitize strings.
- Errors: use typed domain errors; translate in controllers; log once via central error middleware. No raw string throws.
- Imports: prefer named exports; avoid deep relative imports (configure aliases in tsconfig when needed).

## Testing Instructions
- Unit test services and pure utilities without I/O.
- Integration test HTTP routes using supertest. Cover success and failure (validation, not found, invalid geometry).
- DB integration: use a test database/container; run migrations before tests; clean data between tests.
- Contract tests: verify OpenAPI responses conform to DTO shapes; keep examples in spec accurate.

## Security Considerations
- Input is untrusted: validate all bodies/params. Enforce SRID 4326; check `ST_IsValid` and reject invalid geometries with clear messages.
- Database: parameterized queries through TypeORM. Add GIST index on geometry; use `ST_MakeEnvelope(...,4326)` for bbox.
- Error responses: do not leak stack traces or internal details; map to proper HTTP codes.
- Config: centralize env parsing/validation; no scattered `process.env`. Never log secrets.
- Future auth: plan for OIDC/token verification middleware; pass request identity through service layer when added.

