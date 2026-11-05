import { useEffect, useState } from "react";

import { EntryPage } from "./entry-page";
import { navigate, useLocation } from "./navigation";
import { isBoolean, PREF_KEYS, usePref } from "./prefs";
import { entrySlugs, labPath, loadEntry } from "./registry";
import type { LabEntry } from "./types";

type Loaded =
  | { status: "loading" }
  | { status: "ok"; entry: LabEntry }
  | { status: "error"; message: string };

function useEntries(): Record<string, Loaded> {
  const [entries, setEntries] = useState<Record<string, Loaded>>(() =>
    Object.fromEntries(entrySlugs.map((slug) => [slug, { status: "loading" }])),
  );
  useEffect(() => {
    let cancelled = false;
    for (const slug of entrySlugs) {
      loadEntry(slug).then(
        (entry) => {
          if (!cancelled) setEntries((prev) => ({ ...prev, [slug]: { status: "ok", entry } }));
        },
        (error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          if (!cancelled) setEntries((prev) => ({ ...prev, [slug]: { status: "error", message } }));
        },
      );
    }
    return () => {
      cancelled = true;
    };
  }, []);
  return entries;
}

export function App(): JSX.Element {
  const location = useLocation();
  const entries = useEntries();
  const slug = decodeURIComponent(location.path.replace(/^\/+|\/+$/g, ""));
  const current = slug ? entries[slug] : undefined;
  const [collapsed, setCollapsed] = usePref(PREF_KEYS.sidebarCollapsed, false, isBoolean);

  return (
    <div className={`lab-app${collapsed ? " lab-app--collapsed" : ""}`}>
      <nav className="lab-ui lab-sidebar" aria-label="Entries">
        <div className="lab-sidebar-head">
          {collapsed ? null : (
            <a
              className="lab-brand"
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
              }}
            >
              Lab
            </a>
          )}
          <button
            type="button"
            className="lab-icon-button"
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Show entries" : "Hide entries"}
            title={collapsed ? "Show entries" : "Hide entries"}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>
        {collapsed ? null : entrySlugs.length === 0 ? (
          <p className="lab-muted">No entries in {labPath("entries/")}.</p>
        ) : (
          <ul className="lab-nav">
            {entrySlugs.map((s) => {
              const loaded = entries[s];
              return (
                <li key={s}>
                  <a
                    href={`/${s}`}
                    className={s === slug ? "lab-nav-link lab-nav-link--active" : "lab-nav-link"}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/${s}`);
                    }}
                  >
                    <span>{loaded.status === "ok" ? loaded.entry.name : s}</span>
                    {loaded.status === "ok" ? (
                      <span className={`lab-badge lab-badge--${loaded.entry.status}`}>
                        {loaded.entry.status}
                      </span>
                    ) : null}
                    {loaded.status === "error" ? (
                      <span className="lab-badge lab-badge--error">error</span>
                    ) : null}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
      <main className={`lab-main${current?.status === "ok" ? " lab-main--entry" : ""}`}>
        {!slug ? (
          <div className="lab-ui lab-empty">
            <h1 className="lab-h1">UI component lab</h1>
            <p className="lab-muted">
              Pick an entry. Entries live in <code>{labPath("entries/<slug>/entry.tsx")}</code>; the
              contract is <code>{labPath("GUIDE.md")}</code>.
            </p>
          </div>
        ) : null}
        {slug && !current ? (
          <div className="lab-ui lab-empty">
            <h1 className="lab-h1">No entry “{slug}”</h1>
            <p className="lab-muted">
              There is no folder <code>{labPath(`entries/${slug}/`)}</code> with an <code>entry.tsx</code>.
            </p>
          </div>
        ) : null}
        {current?.status === "loading" ? <p className="lab-ui lab-muted">Loading…</p> : null}
        {current?.status === "error" ? (
          <div className="lab-ui lab-problem">
            <strong>{slug}/entry.tsx failed to load.</strong>
            <pre className="lab-pre">{current.message}</pre>
          </div>
        ) : null}
        {current?.status === "ok" ? (
          <EntryPage key={slug} entry={current.entry} folder={slug} search={location.search} />
        ) : null}
      </main>
    </div>
  );
}
