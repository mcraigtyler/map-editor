# AGENTS — Web (apps/web)

Guidance for contributors and agents working on the React + TypeScript web app. Incorporates React instructions from `.github/instructions/react.instructions.md`.

## Project Overview
- Purpose: React-based editor that renders a MapLibre map, fetches features by bbox, and allows creating/editing points/lines/polygons with a sidebar tag editor. Future lane tools behind a feature flag.
- Tech: React 18, Vite (tooling), TypeScript (strict), react-router-dom (routing), PrimeReact + PrimeIcons (UI), TanStack Query (server/cache state), MapLibre GL (map). See `doc/2-architecture.md` for structure.
- Structure (target): route modules under `src/app/routes`, reusable components under `src/components`, feature slices under `src/features`, and `src/lib` for shared utilities (api client, query client, bbox helpers).

## Build and Test Commands
- Install (at repo root): `pnpm install`
- Lint: `pnpm -C apps/web lint`
- Build: `pnpm -C apps/web build`
- Typecheck: `pnpm -C apps/web typecheck`
- Dev server / unit tests: add Vite dev/test scripts when wired (Vitest + RTL recommended). Until then, `typecheck` ensures TS health.

## Code Style Guidelines
- Components: functional components with hooks only. Type all props/returns. Keep components small and focused; prefer composition.
- State: server/cache via TanStack Query; local UI state with React hooks; use Zustand only for drawing-session state when needed.
- Routing: react-router-dom Data Router; prefer lazy routes; colocate loaders/actions where appropriate or encapsulate data fetching in feature hooks.
- UI: use PrimeReact components and PrimeIcons; ensure loading/empty/error states. Follow accessibility best practices (labels, ARIA, keyboard nav).
- Styling: PrimeReact theme with minimal overrides; keep global CSS small.
- Imports/exports: named exports; avoid deep relative paths—use aliases when configured.

## Testing Instructions
- Unit: Vitest + React Testing Library for components and hooks. Cover loading/empty/error states and interaction.
- Integration: test feature flows with MSW mocking the API. Example: draw a polygon → save → appears in map source.
- E2E (optional): Playwright smoke tests for critical flows (load map, fetch bbox, create feature).
- Test data: use deterministic MSW handlers; avoid network flakiness in tests.

## Security Considerations
- Inputs are untrusted: validate/sanitize user-provided strings in forms. Avoid `eval` and dynamic code execution.
- API usage: centralize fetch in `src/lib/apiClient` with consistent error mapping; never expose secrets in client bundles.
- Map & attribution: always display “© OpenStreetMap contributors”.
- Feature flags: guard experimental tools (lane editing) behind flags; keep evaluations testable.

