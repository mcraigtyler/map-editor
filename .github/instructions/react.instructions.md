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
    routes/                # route modules (lazy)
      index.tsx            # home
      users/
        index.tsx          # list
        $userId.tsx        # detail
    layouts/
      RootLayout.tsx       # shell (nav/header/sidebar/outlet)
  components/              # reusable PrimeReact-based components
  hooks/                   # custom hooks
  lib/                     # apiClient, query keys, utils
  styles/                  # theme overrides, global.css
  tests/                   # unit/integration
```

## 🧭 Routing Conventions (react-router-dom)

- Use **Data Router** (`createBrowserRouter`, `RouteObject`, `RouterProvider`).
- Prefer **lazy routes** with `lazy()` and code-split each route.
- Use **loaders/actions** when appropriate for data fetching/mutations (or colocate TanStack Query inside routes).
- Route files co-located by feature; **nest** where it improves organization.

(... trimmed for brevity ...)
