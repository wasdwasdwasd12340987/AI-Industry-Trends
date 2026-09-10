# PulseAI — Industry AI Adoption Dashboard

Static React dashboard visualizing AI adoption data across 15 industry sectors (2022-2025),
built from the PulseAI research paper. No backend — data is baked into the build as JSON.

## Run locally
```
npm install
npm run dev
```

## Deploy
Push this repo to GitHub, then either:
- **Vercel**: import the repo, it auto-detects Vite, hit Deploy.
- **GitHub Pages**: run `npm run build`, then deploy the `dist/` folder (e.g. with the
  `gh-pages` package, or GitHub Actions).

## Stack
- React 18 + TypeScript + Vite
- Recharts for charts
- Data: `src/data/adoption.json`
