# UI component lab — entry guide

The lab is a local page that renders a proposed component with the library's real styles. One
**entry** = one proposed component. This file is the contract for adding or changing an entry,
and it holds in every library. What differs per library — where the lab lives, how to start it,
the port, how an entry imports the library, the styling conventions — is in **`PROJECT.md`**,
next to this file: this library's conventions. Read both before writing an entry.

A worked example is `entries/demo/` in the `ui-component-lab` repository; `PROJECT.md` →
*Worked example* names one in this library, if there is one.

**Paths.** A path in this file is relative to the lab folder, unless it starts with `<lab>/`.
`<lab>` is the lab folder's path from the repo root (`PROJECT.md` → *Lab folder*); it is empty
when the lab is the repo root. `<url>` is `PROJECT.md` → *URL*.

## Start it

Run `PROJECT.md` → *Start command*. The page is at `<url>`. The port is fixed: startup fails if it
is taken. No env vars needed. Edits under `entries/` reload the page by themselves.

## Hard rules

1. Write only inside the lab folder. Never edit, create or stage anything else in the repo. Inside
   the lab folder, never edit `stage/`, `index.html` or this file: an upgrade of the lab replaces
   them. The wiring files that `PROJECT.md` lists change only when the library's setup changes.
2. Library source (`PROJECT.md` → *Library source*) is never edited. To propose a change to an
   existing library component, copy it into the entry's `component/` folder and change the copy.
3. Files in `component/` import only from the library, from npm packages and from each other —
   **never** from `stage/`, from `entry.tsx`, or from another entry. They are later copied into the
   library as the start of the implementation. Write them as library code, the way `PROJECT.md` →
   *Component conventions* and *Importing the library* say; fix a relative import path when the
   file moves. Put `data-part="<kebab-name>"` on the root element of every part you want the page
   to find (see `Part.locate`). The attribute stays when the file moves into the library. When a
   part has no element of its own, wrap it in an element with `display: contents`
   (`PROJECT.md` → *Box-less wrapper* gives the literal), which adds no box.
4. Every literal that stands in for a token, type step or icon that does not exist yet carries a
   comment **on the same line**:
   `PROVISIONAL(<id>): <what should replace it>`
   and the same `<id>` appears in a part's `standIns`. `<id>` is kebab-case and unique in the
   entry. `grep -rn "PROVISIONAL(" entries/<slug>/component` must list every stand-in. The page
   reads markers from the `.ts` and `.tsx` files in `component/` only, so a stand-in literal lives
   in one of those, never in a stylesheet. The page flags a marker without a `standIns` row and a
   `standIns` row without a marker.
5. Controls come in exactly two groups (below). No control ever changes a design value such as
   padding, colour or radius — those are fixed in the component file.

## Folder layout

```
entries/<slug>/
  entry.tsx            default export: defineEntry({...})      required
  component/           the proposed component, one or more files  required
    <name>.tsx
    <library-file>.tsx copy of a library component this proposal changes (optional)
  screenshots/         design images for this entry (optional)
```

`<slug>` is kebab-case, equals the folder name, and is the URL path. The stage discovers
`entries/*/entry.tsx` by itself; there is no registry to edit. `entry.tsx` may import from
`stage/define-entry` (and only that from the stage), from `component/`, and from the library.

## `defineEntry` fields

Types: `stage/types.ts` (the single definition). Import:
`import { defineEntry } from "../../stage/define-entry";`

