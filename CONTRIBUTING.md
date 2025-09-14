# Contributing

## Branching

Create branches off `main` following the pattern:

- `feat/*` for new features
- `chore/*` for maintenance
- `fix/*` for bug fixes

## Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

## Developer Scripts

- `pnpm lint` – run ESLint across workspaces.
- `pnpm build` – compile TypeScript for all packages.
- `pnpm typecheck` – verify TypeScript types without emitting.
- `./scripts/db-start.sh` – start local PostGIS database.
- `./scripts/db-stop.sh` – stop local database.
