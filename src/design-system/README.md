# CZ Design System (vendored)

Source copied from https://github.com/czczccc/cz-design-system at commit
`1a9cd9591532e762ad574c724e7619620304dba9` (MIT, see `LICENSE`), following the
system's "source delivery" model.

Local changes:

- `"use client"` added to components that use Framer Motion, context or Radix state.
- `buttonVariants` moved to `button-variants.ts` so server components can use it.

Rules from the system apply to the whole app: use semantic utilities only
(`bg-surface`, `text-fg-muted`, `rounded-control`, `text-body`, `shadow-sm`,
`ease-enter`, `duration-fast` …). Tailwind's default palette, font sizes, radii,
shadows and easings are cleared by `styles/theme.css`, so `text-sm`,
`bg-zinc-100` or `bg-primary` silently do nothing.

To update: copy `src/tokens`, `src/motion`, `src/lib`, `src/styles` and
`src/components/ui` again and reapply the two local changes.