| Field | Type | Meaning |
|---|---|---|
| `name` | `string` | Display name. |
| `slug` | `string` | Must equal the folder name. |
| `ticket` | `string \| null` | Tracker id, e.g. `"PROJ-123"`. |
| `brief` | `string \| null` | Brief path relative to the repo root, e.g. `"docs/briefs/1234.md"`. |
| `status` | `"draft" \| "settled"` | `settled` once the owner has agreed the proposal. |
| `designWidth` | `number` | Specimen frame width in px, from the design (e.g. `340`). |
| `background` | `"canvas" \| "light" \| "dark"` (optional) | Canvas colour behind the specimen. `canvas` = neutral grey `#e5e5e5` (default), `light` = white, the `--lab-canvas-white` custom property (see *The white canvas*), `dark` = `#161819`. Set it only when the design sits on that colour. |
| `screenshots` | `Screenshot[]` | Design images shown beside the specimen. See below. |
| `controls.props` | `Control[]` | **Component props**: the component's public API — variants, sizes, booleans the API accepts. |
| `controls.example` | `Control[]` | **Example content**: demo data only — which optional slots are filled, text lengths, item counts. |
| `render` | `(state) => ReactNode` | Renders the specimen for the current control state. |
| `usage` | `(state) => string` | The exact code a consumer writes for that state. Must change when the state changes. |
| `alternativeShape` | `string` (optional) | One line describing an alternative API shape. |
| `axisMap` | `AxisRow[]` | Figma → code table. |
| `examples` | `Example[]` | Named usages. |
| `parts` | `Part[]` | One row per part of the component. |
| `tokens` | `DesignToken[]` (optional) | Every design token the proposal uses, new or not. See below. |

`state` is typed from the controls: each control's `key` becomes a property; a `select` gives the
union of its `options`, `boolean` a `boolean`, `number` a `number`, `text` a `string`.

### `Control`

Every control has `key` (camelCase, `^[a-z][a-zA-Z0-9]*$`, unique across **both** groups),
`label`, `default`, optional `note`, optional `when`, and a `kind`:

| `kind` | Extra fields | Value |
|---|---|---|
| `"select"` | `options: string[]` | one of `options`; `default` must be one |
| `"boolean"` | — | `true` / `false` |
| `"number"` | `min`, `max` | integer in range |
| `"text"` | — | free string |

The page draws a `select` with 5 or fewer options as a row of radio buttons, and with more as a
dropdown. No field chooses this.

`when?: (state: ControlState) => boolean` — show the control only while this returns `true`. Use
it when a control means nothing in some state, e.g. a value that exists only with one value of
another control: `when: (s) => s.showLabel === true`. `state` holds every control value, typed
loosely (`string | number | boolean`), so compare with `===`. A hidden control keeps its value,
and its key stays in the URL. A `when` that throws counts as `true`.

Which group: if a consumer passes it as a prop (a variant, `size`, `disabled`, an optional slot's
presence when the API has a boolean for it), it is **Component props**. If it only decides what
demo content goes in (slot filled or empty, short or long text, 2 or 8 items), it is **Example
content**.

### `Screenshot`

```ts
{ label: string; src: string; figma?: string }       // an image
{ label: string; missing: string; figma?: string }   // a state with no image
```

`src` is a path **relative to the repo root**, e.g. `docs/briefs/1234/screenshots/<state-id>.png`
or `<lab>/entries/<slug>/screenshots/x.png`. The stage serves it from disk; never use a Figma
export URL (they expire). `missing` says why there is no image (e.g. `"hidden state — no
screenshot"`). `figma` is a node link or `<fileKey>:<nodeId>`.

### `AxisRow`

```ts
{ figma: string; code: string; kind: "variant" | "slot" | "children" | "example" | "dropped"; note?: string }
```

One row per Figma axis or boolean. `figma` names it with its values (`"Size = S · M"`); `code`
says what it became (`size: "sm" | "md"`, `items[n].icon`, or `"—"`).
`variant` = a prop value set · `slot` = an optional prop that takes content · `children` = content
passed as children · `example` = demo content only, no API · `dropped` = not carried into code
(say why in `note`).

### `Example`

```ts
{ name: string; source: { type: "figma"; ref: string } | { type: "created" }; note?: string;
  state: Partial<State> }                          // rendered with render(), code from usage()
{ name: string; source: …; note?: string;
  render: () => ReactNode; code: string }          // a composition the controls cannot express
```

Prefer the `state` form. A state example is merged over the control defaults; "Load into
specimen" sets the controls to it. A `render`/`code` example's "Show in specimen" shows its
`render()` in the stage and its `code` in the code area, and turns the controls off until "Back
to controls". `ref` is the Figma `<fileKey>:<nodeId>`. `created` = not in the design. Give every
example a unique `name`: the URL names a loaded example by it.

