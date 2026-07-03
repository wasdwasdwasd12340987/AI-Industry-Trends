---
name: React Query provider required for orval-generated hooks
description: orval/react-query codegen hooks throw at runtime (not build time) if QueryClientProvider is missing from the app root.
---

When using orval-generated React Query hooks (`useGetX`, `useGetXQueryOptions`, etc.) from an OpenAPI codegen pipeline, the app root must be wrapped in `QueryClientProvider` with a `QueryClient` instance.

**Why:** Missing the provider does not cause a typecheck or build failure — the app compiles fine and only fails at runtime with `Error: No QueryClient set, use QueryClientProvider to set one`, thrown deep inside the first component that calls a generated hook. This is easy to miss if verification only relies on `tsc` and doesn't render the app / check browser console logs.

**How to apply:** after scaffolding or receiving a frontend from a design subagent that uses generated API hooks, always check `App.tsx` (or root entry) for `QueryClientProvider`, and confirm by loading the live preview and checking browser console logs for unhandled errors — not just running typecheck.
