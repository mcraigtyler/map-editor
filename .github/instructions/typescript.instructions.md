---
applyTo: '**'
---

# TypeScript Node.js API Coding Instructions

These directives guide code generation for a Node.js TypeScript REST / HTTP API (Express / Fastify style). Prefer clarity, strong typing, security, testability, and maintainability.

## 1. Language & Targets
- Use modern TypeScript (ES2022+ features when supported). Avoid experimental decorators unless enabled.
- Use ES modules (import/export) unless project explicitly uses CommonJS.
- Always enable: strict, noImplicitAny, noUncheckedIndexedAccess, exactOptionalPropertyTypes.

## 3. Imports & Exports
- Prefer named exports. Default exports only for single central object (e.g. app bootstrap).
- No relative path traversal beyond 2 levels; configure path aliases (e.g. `@domain/*`).

## 4. Types & Modeling
- Prefer `interface` for structural contracts; `type` for unions / mapped / conditional types.
- Never use `any`; if unavoidable, isolate and comment rationale with `// TODO: refine type`.
- Avoid leaking ORM types (e.g. Prisma models) into domain layer; map to domain entities.
- Use discriminated unions for finite state results instead of boolean flags.

## 5. Error Handling
- Domain errors: custom Error subclasses (e.g. `DomainError`, `ValidationError`, `NotFoundError`) without HTTP concerns.
- Translate to HTTP in controller layer only.
- Never throw raw strings. Attach safe metadata only (no secrets).
- For predictable validation failures, prefer returning `Result` / `Either` style or throwing typed errors—stay consistent.

## 6. Async Patterns
- Use `async/await`; avoid `.then` chains inside code generation.
- Wrap top-level route handlers with central error wrapper (no duplicated try/catch in each handler unless necessary for partial rollback).

## 7. Validation
- Input validation at boundary (request layer) using a schema lib (e.g. Zod / Joi / Yup). Produce typed inference.
- Reject unknown properties (strip or fail). Sanitize strings when appropriate.

## 8. Logging & Observability
- Do not use `console.log` in production code; abstract via logger interface (e.g. pino / winston) with levels.
- Include correlation / request IDs when available.
- Log errors once (at boundary) to avoid duplication.

## 9. Configuration
- Load configuration centrally (`config/index.ts`).
- Validate env vars with a schema (e.g. Zod) at startup; fail fast.
- Do not access `process.env` scattered throughout code.
- Never log secret values.

## 10. Security
- Treat all external input as untrusted; validate everything.
- Escape or parameterize all DB queries (let ORM handle binding).
- Avoid dynamic `eval`, `Function`, insecure regex catastrophes (test heavy patterns).
- Enforce explicit JSON serialization (no returning raw Error objects).

## 11. Performance & Resource Management
- Prefer streaming for large payloads (where framework supports).
- Use pagination / cursors for list endpoints.
- Debounce or batch external API calls where appropriate.
- Clean up timers, intervals, and connections on shutdown (graceful stop handler).

## 12. Database Access (if applicable)
- Keep raw queries isolated in repository classes.
- Return domain objects or DTOs, not ORM entities, to upper layers.
- Handle transactions via a unit-of-work helper (pass transactional context explicitly).

## 13. Testing
- Unit test domain & application layers (no I/O) with high coverage.
- Integration tests for HTTP routes (supertest / light client) and DB (using test container or in-memory if realistic).
- Avoid mocking what you own—mock external boundaries only.
- Name tests: `should <expected behavior>`.

## 14. Documentation & Comments
- Keep code self-explanatory; add JSDoc for public functions, complex algorithms, exported types.
- Document side effects, invariants, concurrency assumptions.

## 15. Style & Lint
- Enforce ESLint + Prettier; do not hand-format.
- Prefer early returns over nested conditionals.
- Avoid broad catch blocks; rethrow preserving stack if wrapping.
- Avoid large files (>300 lines) and large functions (>40 lines) unless justified.

## 16. HTTP Layer (Controllers / Routes)
- Controllers: minimal translation layer (req -> DTO -> use case; result -> response mapper).
- Never place business logic in controllers.
- Consistent response envelope (example): `{ data, error }` or direct data—pick one and stay consistent.
- Set explicit status codes. Avoid 200 with error messages.

## 17. DTOs & Mappers
- Define DTO types separately from domain entities if shape differs.
- Centralize mapping logic (e.g. `mappers/` or static functions on DTO modules).

## 18. Functional Patterns
- For operations that can fail: use union return (`Success | Failure`) or `Result<T, E>` helper.
- Keep side-effect free pure functions in domain layer.

## 19. Concurrency & Resilience
- Use abort controllers / timeouts for outbound HTTP calls.
- Implement retry with backoff only where idempotent.
- Circuit-breaker pattern for flaky dependencies (optional advanced).

## 20. Feature Flags
- Wrap flag evaluations behind a small service interface for testability.

## 21. Naming
- Functions: verbNoun (e.g. `createUser`), classes: PascalCase, constants: UPPER_SNAKE only if true constants.
- Avoid abbreviations; clarity over brevity.

## 22. Dependency Management
- Minimal dependencies—justify each.
- Prefer lightweight libs over large frameworks when feasible.
- Keep versions pinned (lockfile committed).

## 23. Build & Tooling
- Avoid path-based dynamic requires that break bundlers.
- Ensure emitted JS is free of TS-specific helpers if using modern runtime; else rely on `tslib`.

## 24. Error Messages
- User-facing messages sanitized; internal logs can include diagnostic context (no PII/secrets).

## 26. Anti-Patterns (Avoid)
- Business logic inside route handlers.
- Returning raw DB rows directly.
- Using `any` / `as unknown as` chains to silence the compiler.
- Silent catch blocks.
- Large God services doing unrelated tasks.

## 27. Graceful Shutdown
- Listen for `SIGTERM` / `SIGINT`, stop HTTP server, drain in-flight requests, close DB pools.

## 28. Generated Code Expectations
- Always produce compilable TS.
- Add necessary imports you reference.
- Prefer small focused functions; avoid over-engineering if requirement is simple.

(End of instructions)
