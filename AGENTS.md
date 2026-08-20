# AGENTS.md

"Vibeflow" — agentic content-creation platform. Next.js 16 (App Router) + React 19 + TypeScript + pnpm + Tailwind CSS v4 + shadcn/ui ("base-nova" style) + Drizzle (Neon Postgres) + Better Auth. Deployed to Vercel.

## Verification etiquette (IMPORTANT)

- **ASK the user before running typechecks or builds** (`tsc --noEmit`, `next build`, etc.). The machine is slow and the codebase is large.
- Don't typecheck incrementally as you edit. **Finish the whole feature first**, then run the typecheck once, fix errors, and re-verify.
- `pnpm test` is fast (~5 files, 49 tests) and safe to run anytime.

## Commands (always `pnpm`, never `npm`/`npx`)

- `pnpm dev` — dev server (localhost:3000)
- `pnpm test` — vitest (run), `pnpm test:watch` / `pnpm test:ui`
- `pnpm db:generate` + `pnpm db:migrate` (or `pnpm db:push`) — Drizzle migrations; needs `DATABASE_URL`
- `pnpm db:studio` — browse the DB
- `pnpm build` — production build (ASK first)
- `pnpm lint` is **BROKEN**: eslint is not installed (`eslint: command not found`). Do not rely on it.

## Architecture

- **Tests**: vitest, node env, only `tests/**/*.test.ts`. Pure unit tests: budget math, zod schema contracts, SVG compositing, export. No DB mocks. `tests/export.test.ts` is the slow one (~1.3s, real rendering through sharp/resvg).
- **DB**: `lib/db/schema.ts` is the single source of truth. Flexible data lives as JSON strings in `text` columns (e.g. project `config`, asset `metadata`, workflow `nodes`), not normalized columns. Backward-compat table aliases (`projects`, `files`, `chatMessages`, ...) are exported at the bottom — use the canonical names when writing new code. Migrations in `/migrations`. `lib/db/index.ts` throws without `DATABASE_URL`.
- **Auth**: Better Auth. Root `proxy.ts` guards every route except `PUBLIC_PREFIXES`. New public/unauthed pages MUST be added there; authenticated users hitting auth pages are bounced to `/dashboard`.
- **AI**: AI SDK v7. Models in `lib/ai/models.ts` (OpenRouter free models, image-gen, Gateway). Agents + tools in `lib/ai/agents/`. The harness bridge (`@ai-sdk/harness*`, `ws`, `sharp`, `potrace`, `@resvg/resvg-js`, `@visioncortex/vtracer`, `pixi.js`) must stay in `next.config.mjs` `serverExternalPackages` — bundling breaks Turbopack static analysis and runtime asset reads. Add new native/node-only deps there too.
- **Design/artifact pipeline**: `lib/artifacts/*` — SVG composition (zod contracts in `contracts.ts`), raster export, image tracing. Well-covered by tests; reuse rather than reimplement.
- **Storage / budgets / sandboxes**: Cloudflare R2 (`lib/storage/r2.ts`); spend ledger in `lib/budget/` (env `BUDGET_CEILING_CENTS`, default $1000, costs tracked in micro-cents); Daytona sandbox client in `lib/daytona/`.
- **Routing**: route groups `app/(app)`, `app/(auth)`, `app/(landing)`; product pages under `app/projects/[id]/`; API under `app/api/projects/[id]/...`; auth catch-all at `app/api/auth/[...all]`.
- **UI**: shadcn in `components/ui`, AI-SDK elements in `components/ai-elements/`, product UI in `components/workspace/`, `components/dashboard/`, `components/ai/`.
- **Paths**: `@/` alias → repo root (works in TS and vitest).

## Gotchas

- `docs/development/*` is **stale history** — old "Flowspace"/v0 branding, says `npm run`, and describes a much earlier codebase. Trust code over those docs. `docs/ARCHITECTURE.md` is a future-phase plan, not a map of current state.
- `next.config.mjs` sets `typescript.ignoreBuildErrors: true` — a passing build does NOT mean types are correct; verify with `tsc --noEmit` (after asking).
- Env is zod-validated in `lib/env.ts` (warns, doesn't throw; every key optional). Real secrets live in gitignored `.env.local`; never commit or hardcode them.
- `pnpm-workspace.yaml` has placeholder `allowBuilds` entries (esbuild/msw/sharp) — pnpm may prompt to resolve them on install.