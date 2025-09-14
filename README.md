# Map Editor

Monorepo skeleton for the Map Editor prototype.

## Getting Started

```sh
./scripts/bootstrap.sh
```

### Local database

```sh
./scripts/db-start.sh
```

### Lint, build, type-check

```sh
pnpm lint
pnpm build
pnpm typecheck
```

## Workspace Layout

- `apps/api` – backend service (Express + tsoa).
- `apps/web` – frontend app (React + Vite).
- `packages` – shared libraries (future).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.
