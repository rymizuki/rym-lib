# Repository Guidelines

## Project Structure & Modules
- Monorepo managed with `npm workspaces` and `turbo`.
- Apps in `apps/*` (e.g., `apps/example-query-module`).
- Libraries in `packages/*` (e.g., `query-module`, drivers, adapters, `utilities`).
- Each package: `src/` (source), `*.spec.ts` (tests), `build/` (output).
- Shared configs in `packages/dev-config` (ESLint, Prettier, TS).

## Build, Test, and Development
- Root build: `npm run build` — runs `tsup` in packages via Turbo.
- Test all: `npm test` — runs `vitest` across packages (coverage where configured).
- Lint all: `npm run lint` — ESLint + type-check (some packages run `tsc`).
- Format: `npm run format` — Prettier with import sorting.
- Dev: `npm run dev` — runs package dev tasks (where defined).
- Target a package: `turbo run test --filter=@rym-lib/query-module` or run inside the package: `npm test`.

## Coding Style & Naming
- TypeScript, strict mode (`NodeNext` module/resolution).
- `.editorconfig`: spaces=2, `lf`, UTF-8.
- Prettier: no semicolons, single quotes, trailing commas, sorted imports.
- ESLint: `@typescript-eslint` rules; use provided configs from `@rym-lib/dev-config`.
- Package naming: `@rym-lib/<package>`; files in `src/` use `kebab-case` or `camelCase` as existing modules do; tests end with `.spec.ts`.

## Testing Guidelines
- Framework: `vitest` (see `vitest.config.mts` per package).
- Place tests alongside code: `src/**/*.spec.ts`.
- Coverage: enabled in some packages (e.g., `query-module`); include `src/**/*`, exclude `src/test-utils/**/*`.
- Run focused tests: `vitest -t "rule mapping"` or `vitest run path/to/file.spec.ts` within a package.

## Commits & Pull Requests
- Commit style: Conventional prefixes (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`). Use scopes when useful (`fix(query-module): ...`).
- Changesets: add a changeset for user-facing changes (`npm run changeset`). Versioning/publish use Changesets.
- PRs: include description, linked issues, scope (affected packages), and test evidence (logs or minimal repro). For UI-related packages, include screenshots if applicable.

## Architecture Notes
- Core domain lives in `packages/query-module` with drivers (`*-driver-*`) and adapters (`nakadachi-*`). Keep boundaries clear and avoid cross-coupling between packages except via published exports.
