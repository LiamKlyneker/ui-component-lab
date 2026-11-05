import type { Background, Control, ControlState, LabEntry } from "./types";

/** What the stage shows, as opposed to the control state. Written as `_`-prefixed keys. */
export type ViewState = {
  fullWidth: boolean;
  /** `null` = the entry's own `background`. */
  background: Background | null;
  outline: boolean;
  /** Index into `entry.screenshots` shown beside the specimen; `null` = off. */
  design: number | null;
  /** Name of a `render`/`code` example shown instead of the controls; `null` = controls. */
  example: string | null;
};

export const DEFAULT_VIEW: ViewState = {
  fullWidth: false,
  background: null,
  outline: false,
  design: null,
  example: null,
};

export const VIEW_KEYS = {
  fullWidth: "_full",
  background: "_bg",
  outline: "_outline",
  design: "_design",
  example: "_example",
} as const;

function parseValue(control: Control, raw: string | null): string | number | boolean {
  if (raw === null) return control.default;
  switch (control.kind) {
    case "select":
      return control.options.includes(raw) ? raw : control.default;
    case "boolean":
      if (raw === "true") return true;
      if (raw === "false") return false;
      return control.default;
    case "number": {
      const n = Number.parseInt(raw, 10);
      if (Number.isNaN(n)) return control.default;
      return Math.min(control.max, Math.max(control.min, n));
    }
    case "text":
      return raw;
  }
}

export function parseState(search: string, controls: Control[]): ControlState {
  const params = new URLSearchParams(search);
  return Object.fromEntries(controls.map((c) => [c.key, parseValue(c, params.get(c.key))]));
}

const BACKGROUNDS: readonly Background[] = ["canvas", "light", "dark"];

const isBackground = (value: string | null): value is Background =>
  value !== null && (BACKGROUNDS as readonly string[]).includes(value);

export const entryBackgroundOf = (entry: LabEntry): Background => entry.background ?? "canvas";

/** Reads the view keys and drops any value the entry cannot show. */
export function parseView(search: string, entry: LabEntry): ViewState {
  const params = new URLSearchParams(search);
  const bg = params.get(VIEW_KEYS.background);
  const design = Number.parseInt(params.get(VIEW_KEYS.design) ?? "", 10);
  const example = params.get(VIEW_KEYS.example);
  const entryBackground = entryBackgroundOf(entry);
  return {
    fullWidth: params.get(VIEW_KEYS.fullWidth) === "1",
    background: isBackground(bg) && bg !== entryBackground ? bg : null,
    outline: params.get(VIEW_KEYS.outline) === "1",
    // `_design` is 1-based in the URL.
    design: design >= 1 && design <= entry.screenshots.length ? design - 1 : null,
    example:
      example !== null && entry.examples.some((e) => e.name === example && "render" in e)
        ? example
        : null,
  };
}

/** Every control is written, defaults included, so a pasted URL is unambiguous. */
export function buildUrl(
  slug: string,
  controls: Control[],
  state: ControlState,
  view: ViewState = DEFAULT_VIEW,
): string {
  const params = new URLSearchParams();
  for (const control of controls) params.set(control.key, String(state[control.key]));
  if (view.fullWidth) params.set(VIEW_KEYS.fullWidth, "1");
  if (view.background) params.set(VIEW_KEYS.background, view.background);
  if (view.outline) params.set(VIEW_KEYS.outline, "1");
  if (view.design !== null) params.set(VIEW_KEYS.design, String(view.design + 1));
  if (view.example !== null) params.set(VIEW_KEYS.example, view.example);
  const query = params.toString();
  return `/${slug}${query ? `?${query}` : ""}`;
}
