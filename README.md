# Map Editor

Monorepo skeleton for the Map Editor prototype.

## Getting Started

```sh
./scripts/bootstrap.sh
```

### Local database

Copy the example environment file and update values as needed:

```sh
cp apps/api/.env.example apps/api/.env      # Bash
copy apps\api\.env.example apps\api\.env  # PowerShell
```

Start Postgres (requires Docker):

```sh
./scripts/db-start.sh
```

Run migrations and seed data:

```sh
pnpm -C apps/api migration:run
pnpm -C apps/api ts-node src/data/seed.ts
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
