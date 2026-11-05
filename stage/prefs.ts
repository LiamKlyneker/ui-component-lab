import { useCallback, useState } from "react";

/** Stage preferences in `localStorage`. Not page state: never in the URL. */
export const PREF_KEYS = {
  panelTab: "lab.panelTab",
  panelWidth: "lab.panelWidth",
  centreSplit: "lab.centreSplit",
  sidebarCollapsed: "lab.sidebarCollapsed",
} as const;

function read<T>(key: string, fallback: T, valid: (value: unknown) => value is T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const value: unknown = JSON.parse(raw);
    return valid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked or full: the preference lasts for this page only.
  }
}

/** Like `useState`, remembered across reloads when storage is available. */
export function usePref<T>(
  key: string,
  fallback: T,
  valid: (value: unknown) => value is T,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => read(key, fallback, valid));
  const set = useCallback(
    (next: T) => {
      setValue(next);
      write(key, next);
    },
    [key],
  );
  return [value, set];
}

export const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

export const isOneOf =
  <T extends string>(options: readonly T[]) =>
  (value: unknown): value is T =>
    typeof value === "string" && (options as readonly string[]).includes(value);
