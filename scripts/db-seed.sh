#!/usr/bin/env bash
set -euo pipefail
pnpm -C apps/api migration:run
pnpm -C apps/api ts-node src/data/seed.ts
