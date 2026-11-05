# UI component lab — this library's conventions

`GUIDE.md` is the contract every lab shares. This file holds the facts that differ per library,
and `GUIDE.md` refers to its sections by name. It is project wiring: written once when the lab is
installed into a library, kept by every upgrade, and changed only when the library's setup
changes.

This copy describes the standalone demo in the `ui-component-lab` repository, where a tiny
stand-in library, `demo-library/`, plays the part of a real one. It is also the template: every
`##` section below is one fact an install — by hand, or by the `figma-tools:create-ui-component-lab`
skill — must fill in for a real library. *Fill in* under each heading says what that section
holds; the rest is this repository's value. A library's copy keeps every heading as it is here,
because `GUIDE.md` refers to the sections by name.

## Lab folder

*Fill in:* the lab folder's path from the repo root. `GUIDE.md` writes it as `<lab>`.

The repo root. `<lab>/` is empty here: `<lab>/entries/demo/` is `entries/demo/`.

## Start command

*Fill in:* the command that starts the lab, and the folder to run it in.

```
pnpm dev
```

Run it in the repo root. To start a second copy beside a running one, pass another port:
`pnpm dev --port 6199`.

## URL

*Fill in:* the page's URL, with the port. `GUIDE.md` writes it as `<url>`.

`http://localhost:6100`. The port is fixed with `strictPort`; startup fails while 6100 is taken.

## Type-check command

*Fill in:* the command that type-checks the lab, entries included, and the folder to run it in.

```
pnpm check
```

Run it in the repo root. It runs `tsc -p tsconfig.json`.

## Worked example

*Fill in:* an entry in this library to copy from, or "none".

`entries/demo/`.

## Library source

*Fill in:* where the library's source lives. An entry never edits it (`GUIDE.md`, hard rule 2).

`demo-library/` at the repo root: `chip.tsx`, `icon.tsx`, `cx.ts`, their stylesheets, and
`styles.css` with the tokens and type classes.

## Importing the library

*Fill in:* how `entry.tsx` and a `component/` file import a library component, with one example of
each, and any alias the wiring defines.

By relative path; there are no aliases. From `entries/<slug>/entry.tsx`:
`import { Chip } from "../../demo-library/chip";`. From `entries/<slug>/component/<name>.tsx`:
`import { cx } from "../../../demo-library/cx";`. A consumer's import in `usage` is written as the
published package path, `demo-library/<name>`.

## Styling system

*Fill in:* how the library styles its components — utility classes, CSS files, CSS-in-JS — and
where its tokens live.

Plain CSS. Tokens are custom properties named `--demo-*` in `demo-library/styles.css`, together
with the type classes `demo-text-label` and `demo-text-caption`. Each component imports its own
stylesheet next to it (`chip.tsx` imports `./chip.css`).

## Component conventions

*Fill in:* what makes a file read as this library's code: class naming, the variant helper, the
class-join helper, `forwardRef` or not, export style.

- Classes are `demo-<component>` with `demo-<component>--<modifier>` for a variant or size.
- No variant helper: a variant is a modifier class picked from the prop.
- `cx` from `demo-library/cx.ts` joins class names.
- Every component is a named export wrapped in `forwardRef`, with a `displayName`.
- A copy of a library component keeps its class names, so its stylesheet also applies to the
  library's own component while both are loaded. Keep the copy's rules a superset of the
  original's.

## Render wrapper

*Fill in:* the element every render in an entry sits inside — a theme, locale or other provider
the library's components need to render as they do in the library's own preview tooling — with
its import; or "none".

None. The demo library's components need no provider.

## Box-less wrapper

*Fill in:* the literal that gives an element `display: contents` in this styling system.

`className="demo-contents"`.

## Stand-in literals

*Fill in:* what a value that stands in for a missing token looks like in this styling system, and
where it sits, with one example. It must sit in a `.ts` or `.tsx` file (`GUIDE.md`, hard rule 4).

A string constant in the component's `.tsx`, applied through `style`, with the marker on the same
line:

```tsx
const chipGap = "10px"; // PROVISIONAL(chip-row-gap): token `space/chip-row/gap` (10px) once the library has it
```

Its `StandIn.value` is the literal as written: `"10px"`.

## Stylesheets the stage loads

*Fill in:* the library stylesheets that the page and the specimen load before the stage's own,
in order. They go in the `styles` list of `vite.config.ts`. A stylesheet the library's preview
tooling loads with a `<link>` tag, such as a web font, goes into a wiring stylesheet as
`@import url(…)`, because `index.html` is generic and never edited.

`demo-library/styles.css`, then `project.css`.

## White canvas

*Fill in:* what `--lab-canvas-white` is set to, and in which wiring stylesheet; or "the default,
`#ffffff`".

`project.css` sets it to the demo library's page surface, `var(--demo-surface-page, #ffffff)`.

## Wiring files

*Fill in:* every file in the lab folder that is project wiring rather than the lab's own.

- `vite.config.ts` — calls `defineLabConfig` from `stage/vite.ts` with the lab root, the repo
  root and the `styles` list.
- `tsconfig.json` — type-checks the stage and the entries.
- `project.css` — the white canvas.
- `.gitignore` in the repository root ignores `.vite-cache/`; a lab inside a library carries its
  own `.gitignore` for that.
- `PROJECT.md` — this file.

`package.json`, `demo-library/` and `wiring-examples/` belong to this repository, not to a lab
installed in a library.
