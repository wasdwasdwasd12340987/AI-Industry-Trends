---
name: Recharts fill/stroke with HSL CSS variables
description: How to correctly reference theme chart colors in Recharts (or any inline SVG style) when the CSS custom properties store raw HSL components.
---

Many shadcn/Tailwind theme setups define chart colors as raw HSL triples, e.g.:

```css
--chart-1: 221 83% 53%;
```

and then expose a wrapped, usable version separately:

```css
--color-chart-1: hsl(var(--chart-1));
```

**Rule:** always reference the wrapped `--color-*` token (`var(--color-chart-1)`) in `fill`/`stroke`/inline style props — never the raw `--chart-1` token directly. `fill="var(--chart-1)"` is invalid CSS color syntax (it resolves to the literal string `"221 83% 53%"`), and browsers silently fall back to black/gray instead of erroring, which makes the bug easy to miss in visual QA.

**Why:** this caused industry bar charts and area charts to render solid black instead of themed colors, with no console error or typecheck failure — only visible via screenshot review.

**How to apply:** when wiring up Recharts (or similar) components in a project using shadcn-style theme CSS variables, grep the theme file for `--color-chart` / `--color-destructive` etc. and use those wrapped tokens in chart color props, not the bare `--chart-N` / `--destructive` names.
