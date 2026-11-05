import type { Control, EntryDefinition, LabEntry } from "./types";

/**
 * Types an entry against its own controls: `render`, `usage` and example
 * states see the exact keys and option values declared in `controls`.
 */
export function defineEntry<
  const P extends readonly Control[],
  const E extends readonly Control[],
>(entry: EntryDefinition<P, E>): LabEntry {
  return entry as unknown as LabEntry;
}
