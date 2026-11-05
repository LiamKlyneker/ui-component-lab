import type { Control, ControlState, LabEntry } from "./types";

const entryModules = import.meta.glob<{ default: LabEntry }>(
  "../entries/*/entry.tsx",
);

const componentSources = import.meta.glob<string>(
  "../entries/*/component/**/*.{ts,tsx}",
  { query: "?raw", import: "default" },
);

/** A path inside the lab folder, written from the repo root. */
export const labPath = (inLab: string): string => (__LAB_DIR__ ? `${__LAB_DIR__}/${inLab}` : inLab);

const slugOf = (modulePath: string): string => modulePath.split("/")[2];

export const entrySlugs: string[] = Object.keys(entryModules)
  .map(slugOf)
  .sort();

export async function loadEntry(slug: string): Promise<LabEntry> {
  const load = entryModules[`../entries/${slug}/entry.tsx`];
  if (!load) throw new Error(`No entry folder "${slug}".`);
  const mod = await load();
  if (!mod.default) throw new Error(`entry.tsx in "${slug}" has no default export.`);
  return mod.default;
}

export type Marker = { id: string; text: string; file: string; line: number };

const MARKER = /PROVISIONAL\(([^)]+)\):\s*(.*)$/;

export async function loadMarkers(slug: string): Promise<Marker[]> {
  const prefix = `../entries/${slug}/component/`;
  const files = Object.keys(componentSources).filter((p) => p.startsWith(prefix));
  const markers: Marker[] = [];
  for (const file of files) {
    const source = await componentSources[file]();
    source.split("\n").forEach((lineText, index) => {
      const match = MARKER.exec(lineText);
      if (match) {
        markers.push({
          id: match[1].trim(),
          text: match[2].trim(),
          file: labPath(`entries/${slug}/component/${file.slice(prefix.length)}`),
          line: index + 1,
        });
      }
    });
  }
  return markers;
}

export function allControls(entry: LabEntry): Control[] {
  return [...entry.controls.props, ...entry.controls.example];
}

export function defaultState(entry: LabEntry): ControlState {
  return Object.fromEntries(allControls(entry).map((c) => [c.key, c.default]));
}

const KEY_PATTERN = /^[a-z][a-zA-Z0-9]*$/;

/** Problems in the entry data itself; shown on the page, never thrown. */
export function validateEntry(entry: LabEntry, folder: string): string[] {
  const problems: string[] = [];
  if (entry.slug !== folder) {
    problems.push(`slug "${entry.slug}" does not match folder "${folder}".`);
  }
  const seen = new Set<string>();
  for (const control of allControls(entry)) {
    if (!KEY_PATTERN.test(control.key)) {
      problems.push(`control key "${control.key}" must match ${KEY_PATTERN}.`);
    }
    if (seen.has(control.key)) {
      problems.push(`control key "${control.key}" is used twice.`);
    }
    seen.add(control.key);
    if (control.kind === "select" && !control.options.includes(control.default)) {
      problems.push(`control "${control.key}": default "${control.default}" is not an option.`);
    }
    if (control.kind === "number" && (control.default < control.min || control.default > control.max)) {
      problems.push(`control "${control.key}": default is outside min/max.`);
    }
  }
  const standInIds = entry.parts.flatMap((p) => (p.standIns ?? []).map((s) => s.id));
  const duplicate = standInIds.find((id, i) => standInIds.indexOf(id) !== i);
  if (duplicate) problems.push(`stand-in id "${duplicate}" is used twice.`);
  const controlKeys = new Set(allControls(entry).map((c) => c.key));
  const partNames = new Set(entry.parts.map((p) => p.name));
  for (const part of entry.parts) {
    for (const [field, patch] of [["show", part.show], ["hide", part.hide]] as const) {
      for (const key of Object.keys(patch ?? {})) {
        if (!controlKeys.has(key)) problems.push(`part "${part.name}": ${field}.${key} is not a control key.`);
      }
      if (patch && !part.locate) {
        problems.push(
          `part "${part.name}": ${field} needs locate, or the ${field === "show" ? "Add" : "Remove"} button cannot appear.`,
        );
      }
    }
  }
  for (const token of entry.tokens ?? []) {
    for (const name of token.parts ?? []) {
      if (!partNames.has(name)) problems.push(`token "${token.figma}": part "${name}" is not a part name.`);
    }
    if (token.standIn !== undefined && !standInIds.includes(token.standIn)) {
      problems.push(`token "${token.figma}": standIn "${token.standIn}" is not in any part's standIns.`);
    }
    if (token.class === "updated" && token.before === undefined) {
      problems.push(`token "${token.figma}": class "updated" needs before.`);
    }
  }
  const exampleNames = entry.examples.map((e) => e.name);
  const duplicateExample = exampleNames.find((name, i) => exampleNames.indexOf(name) !== i);
  if (duplicateExample !== undefined) {
    problems.push(`example name "${duplicateExample}" is used twice; the URL names examples by it.`);
  }
  return problems;
}
