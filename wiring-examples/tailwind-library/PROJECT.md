# UI component lab — this library's conventions

`GUIDE.md` is the contract every lab shares. This file holds the facts that differ per library,
and `GUIDE.md` refers to its sections by name. It is project wiring: written once when the lab is
installed, kept by every upgrade, and changed only when the library's setup changes.

## Lab folder

`lab`. `<lab>/entries/<slug>/` is `lab/entries/<slug>/`.

## Start command

```
pnpm exec vite --config lab/vite.config.ts
```

Run it in the repo root.

## URL

`http://localhost:6100`. The port is fixed with `strictPort`; startup fails while 6100 is taken.

## Type-check command

```
pnpm exec tsc -p lab/tsconfig.json
```

Run it in the repo root.

## Worked example

<An entry in `lab/entries/` to copy from, or "none".>

## Library source

`src/` and <every other source folder or file of the library, e.g. its icons, theme and helper
modules, and its config files>.

## Importing the library

By relative path from the entry: `import { Button } from "../../../../src/button";` in a
`component/` file, `"../../../src/button"` in `entry.tsx`. <Each alias the wiring defines, e.g.
`<ALIAS>` for `<ALIAS_TARGET>`, used as the library's own source uses it.> A consumer's import in
`usage` is written as the published package path, `<package name>/<component>`.

## Styling system

Tailwind CSS 3 with the library's config. <The class prefix, e.g. `<prefix>`; every utility is
written with it.> Tokens live in <where the library keeps them>.

## Component conventions

- Tailwind classes with the library's prefix: `<prefix>flex <prefix>gap-2`.
- <The variant helper, e.g. `cva` from `class-variance-authority`, or "none".>
- <The class-join helper and its module, e.g. `cn` from the library's utilities.>
- <Whether components use `forwardRef` and set a `displayName`; the export style.>

## Render wrapper

<The provider every render sits inside, with its import, or "none".>

## Box-less wrapper

`className="<prefix>contents"`.

## Stand-in literals

An arbitrary-value Tailwind class in the `.tsx`, with the marker on the same line:

```tsx
const rowGap = "<prefix>gap-[10px]"; // PROVISIONAL(row-gap): token `<token name>` once it exists
```

Its `StandIn.value` is the class as written: `"<prefix>gap-[10px]"`.

## Stylesheets the stage loads

<The library stylesheets from `vite.config.ts` → `styles`, in order>, then `lab/lab.css`.

## White canvas

`lab/lab.css` sets it to `var(<LIBRARY_SURFACE_TOKEN>, #ffffff)`.

## Wiring files

`lab/vite.config.ts`, `lab/tailwind.config.ts`, `lab/tsconfig.json`, `lab/.eslintrc.json`,
`lab/.gitignore`, `lab/lab.css`, `lab/PROJECT.md`.
