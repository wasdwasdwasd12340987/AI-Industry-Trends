# PulseAI — Industry AI Adoption Dashboard

An interactive dashboard tracking enterprise AI adoption, investment, and sentiment across industries — with side-by-side sector comparison and adoption forecasting.

**Live app:** https://4eacc34a-7889-422a-9687-062527c2aa9d-00-20r95111vxo8c.picard.replit.dev  
**GitHub:** https://github.com/wasdwasdwasd12340987/AI-Industry-Trends

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/pulseai-dashboard run dev` — run the dashboard frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec (run after any change to `lib/api-spec/openapi.yaml`)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite, shadcn/ui, Recharts
- API: Express 5
- Validation: Zod (v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the API contract
- `lib/api-client-react/src/generated/` — Orval-generated hooks and schemas (do not edit by hand)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/pulseai-dashboard/src/pages/` — React pages (home, compare)
- `artifacts/pulseai-dashboard/src/pages/home.tsx` — main dashboard, charts, WrapTick/WrapXTick components
- `artifacts/pulseai-dashboard/src/pages/compare.tsx` — Compare & Forecast page with sector comparison and model selector

## Architecture decisions

- **Contract-first API**: OpenAPI YAML is the single source of truth; Orval generates all client hooks and Zod validators — never write fetch calls by hand.
- **Unified Compare & Forecast page**: Compare and Predict were merged into one page (`/compare`) with internal tabs to reduce navigation complexity.
- **Deterministic Random Forest**: Uses a seeded LCG (seed=42) for reproducible forecasts across requests; 60 trees, depth-3 regression trees, bootstrap sampling.
- **Custom chart tick components**: `WrapTick` (Y-axis) and `WrapXTick` (X-axis) are file-level SVG components — not hooks — passed as `tick={<WrapTick />}` to Recharts `YAxis`/`XAxis`. They word-wrap labels to 2 lines so nothing is truncated.
- **No database**: All data is static/seeded in the API route handlers. No `DATABASE_URL` is required for this project.

## Product

- Home page: KPI metrics, adoption by industry, global trend, investment/sentiment by country, business function adoption, tool growth
- Compare & Forecast page:
  - **Compare tab**: side-by-side adoption trajectory for any 2+ sectors with performance summary table
  - **Forecast tab**: per-industry or cross-industry adoption projection with Linear Regression or Random Forest, showing R²/MAE model fit stats

## User preferences

- Keep chart labels fully visible — prefer wrapping to truncation or slanting.
- Tool Growth bars sorted largest → smallest.
- Navigation: Home and Compare & Forecast only (no separate Predict page).

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI change, before touching the frontend — otherwise the generated hooks won't have the new params.
- `WrapTick`/`WrapXTick` are plain functions, not React components with hooks — keep them outside the page component.
- For Random Forest, `slope` and `intercept` are returned as 0 in the response (unused); the `isCapped` UI check is safe because it only uses `projectedValue`.
- `pnpm run build` requires `PORT` and `BASE_PATH` env vars (set by workflows) — use `typecheck` instead when verifying from the shell.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `README.md` for the full public-facing project documentation
