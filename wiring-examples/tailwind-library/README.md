# Wiring example: a Tailwind library

Reference material for installing the lab into a component library that styles with Tailwind CSS
3. The standalone demo in this repository does not use any file here, and `pnpm check` skips this
folder. Each file is the project wiring for a lab at `<repo>/lab/`, with the library's own
`tailwind.config.ts` at the repo root.

| File | What it does | What to fill in |
|---|---|---|
| `vite.config.ts` | Calls `defineLabConfig` from `stage/vite.ts`: the lab root, the repo root, the library stylesheets, the aliases, and Tailwind through PostCSS. | `<LIBRARY_STYLESHEET>`: each global stylesheet the library's components need, in the order the library loads them. `<ALIAS>` / `<ALIAS_TARGET>`: one entry per non-relative import the library's own source uses, or none. |
| `tailwind.config.ts` | Spreads the library's Tailwind config, anchors its `content` globs to the repo root, and adds `entries/**/*.{ts,tsx}`, so the classes an entry uses are generated. | The import path of the library's config, when it is not `../tailwind.config`. |
| `tsconfig.json` | Type-checks the stage and the entries. `paths` mirrors the Vite aliases, so an import that runs also type-checks. | The same `<ALIAS>` / `<ALIAS_TARGET>` pairs as `vite.config.ts`. Drop the `/*` line for an alias that names one file. |
| `.eslintrc.json` | Ignores every file in the lab folder. | Nothing. |
| `lab.css` | Sets the white canvas to the library's page surface. | `<LIBRARY_SURFACE_TOKEN>`: the custom property for that surface, e.g. `--surface-primary`. Leave the file out to keep plain `#ffffff`. |
| `PROJECT.md` | The library's conventions, as `GUIDE.md` asks for them. | Every `<…>` placeholder. |

## Why `.eslintrc.json` exists

The host repo's root ESLint config lints every folder below it, the lab included, and its
TypeScript parser reads the host's root `tsconfig.json`. That tsconfig does not include the lab's
files and has none of the lab's settings, so the lint fails on files that type-check cleanly
under the lab's own `tsconfig.json`. A nested `.eslintrc.json` that ignores everything takes the
lab out of the root lint. It works with the legacy `.eslintrc` format only. A host on the flat
config format (`eslint.config.js`) has to list the lab folder in its root config's `ignores`
instead, which is an edit outside the lab folder and therefore the owner's call.
