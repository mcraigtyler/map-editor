```yaml
applyTo: '**/*.{js,jsx,ts,tsx,css,scss,mdx}'
description: 'Instructions for GitHub Copilot to assist with React 18 + TypeScript apps using Vite, react-router-dom, PrimeReact, and PrimeIcons.'
```

# GitHub Copilot Instructions — React + Vite + Router + PrimeReact

These instructions guide GitHub Copilot to produce consistent, high-quality code for a **React 18 + TypeScript** web app using **Vite** (tooling), **react-router-dom** (routing), and **PrimeReact**/**PrimeIcons** (UI).

## 🧠 Context

- **Language**: TypeScript (strict)
- **Runtime/Framework**: React 18
- **Tooling**: Vite (vitest for unit tests if present)
- **Routing**: react-router-dom v6+ (prefer Data Router APIs)
- **UI**: PrimeReact + PrimeIcons (+ PrimeFlex for layout)
- **State**: React hooks first; TanStack Query for server/cache state; Context/Zustand for app state when needed
- **Styling/Theming**: PrimeReact theme (e.g., Lara/Saga/etc.); minimal global overrides
- **Quality**: ESLint + typescript-eslint + Prettier
- **Testing**: Vitest/Jest + React Testing Library; Playwright for E2E

## 🔧 General Guidelines

- Use **functional components** and **hooks** only.
- Type everything: explicit `Props`/`State` and hook return types.
- Use **PrimeReact** components for controls and **PrimeIcons** for icons.
- Always include **loading / empty / error** UI for data views.
- Prefer **composition over inheritance**; keep components small and focused.
- Accessibility: leverage PrimeReact’s ARIA, proper labels, keyboard nav; don’t wrap interactive behavior in `<div>`s.

## 📁 Project Structure (Vite + Router)

```
src/
  main.tsx                 # createRoot + RouterProvider
  app/
    layouts/               # shared layouts
      RootLayout.tsx
  pages/                   # all route pages (each page has its own folder)
  components/              # reusable components promoted from pages
  hooks/                   # reusable hooks promoted from pages
  lib/                     # apiClient, query keys, utils
  styles/                  # theme overrides, global.css
  tests/                   # shared utilities for testing
```

## 📁 Pages & Component Organization

- All top-level routes live in `/src/pages`.
- Each page has its **own folder** under `/pages`.
- **Never** put all UI/controls inline in one big page file — always break down into smaller components/hooks, even if only used in that page.
- Each page folder acts as a **mini-module**, containing its layout, components, hooks, types, and tests.

### ✅ Standard Naming Convention

Inside `/src/pages/{pageName}`:

- `index.tsx` → **entry point only**. Re-exports the main page component for routing. Must not contain UI logic.
- `{pageName}.tsx` → main page component, top-level container.
- `{pageName}-*.tsx` → supporting components (`home-grid.tsx`, `user-form.tsx`).
- `{pageName}.hooks.ts` → custom hooks scoped to the page.
- `{pageName}.types.ts` → shared TS types/interfaces.
- `{pageName}.test.tsx` → tests for the main page. Supporting components may also have their own `*.test.tsx`.
- `{pageName}.stories.tsx` → optional Storybook stories colocated with the component.

### ✅ Example Structure

```
src/
  pages/
    home/
      index.tsx           # re-exports HomePage
      home.tsx            # main page component
      home-grid.tsx       # subcomponent
      home-panel.tsx      # subcomponent
      home.hooks.ts       # page-specific hooks
      home.types.ts       # page-specific types
      home.test.tsx       # test for HomePage
      home-grid.test.tsx  # test for subcomponent
```

### ✅ Promotion Guidelines

- Components/hooks start inside their page folder.
- If reused across multiple pages, **promote** them to `/src/components` or `/src/hooks`.
- Update imports accordingly.

### 🚫 Anti-Pattern

- Don’t define multiple large components inline inside the page file.
- Don’t put page logic directly in `index.tsx`.

## 🧭 Routing Conventions (react-router-dom)

- Use **Data Router** (`createBrowserRouter`, `RouteObject`, `RouterProvider`).
- Prefer **lazy routes** with `lazy()` and code-split each route.
- Use **loaders/actions** when appropriate for data fetching/mutations (or colocate TanStack Query inside routes).
- Route files co-located by feature; **nest** where it improves organization.

## 🎨 UI & Styling (PrimeReact)

- Import theme + core styles once in `main.tsx` or `styles/global.css`:
  - `primereact/resources/themes/lara-light-blue/theme.css`
  - `primereact/resources/primereact.min.css`
  - `primeicons/primeicons.css`
  - (Optional) **PrimeFlex** for layout utilities
- Prefer component props and theme tokens over custom CSS; use small scoped overrides when needed.
- Validation: add `p-invalid` class and `<small className="p-error">` helpers.

## 🔌 Data & API

- Create a typed `apiClient` (Fetch or Axios) with:
  - Base URL, auth, and error normalization.
  - Helpers for GET/POST/PUT/DELETE returning typed data.
- For server state, use **TanStack Query**; include all inputs in `queryKey`.
- Mutations: optimistic updates with rollback where safe; invalidate on success.

## 🧪 Testing

- Use React Testing Library; test behavior and accessibility (roles/labels).
- For routes, wrap tests with `MemoryRouter` and render route elements.
- Mock network (MSW suggested) and test loading/empty/error states.

## ✅ Patterns to Prefer

- **Lazy-loaded** route modules for code-splitting.
- **Toast** for notifications; **Dialog** for modals; **ConfirmDialog** for confirms.
- **DataTable** for tabular data (pagination/sort/filter as needed).
- **react-hook-form + zod** for forms (`InputText`, `Dropdown`, `Calendar`, `Password`, `Checkbox`, etc.).
- **PrimeIcons** via `icon="pi pi-..."` on PrimeReact components.

## 🚫 Patterns to Avoid

- Re-creating standard controls instead of using PrimeReact equivalents.
- Mixing multiple CSS frameworks; keep to PrimeReact + PrimeFlex (and tiny overrides).
- Uncontrolled inputs in complex forms — prefer `react-hook-form`.

## 📦 Example Copilot “Scaffolds” It Should Produce

- **Form with validation + PrimeReact controls** (with `p-invalid` and error text).
- **Paginated DataTable** wired to TanStack Query with `queryKey` and `queryFn`.
- **Route module** with `lazy` export and loader, plus suspense boundaries.
- **Toast** usage via `Toast` ref and `toast.current?.show({ severity: 'success', ... })`.
