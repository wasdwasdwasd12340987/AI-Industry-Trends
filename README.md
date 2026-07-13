# PulseAI — Industry AI Adoption Dashboard

> Real-time pulse on enterprise AI integration, investment, and sentiment across industries.

**Live app:** [https://4eacc34a-7889-422a-9687-062527c2aa9d-00-20r95111vxo8c.picard.replit.dev
](https://ai-industry-trends--moekofahi1.replit.app/)
---

## What it does

PulseAI is an interactive dashboard that surfaces the latest data on how businesses are adopting AI globally. It covers:

- **Adoption by Industry** — track AI uptake across 15+ sectors over time
- **Global Trend** — overall and GenAI-specific adoption curves since 2022
- **Global Perspective** — private AI investment by country and public sentiment scores
- **Business Function & Tool Adoption** — which business functions lead AI use, and which tools are growing fastest
- **Compare & Forecast** — benchmark any two sectors side-by-side and project future adoption using Linear Regression or Random Forest models with live R²/MAE fit stats

---

## Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces |
| Runtime | Node.js 24, TypeScript 5.9 |
| Frontend | React 18 + Vite, shadcn/ui, Recharts |
| Backend | Express 5 |
| Validation | Zod v4, drizzle-zod |
| API contract | OpenAPI 3 → Orval codegen (React Query hooks + Zod schemas) |
| Build | esbuild (CJS bundle) |

---

## Project structure

```
artifacts/
  api-server/          # Express 5 REST API (port 8080)
  pulseai-dashboard/   # React + Vite frontend
lib/
  api-spec/            # OpenAPI YAML — source of truth for the contract
  api-client-react/    # Orval-generated React Query hooks + Zod schemas
scripts/               # Shared utility scripts
```

---

## Getting started

### Prerequisites
- Node.js 24+
- pnpm 10+

### Install
```bash
pnpm install
```

### Run in development
```bash
# Terminal 1 — API server
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Dashboard
pnpm --filter @workspace/pulseai-dashboard run dev
```

The dashboard is served at `http://localhost:<PORT>` (Vite picks a free port).  
The API is served at `http://localhost:8080/api`.

### Other useful commands
```bash
# Full typecheck across all packages
pnpm run typecheck

# Regenerate API hooks + Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Build all packages
pnpm run build
```

> **Note:** Run codegen any time you change `lib/api-spec/openapi.yaml`.

---

## Key features

### Forecast models
The Forecast tab supports two models selectable at runtime:

| Model | Description |
|---|---|
| **Linear Regression** | Fast, interpretable trend projection |
| **Random Forest** | 60-tree bootstrap ensemble, deterministic (seeded LCG), depth-3 regression trees |

Both endpoints return R² and MAE so you can judge model fit at a glance.

### Chart readability
- Y-axis labels auto-wrap to 2 lines (handles long names like "IT & Software Engineering")
- X-axis country labels wrap horizontally — no truncation, no slant
- Tool Growth bars always sorted largest → smallest

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | Top-level KPI metrics |
| GET | `/api/adoption/industries` | Adoption % by industry over time |
| GET | `/api/adoption/global-trend` | Global AI + GenAI adoption trend |
| GET | `/api/adoption/business-function` | Adoption % by business function |
| GET | `/api/investment/by-country` | Private AI investment by country |
| GET | `/api/investment/sentiment` | Public AI sentiment by country |
| GET | `/api/tools/users` | AI tool user counts |
| GET | `/api/forecast` | Single-industry adoption forecast |
| GET | `/api/forecast/all` | Cross-industry forecast overview |

Query params for forecast: `industry`, `yearsAhead` (1–5), `model` (`linear` \| `random-forest`)

---

## Data sources

- McKinsey Global Survey on AI / State of AI Reports (2022–2025)
- Stanford HAI AI Index 2025
- IBM AI Adoption Index
- OpenAI official announcements
- Ipsos AI Sentiment Survey 2024

---

## License

MIT
