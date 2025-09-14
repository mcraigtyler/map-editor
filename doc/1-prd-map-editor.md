# PRD — Map Editor (MAPED)

## 1. Introduction / Overview
The **Map Editor** is a browser-based, iD-inspired map editing tool built with **React + Vite** on the frontend and **Express + TypeORM + PostGIS + tsoa** on the backend. It focuses on rapid prototyping first, with a clear path to extend into advanced, lane-level road editing.

**Primary context**
- Reference: OpenStreetMap **iD** editor for UX inspiration and tagging workflows (no code reuse implied). https://github.com/openstreetmap/iD
- **Data source**: OSM **raster** tiles (`tile.openstreetmap.org`) for the prototype; later phases will move to **self-hosted vector tiles** from PostGIS.
- **Edits** are stored in a private **PostGIS** database; **no syncing to the public OSM DB** in this project.
- **Tagging**: As with the OSM iD editor, this editor will make use of https://github.com/openstreetmap/id-tagging-schema for defining tags to be applied to drawing elements.
- **Lane-level editing**: Users will draw a single line which will represent the center line. The left and right sides of the lane will be created based on a lane width setting. Each line will be tagged according to the **Lanelet2** specification. https://github.com/fzi-forschungszentrum-informatik/Lanelet2


**Initial users & environments**
- Users: **Internal developers** and **internal map editors**.
- Browsers: **Desktop Chrome** and **Edge** (v1 target).

## 2. Goals
1. Deliver a working **prototype** that lets users draw/edit **points, lines, polygons** and persist them to PostGIS.
2. Provide a **simple tag editor** for key/value attributes, supporting tagging workflows inspired by OSM iD and id-tagging-schema.
3. Establish a **resource-centric REST API** (tsoa-decorated controllers) with OpenAPI output.
4. Prepare an **extensible drawing framework** that can host future tools (e.g., lane-aware road editing).
5. Phase planning: we will implement features **in phases** (tracked as **Tasks**) to iteratively reach lane-level functionality.

## 3. User Stories
- As an **internal map editor**, I can pan/zoom a basemap and **create a point** to mark a feature so that it appears on the shared map.
- As an **internal map editor**, I can **draw a line or polygon**, edit vertices, and save changes so that geometry is persisted.
- As an **internal map editor**, I can **edit tags** (key/value) for a selected feature in a sidebar and see them reflected immediately, using presets from the id-tagging-schema.
- As an **internal developer**, I can load features **by viewport (bbox)** on map move so the map stays responsive.
- As an **internal map editor**, I can **draw a center line** for a road segment. The system will infer the left and right sides of the lane based on a lane width setting. The system will **apply Lanelet2-aligned tags** automatically based on context.
- As an **internal developer**, I can rely on a **well-typed OpenAPI spec** to generate an API client for the web app.

## 4. Functional Requirements
**Map & Data Loading**
1. The system **must display** a MapLibre GL map using OSM **raster tiles** with required attribution.
2. The system **must fetch features by bounding box** (`GET /features?bbox=minLon,minLat,maxLon,maxLat`) on `moveend`.
3. The system **must render** points (circles), lines, and polygons (fill + outline) from a single GeoJSON source.

**Editing & Persistence**

4. The system **must create** a feature (`POST /features`) with body: `{ kind, geom (GeoJSON), tags? }`.
5. The system **must update** a feature (`PATCH /features/:id`) allowing geometry and tag changes.
6. The system **must delete** a feature (`DELETE /features/:id`).
7. The system **must represent geometry in SRID 4326 (WGS84)** in PostGIS.
8. The system **must reject** invalid geometries with a clear error message.

**Tagging**

9. The system **must provide** a **basic tag editor** (key/value table or simple form) for selected features, supporting tagging schemas and presets.
10. The system **should support** preset-driven forms and tag validation using the id-tagging-schema.

**Lane-level Roads (Future)**

11. The system **must allow** users to **manually draw center lines** per road segment. The left and right sides of the lane will be inferred based on a lane width setting.
12. The system **must apply** **Lanelet2-aligned tags** to these lines (center/left/right), covering at least:  
    - `lanes`, `oneway`, `turn:lanes` (initial subset)  
    - defaults by road class/surrounding context  
    - direction inferred from draw direction
