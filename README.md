# UI component lab

The UI component lab is a small Vite and React app that lives inside a component library and
renders a proposed component with the library's real styles. One entry is one proposed
component: a specimen in a same-origin iframe at the design width, the usage code for the
current state, and an inspector with Controls, Parts, Examples, Tokens, Figma → code and Design
tabs. An agent writes entries by following `GUIDE.md`, which is the contract between the app and
the agent. A designer or developer reviews the proposal on the page before any library code
changes.

## Run the demo

The repository root is itself a working lab, with a small stand-in library, so the stage can be
developed without a host library.

```
pnpm install
pnpm dev          # http://localhost:6100, fails if 6100 is taken
pnpm dev --port 6199
pnpm check        # tsc -p tsconfig.json
```

Open `/demo`. There is no `build` script: the page reads screenshots from disk through the Vite
dev server (`/@fs/…`) and discovers entries at dev time, so a production build would not show
what the dev server shows.

## Layout

Everything in a lab is one of two kinds, and the line between them decides what an upgrade
touches.

**Generic — the lab's own.** Copied into a library unchanged and replaced wholesale on upgrade.
A project never edits these files, so nothing project-specific lives in them.

| Path | What it is |
|---|---|
| `stage/` | The app. `stage/types.ts` is the single definition of the entry format. `stage/vite.ts` exports `defineLabConfig`, which holds every piece of Vite configuration the stage depends on. |
| `index.html` | The page shell. |
| `GUIDE.md` | The entry contract. It refers to `PROJECT.md` for every per-library fact. |

**Project wiring — the library's own.** Written once per library and never overwritten by an
upgrade.

| Path | What it is |
|---|---|
| `vite.config.ts` | A call to `defineLabConfig` with the lab root, the repo root, the library stylesheets, aliases, PostCSS plugins and, optionally, a port. |
| `tsconfig.json` | Type-checks the stage and the entries; its `paths` mirror the Vite aliases. |
| `PROJECT.md` | The library's conventions: start command, URL, type-check command, where library source lives and how an entry imports it, styling system, variant helper, how a stand-in literal looks. |
| A project stylesheet | Optional. Sets `--lab-canvas-white`, the White canvas colour (here: `project.css`). |
| Tailwind config, ESLint ignore | When the library needs them; see `wiring-examples/tailwind-library/`. |

**Entries** — `entries/<slug>/` — belong to the library too. An upgrade never touches them.

**This repository only** — not part of a lab installed in a library:

| Path | What it is |
|---|---|
| `entries/demo/`, `demo-library/` | A demo entry and the stand-in library it imports from. The entry uses every feature the stage has. |
| `wiring-examples/tailwind-library/` | Reference wiring for a Tailwind library, with placeholders. |
| `package.json`, `pnpm-lock.yaml`, `.github/` | The demo's dependencies and CI. |

## Getting it into a library

1. Copy the generic part — `stage/`, `index.html`, `GUIDE.md` — from a tagged version of this
   repository into a folder of the library, for example `lab/`.
2. Write the wiring: `vite.config.ts`, `tsconfig.json`, `PROJECT.md`, and whatever else the
   library's styling needs. `PROJECT.md` in this repository is the template: each of its
   sections says which fact it holds.
3. Register the lab with whatever drives it, so that the agent that writes entries knows the lab
   folder and reads `GUIDE.md` and `PROJECT.md`.

The host library must provide `react` and `react-dom` 18, `vite` with a matching
`@vitejs/plugin-react`, `typescript`, `@types/react` 18 and `@types/node`. The stage adds no
dependency of its own and has no Tailwind dependency.

## Upgrading

Replace `stage/`, `index.html` and `GUIDE.md` with the files from the new tagged version. Leave
`entries/` and the wiring alone. When a new version needs a new wiring fact, `PROJECT.md` in
this repository gains a section for it, and the library's own `PROJECT.md` needs the same
section filled in.

## Known to work with

| | Standalone demo | A Tailwind library |
|---|---|---|
| React, React DOM | 18.3.1 | 18.3.1 |
| `@types/react` | 18.3.31 | 18.3.3 |
| Vite | 8.3.5 | 5.2.13 |
| `@vitejs/plugin-react` | 6.1.2 | 4.3.0 |
| TypeScript | 7.0.2 | 5.4.5 |
| Tailwind CSS | — | 3.4.4 |
| Node | 24 | 24 |

The stage uses no React 19 API. It uses the global `JSX` namespace, which `@types/react` 19
removes, so it type-checks against `@types/react` 18 only.

## Status

0.1.0. Built by iterating on one real component library. The install and upgrade steps above
have not yet run against a second library.