### `Part`

```ts
{ name: string; class: "new" | "reused"; uses?: string; note?: string; standIns?: StandIn[];
  locate?: string; show?: Partial<State>; hide?: Partial<State> }
{ name: string; class: "updated"; uses?: string; note?: string; standIns?: StandIn[];
  locate?: string; show?: Partial<State>; hide?: Partial<State>;
  before: () => ReactNode;   // the library component today, imported from the library
  after: () => ReactNode }   // the proposal, imported from component/
StandIn = { id: string; value: string; replaceWith: string }
```

`new` = does not exist in the library · `updated` = an existing library component this proposal
changes (its copy lives in `component/`) · `reused` = used unchanged. `uses` names the library
component and its path: `"Button — src/button.tsx"`. `StandIn.value` is the literal in the code,
written the way the styling system writes it (`PROJECT.md` → *Stand-in literals*);
`replaceWith` is the token, type step or icon that should replace it.

**Hover, Add and Remove.** For a part row to outline the part in the specimen on hover, set
`locate` to the `data-part` value on the part's root element in `component/` (hard rule 3).
- **Add**: also set `show`, the control values under which the part renders, e.g.
  `{ withIcon: true }`. The row offers Add while the part is not rendered.
- **Remove**: also set `hide`, the control values under which the part is not rendered, e.g.
  `{ withIcon: false }`. The row offers Remove while the part is rendered. Write `hide`
  explicitly; the page never derives it from `show`.
- A part with no `hide` is permanent: the root, and any part no control can take away, gets no
  Remove. A part with `hide` and no `show` can be removed but not put back from its row.
- Add and Remove apply their values like changing those controls by hand, and leave a loaded
  `render`/`code` example first.
- Removing a parent removes its children too; their rows then offer Add. So a child's `show`
  must include what its parent needs to render, e.g. `{ dataRows: 2, withBadge: true }`.

No `locate` → no hover, no Add, no Remove. `show` or `hide` without `locate` is a page error, and
so is a `show` or `hide` key that is not a control key.

### `DesignToken`

```ts
{ class: "new" | "updated" | "reused";
  figma: string;          // the Figma variable or style name, as the design names it
  code: string | null;    // the library's token or utility name; null while it has no name
  value: string;          // resolved value: "#1a1a1a", "12px", "14px / 20px / 400"
  before?: string;        // "updated" only, required there: the library's value today
  parts?: string[];       // Part.name of each part that uses it
  standIn?: string;       // StandIn.id that holds its place in the code today
  note?: string }
```

`new` = the token does not exist in the library (`code` is usually `null`) · `updated` = it
exists and this proposal changes its value · `reused` = it exists and is used as is. A type step
is a token like any other; give `value` as `size / line-height / weight`. A token with a
`standIn` shows that stand-in's literal ("in the code today"). Stand-ins that no token names are
listed under **Other stand-ins** (icons and other non-tokens). A `parts` name that is not a part,
or a `standIn` that is not a stand-in id, is a page error.

## Page and URL

The page fills the window and never scrolls; each region scrolls on its own.

- **Left**: the entry list. It collapses to a narrow strip.
- **Centre, top bar**: name, status, ticket, brief.
- **Centre, toolbar**: width (`designWidth` or full), background of the whole canvas (Grey =
  `canvas`, White = `light`, Dark = `dark`), Outline (a 1px outline on every element of the
  specimen), Design (a screenshot beside the specimen, with a picker when there are several).
- **Centre, stage**: one canvas colour, and the component directly on it. The specimen renders
  in a transparent iframe of route `/_specimen/<slug>?<query>`, with no padding: its viewport
  is exactly `designWidth` px, so the component gets the full design width and the library's
  breakpoints see it. The iframe is as tall as its content. At design width the stage marks
  the width with a small muted number above the component and two faint vertical guide lines
  at its edges, the full height of the stage; Full width shows neither. The stage scrolls when
  the content is taller or wider than it.
