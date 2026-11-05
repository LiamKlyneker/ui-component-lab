import type { ReactNode } from "react";

export type ControlState = Record<string, string | number | boolean>;

/**
 * The stage canvas: `canvas` = neutral grey, `light` = `--lab-canvas-white` (default `#ffffff`;
 * a project may set it from its wiring), `dark`.
 */
export type Background = "canvas" | "light" | "dark";

type ControlBase = {
  key: string;
  label: string;
  note?: string;
  /**
   * Show the control only while this returns true. A hidden control keeps its
   * value and stays in the URL. `state` is typed loosely: compare with `===`.
   */
  when?: (state: ControlState) => boolean;
};

export type SelectControl = ControlBase & {
  kind: "select";
  options: readonly string[];
  default: string;
};

export type BooleanControl = ControlBase & {
  kind: "boolean";
  default: boolean;
};

export type NumberControl = ControlBase & {
  kind: "number";
  min: number;
  max: number;
  default: number;
};

export type TextControl = ControlBase & {
  kind: "text";
  default: string;
};

export type Control =
  | SelectControl
  | BooleanControl
  | NumberControl
  | TextControl;

export type ControlValue<C extends Control> = C extends SelectControl
  ? C["options"][number]
  : C extends BooleanControl
    ? boolean
    : C extends NumberControl
      ? number
      : string;

/** The value of every control, keyed by `Control.key`. */
export type StateOf<C extends readonly Control[]> = {
  [K in C[number] as K["key"]]: ControlValue<K>;
};

export type Screenshot =
  | {
      label: string;
      /** Path relative to the repo root, e.g. `docs/briefs/1234/screenshots/x.png`. */
      src: string;
      /** Figma node link or `<fileKey>:<nodeId>`. */
      figma?: string;
    }
  | {
      label: string;
      /** Why there is no image, e.g. "hidden state — no screenshot". */
      missing: string;
      figma?: string;
    };

export type AxisKind = "variant" | "slot" | "children" | "example" | "dropped";

export type AxisRow = {
  /** The Figma axis or boolean, with its values: `Size = S · M`. */
  figma: string;
  /** What it became in code: `size: "sm" | "md"`, or `—` when dropped. */
  code: string;
  kind: AxisKind;
  note?: string;
};

export type ExampleSource = { type: "figma"; ref: string } | { type: "created" };

type ExampleBase = {
  name: string;
  source: ExampleSource;
  note?: string;
};

/** A state example renders through the entry's own `render` and `usage`. */
export type Example<S> =
  | (ExampleBase & { state: Partial<S> })
  | (ExampleBase & { render: () => ReactNode; code: string });

export type StandIn = {
  /** Same id as the `PROVISIONAL(<id>)` marker in the component file. */
  id: string;
  /** The literal the component uses today: `gap-[10px]`, `"10px"`. */
  value: string;
  /** What should replace it: a token, a type step, an icon. */
  replaceWith: string;
};

type PartBase<S> = {
  name: string;
  /** The library component this part uses, with its path: `Button — src/button.tsx`. */
  uses?: string;
  note?: string;
  standIns?: StandIn[];
  /** The `data-part` value on the part's root element; makes the row highlight it in the specimen. */
  locate?: string;
  /** Control values under which the part is rendered; gives the row an Add button when it is absent. */
  show?: Partial<S>;
  /** Control values under which the part is not rendered; gives the row a Remove button when it is present. */
  hide?: Partial<S>;
};

export type Part<S = ControlState> =
  | (PartBase<S> & { class: "new" })
  | (PartBase<S> & { class: "reused" })
  | (PartBase<S> & {
      class: "updated";
      /** The library component as it is today, imported from the library. */
      before: () => ReactNode;
      /** The proposal, imported from the entry's `component/` copy. */
      after: () => ReactNode;
    });

/** One design token the proposal touches. Shown in the Tokens tab. */
export type DesignToken = {
  /** `new` = not in the library yet · `updated` = exists, value changes · `reused` = used as is. */
  class: "new" | "updated" | "reused";
  /** The Figma variable or style name, as the design names it. */
  figma: string;
  /** The library's token or utility name; `null` while it has no name yet. */
  code: string | null;
  /** The resolved value: `#1a1a1a`, `12px`, `14px / 20px / 400`. */
  value: string;
  /** `updated` only: the value the library has today. */
  before?: string;
  /** Names of the parts that use it; each must equal a `Part.name`. */
  parts?: string[];
  /** Id of the `StandIn` that holds its place in the component code today. */
  standIn?: string;
  note?: string;
};

export type EntryDefinition<
  P extends readonly Control[],
  E extends readonly Control[],
> = {
  name: string;
  /** Must equal the entry's folder name. */
  slug: string;
  ticket: string | null;
  /** Path relative to the repo root: `docs/briefs/1234.md`. */
  brief: string | null;
  status: "draft" | "settled";
  /** Specimen frame width in px. */
  designWidth: number;
  /** Canvas colour behind the specimen. Default `canvas`. */
  background?: Background;
  screenshots: Screenshot[];
  controls: {
    /** The component's public API. */
    props: P;
    /** Demo content only: filled slots, text lengths, item counts. */
    example: E;
  };
  render: (state: StateOf<P> & StateOf<E>) => ReactNode;
  usage: (state: StateOf<P> & StateOf<E>) => string;
  alternativeShape?: string;
  axisMap: AxisRow[];
  examples: Example<StateOf<P> & StateOf<E>>[];
  parts: Part<StateOf<P> & StateOf<E>>[];
  tokens?: DesignToken[];
};

/** The type-erased entry the stage works with. */
export type LabEntry = Omit<
  EntryDefinition<Control[], Control[]>,
  "render" | "usage" | "examples" | "parts"
> & {
  render: (state: ControlState) => ReactNode;
  usage: (state: ControlState) => string;
  examples: Example<ControlState>[];
  parts: Part<ControlState>[];
};