13. The system **should expose** these as either distinct **Feature(kind='road')** instances with role tags or as separate resource endpoints (to be decided during design).
14. The system **should** provide interactive helpers (snapping/offset suggestions) in later phases.

**API & Structure**

15. The API **must be resource-centric** with **tsoa** controllers per resource under `src/resources/<resource>/controller.ts` and DTOs in `resource.ts`.
16. The API **must expose** an **OpenAPI spec** (tsoa-generated) under `src/spec/openapi.json`.
17. The backend **must** persist entities via **TypeORM** with entities in `src/data/entities` and repositories in `src/data/repositories`.
18. The system **must accept GeoJSON** for input and return GeoJSON geometries in responses.

**Non-Functional (Prototype)**

19. The prototype **should update** visible features within **200ms** after a simple edit on a mid-range laptop.
20. The prototype **must operate** without authentication in dev (auth to be added in later phases).

## 5. Non-Goals (Out of Scope for Prototype)
- Versioning/undo/conflict resolution and OSM-style changesets.
- Authentication/RBAC, rate limiting, CSRF, and governance controls.
- Background jobs, queues, caching, or production observability.
- Offline edits and sync.
- Syncing edits to the public OSM database.
- Advanced spatial validation (beyond basic validity checks).

## 6. Design Considerations
- **Layout**: Map full-bleed; **left sidebar** for selection details and tag editing.
- **Tagging UX**: Tag editor in sidebar supports key/value editing and preset selection, leveraging id-tagging-schema for suggestions and validation.
- **Drawing UX**: Click to add vertices, drag handles to edit, double-click to finish; delete via context button.
- **Extensibility**: A thin “modes/tools” layer in the web app to host future tools (roads, lane helpers). Keep MapLibre bindings isolated so tools are framework-agnostic.
- **Attribution**: Display “© OpenStreetMap contributors” visibly.

## 7. Technical Considerations
- **Frontend**: React + Vite + TypeScript; MapLibre GL (raster first). One GeoJSON source for user features with separate style layers for point/line/polygon.
- **Backend**: Express + TypeORM + PostGIS + **tsoa**. Resource-centric structure with generated `routes.ts` and OpenAPI spec.
- **DB**: Single table for v1: `feature(id uuid, kind text, geom geometry(Geometry,4326), tags jsonb, created_at, updated_at)` with **GIST index** on `geom`.
- **Containers**: Dockerize a PostgresDB with the PostGIS extension enabled.
- **DTOs**: `FeatureDTO` `{ id, kind: 'point'|'line'|'polygon'|'road', geom: GeoJSON.Geometry, tags?, createdAt, updatedAt }`.
- **SRID**: **4326 (WGS84)** for all geometries.
- **Tagging**: Integrate id-tagging-schema for tag presets and validation in the frontend tag editor.
- **Lanelets**: Start with manual drawing of center/left/right lines; automated context tagging runs on the client initially (can move server-side later).

## 8. Success Metrics
- A new user can **add/edit/delete** point, line, and polygon within **5 minutes** of onboarding.
- **Zero console errors** during core flows (load, draw, edit, save).
- **OpenAPI spec** is generated and consumable by the web app’s API client.
- Lane tool stub exists behind a feature flag (even if not enabled) by the end of the lane-focused phase.

## 9. Open Questions
1. **Lanelet2 scope**: Which exact Lanelet2 fields are in-scope for v1 of lane tagging? (Provide the minimal field list and examples.)
2. **Road data model**: Should we store center/left/right as **three Feature rows** with roles in `tags`, or introduce a **Road** resource that relates them?
3. **Snapping/offset**: Should we add basic vertex snapping in the prototype, or defer to a later phase?
4. **Search**: Do we need place/feature search in v1 (Nominatim/Pelias), or defer?
5. **Validation**: Any minimum geometry rules beyond validity (self-intersection checks for polygons, etc.)?

---

### Appendix A — API Resources (initial)
- `Feature` resource
  - `GET /features?bbox=...`
  - `GET /features/:id`
  - `POST /features`
  - `PATCH /features/:id`
  - `DELETE /features/:id`

### Appendix B — Environments
- **Local Dev**: Dockerized Postgres + PostGIS; API on port 3000; web app on port 5173.
- **Staging**: TBD; use OSM raster with modest usage.
- **Production**: Move to **self-hosted vector tiles** and add security, caching, and observability.