- **Centre, code**: the usage code for the current state, syntax-coloured, below a divider
  that drags. Copy copies plain text.
- **Right, inspector** (its left edge drags), tabs in this order:
  **Controls** (Component props, then Example content; changed controls are marked, with a
  per-control reset and Reset all) · **Parts** (one row per part; "n values are not real yet"
  opens Tokens) · **Examples** · **Tokens** (New, Updated, Reused, then Other stand-ins; without
  `tokens`, every stand-in is under Other stand-ins) · **Figma → code** (the axis map) ·
  **Design** (every screenshot, missing ones too). Only the inspector's tab content scrolls.

**Rule for the stage: nothing it draws on a canvas may look like part of the component** — no
border, fill, shadow or box around a render, in the stage, the Examples tab, the Parts tab or
the Design compare column. Renders in the inspector sit on a plain area of the current canvas
colour, at `designWidth` when the panel is wide enough. The only marks are the width number
and guides, the Outline tool when switched on, and the part highlight. So a border, card or
fill that you see is the component's own.

The one exception is the **part highlight**: while the pointer or keyboard focus is on a Parts
row with `locate`, every element with that `data-part` gets a 2px blue (`#0d99ff`) outline, and
nothing else: no label. It is drawn in a layer outside the component that takes no space
and no pointer events, and it disappears when the pointer leaves the row. The stage scrolls the
part into view.

URL: `<url>/<slug>?<key>=<value>&…` — every control key is always written, so a pasted URL is the
exact state. Booleans are `true`/`false`. Unknown or invalid values fall back to the control's
default. View keys start with `_`, are written only when not at their default, and are dropped
when the entry cannot show them:

| Key | Value | Meaning |
|---|---|---|
| `_full` | `1` | Specimen at full width instead of `designWidth`. |
| `_bg` | `canvas` \| `light` \| `dark` | Canvas colour, when it differs from the entry's `background` (default `canvas`). |
| `_outline` | `1` | Outline every element in the specimen. |
| `_design` | `1`…n | Screenshot n (1-based, in `screenshots` order) beside the specimen. |
| `_example` | example `name` | A `render`/`code` example is in the stage; the controls are off. |

Example, for the `demo` entry:
`<url>/demo?variant=outline&size=sm&showLabel=true&labelText=Details&count=4&textLength=short&withIcon=false&iconName=check&_design=1`

The inspector tab, panel width, divider position and sidebar state are browser preferences in
`localStorage` (`lab.panelTab`, `lab.panelWidth`, `lab.centreSplit`, `lab.sidebarCollapsed`),
never in the URL.

The page and the specimen iframe talk by `postMessage`, same origin only:
`lab-specimen-query` `{search}` and `lab-specimen-highlight` `{highlight: {part} | null}`
go down; `lab-specimen-ready`, `lab-specimen-size` `{height}`, `lab-specimen-parts`
`{parts: string[]}` (the `data-part` values rendered now) and `lab-specimen-located`
`{top, left, bottom, right}` come up.

### The white canvas

`light` paints the `--lab-canvas-white` custom property, `#ffffff` by default. A library whose
page surface is another colour sets the property in a stylesheet its wiring loads
(`PROJECT.md` → *White canvas*), never in `stage/`. The stage declares its default at zero
specificity, so any `:root` rule in a project stylesheet wins.

## Add, change, delete

- **Add**: create `entries/<slug>/` with `entry.tsx` and `component/`. It appears in the sidebar
  on reload.
- **Change**: edit the files; the page reloads. The URL keeps the control state; a control key you
  removed is dropped, a new one takes its default.
- **Delete**: remove the folder `entries/<slug>/`. Nothing else references it.

## Check before handing back

Run `PROJECT.md` → *Type-check command*, then, in the lab folder:

```
grep -rn "PROVISIONAL(" entries/<slug>/component
```

Then open the entry. A red box on the page means a problem in the entry data (slug mismatch,
duplicate key, bad default, unmatched stand-in) or a render that threw.
