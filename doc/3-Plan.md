# Project Plan — Map Editor

High-level phased task breakdown from empty repo to first production release. Each phase will later be decomposed into granular tickets (spikes, stories, chores). Deliverable = a demonstrable increment.

---
## Phase 0: Foundations & Repo Bootstrap
Goal: Working mono‑repo skeleton with shared conventions.
- Initialize mono‑repo (package manager, workspaces, lint/format config)
- Base TypeScript configs (root + per app)
- CI pipeline skeleton (install, build, lint, type‑check)
- Shared commit / branch / versioning strategy
- Developer environment scripts (bootstrap, db start, seed)
- Add baseline README + contribution guide

## Phase 1: Backend API Scaffold
Goal: Running Express+tsoa service returning health/status.
- Express app shell with tsoa integration
- OpenAPI generation pipeline (prebuild / watch)
- Error handling, logging baseline, request validation
- Env config & typed configuration module
- Health, version, and metrics endpoints

## Phase 2: Database & Spatial Core
Goal: Postgres + PostGIS ready with first tables.
- Provision local PostGIS container & connection pooling
- Migration framework & initial migration (extensions, schemas)
- Spatial feature table (geometry, properties JSONB, timestamps)
- Basic seed script + sample geometries
- Spatial indices & SRID enforcement strategy
- Geometry validation utilities (server-side)

## Phase 3: Frontend Shell & Map Basemap
Goal: React/Vite app loads MapLibre with OSM raster tiles.
- Vite app scaffold + routing framework
- Global providers (query client, theming)
- Map container + tile attribution compliance
- Initial layout (sidebar + map viewport)
- Environment config wiring (API base URL)

## Phase 4: API Feature CRUD (MVP)
Goal: REST endpoints for feature listing & detail.
- Feature entity + TypeORM model refinements
- DTOs & validation schemas
- List (bbox filter), read, create, update, delete endpoints
- Pagination & bbox parameter parsing utilities
- OpenAPI examples + response shaping (GeoJSON Feature / FeatureCollection)

## Phase 5: Frontend Data Integration
Goal: Basic feature browsing in UI.
- API client abstraction + error mapping
- React Query keys + fetch functions
- Feature list panel & detail view route
- Map layer to render features (GeoJSON source)
- Loading / empty / error states

## Phase 6: Drawing & Editing Tools
Goal: In-browser creation & modification of geometries.
- Drawing mode state management (Zustand or similar)
- Integrate drawing library or custom interaction layer
- Vertex/handle UI components & snapping strategy spike
- Create geometry flow (point/line/polygon)
- Edit geometry flow (select, modify, save)
- Client-side geometry validation + simplification (if needed)

## Phase 7: Tagging & Metadata
Goal: Attach & edit attribute tags on features.
- Tag schema definition (allowed keys/values or free-form policy)
- Form components + validation (Zod/Yup)
- Update endpoints supporting partial metadata changes
- UI editing panel with optimistic updates

## Phase 8: UI Cleanup
- Remove the `API Configuration` section in the sidebar
- When a feature is selected make that features line/marker 'glow' to make it look highlighted. At the very least change the color of the lines/points to be a different, more visible, color.
- Move `Geometry tools` as a floating toolbar centered at the top of the map
- Add a `Select` option to the `Geometry tools` that when picked the next feature selected in the map will be the selected/highlighted feature. This should also show the feature as selected in the Features list in the Sidebar.
- The `Features` list in the sidebar should be a scrollable list with a row per feature. Only show the Type, Updated DateTime and number of points that make up the feature.
- Allow for deleting of a feature in the sidbar list of `Features`

## Phase 9: Tag Editor


## Phase 10: Feature Styles


## Phase ??: API Cleanup/Refactor

## Phase ??: Performance & Caching
Goal: Smooth map interaction & scalable API.
- Server-side bbox query optimization benchmark
- Add HTTP caching headers / ETag strategy
- Investigate spatial clustering / generalization for large bbox
- Client cache invalidation rules
- Index / analyze slow queries

## Phase ??: Auth & Access Control (Foundational)
Goal: Minimal secure perimeter.
- Authentication strategy selection (OIDC stub or token-based)
- Auth middleware + protected routes
- Role/claim model (editor vs read-only)
- Frontend auth context + login/logout flows (stub if external IdP pending)

## Phase ??: Vector Tile Migration Preparation
Goal: Architectural readiness for vector tiles later.
- Evaluate pg_tileserv / Tegola / Martin (spike + decision record)
- Define tile layer schema & style JSON draft
- Prototype MVT generation query (ST_AsMVT) on sample data
- Abstraction layer in frontend (raster vs vector source toggle)

## Phase ??: QA, Observability & Hardening
Goal: Production-grade reliability.
- Add structured logging + correlation IDs
- Metrics & basic tracing (OpenTelemetry exporter selection)
- Error reporting integration (e.g., Sentry) frontend & backend
- Automated test pyramid definition (unit, integration, e2e smoke)
- Write initial critical path tests
- Security review (dependency audit, headers, rate limiting)

## Phase ??: Documentation & Dev Experience
Goal: Clear onboarding & API usability.
- API reference publishing (bundled OpenAPI + docs site)
- Architecture & decisions (ADR index)
- User guide: create/edit feature, tagging workflow
- Runbook: local dev, migrations, common issues

## Phase ??: Pre-Release Stabilization
Goal: Feature-complete MVP ready for stakeholders.
- Bug triage & stabilization sprints
- Performance regression tests
- Final data migration / seed sanity check
- Release checklist execution

## Phase ??: Initial Production Release
Goal: Deployed MVP.
- Production infrastructure provisioning (DB, app runtime, CDN)
- Deployment automation (CI -> environment)
- Monitoring dashboards + alert thresholds
- Post-release validation & rollback plan

## Phase ??: Post-Release Enhancements (Future Epics)
Goal: Strategic roadmap placeholders.
- Full vector tile switchover
- Advanced editing (multi-select, topology validation)
- Bulk import/export (GeoJSON, Shapefile)
- Offline / optimistic sync exploration
- Fine-grained permission model
- Theming & accessibility refinements

---
## Cross-Cutting Tracks (Ongoing)
- Code quality & refactoring
- Dependency upgrades & security patches
- UX feedback incorporation
- Performance profiling
- Documentation upkeep

## Next Step
Select Phase 0 tasks and decompose into actionable tickets (≤ 1 day each) for sprint planning.
