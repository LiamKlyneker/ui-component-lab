import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { allControls, loadEntry } from "./registry";
import type { ControlState, LabEntry } from "./types";
import { parseState, parseView, type ViewState } from "./url-state";
import { Guarded } from "./widgets";

/**
 * The specimen renders in an iframe at the design width, so the library's
 * viewport breakpoints see that width. The frame is a second route of this app:
 * `/_specimen/<slug>?<the entry page's query>`. The entry page posts every new
 * query to it; the frame posts its content height and its `data-part` values
 * back, draws the part highlight the parent asks for, and never navigates.
 */
export const SPECIMEN_PREFIX = "/_specimen/";

const MSG_QUERY = "lab-specimen-query";
const MSG_READY = "lab-specimen-ready";
const MSG_SIZE = "lab-specimen-size";
const MSG_PARTS = "lab-specimen-parts";
const MSG_HIGHLIGHT = "lab-specimen-highlight";
const MSG_LOCATED = "lab-specimen-located";

type QueryMessage = { type: typeof MSG_QUERY; search: string };
type SizeMessage = { type: typeof MSG_SIZE; height: number };
type PartsMessage = { type: typeof MSG_PARTS; parts: string[] };
type HighlightMessage = { type: typeof MSG_HIGHLIGHT; highlight: Highlight | null };
type LocatedMessage = { type: typeof MSG_LOCATED; top: number; left: number; bottom: number; right: number };

/** A part to outline in the specimen, by its `data-part` value. */
export type Highlight = { part: string };

/** What the specimen shows for a state and view: the loaded example, else `render(state)`. */
export function renderSpecimen(entry: LabEntry, state: ControlState, view: ViewState): ReactNode {
  if (view.example !== null) {
    const example = entry.examples.find((e) => e.name === view.example);
    if (example && "render" in example) return example.render();
  }
  return entry.render(state);
}

export function SpecimenFrame(props: {
  slug: string;
  search: string;
  title: string;
  width: number | null;
  highlight: Highlight | null;
  onParts: (parts: string[]) => void;
}): JSX.Element {
  const frame = useRef<HTMLIFrameElement>(null);
  const [initialSrc] = useState(() => `${SPECIMEN_PREFIX}${props.slug}${props.search}`);
  const [height, setHeight] = useState(0);
  const latest = useRef(props);
  latest.current = props;

  const send = (message: QueryMessage | HighlightMessage): void => {
    frame.current?.contentWindow?.postMessage(message, window.location.origin);
  };
  const post = (): void => send({ type: MSG_QUERY, search: latest.current.search });
  const postHighlight = (): void =>
    send({ type: MSG_HIGHLIGHT, highlight: latest.current.highlight });

  useEffect(post, [props.search]);
  useEffect(postHighlight, [props.highlight?.part]);

  useEffect(() => {
    const onMessage = (event: MessageEvent): void => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frame.current?.contentWindow) return;
      const data = event.data as Record<string, unknown> | null;
      if (data?.type === MSG_READY) {
        post();
        postHighlight();
      }
      if (data?.type === MSG_SIZE && typeof data.height === "number") {
        setHeight(Math.max(0, Math.ceil(data.height)));
      }
      if (data?.type === MSG_PARTS && Array.isArray(data.parts)) {
        latest.current.onParts(data.parts.filter((p): p is string => typeof p === "string"));
      }
      if (data?.type === MSG_LOCATED && frame.current) {
        scrollStageTo(frame.current, data as unknown as LocatedMessage);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={frame}
      title={props.title}
      className="lab-specimen-frame"
      src={initialSrc}
      style={{ width: props.width ?? "100%", height }}
    />
  );
}

/** Scrolls the stage around the iframe so a rect given in iframe coordinates is in view. */
function scrollStageTo(frame: HTMLIFrameElement, rect: LocatedMessage): void {
  const stage = frame.closest<HTMLElement>(".lab-stage");
  if (!stage) return;
  const f = frame.getBoundingClientRect();
  const s = stage.getBoundingClientRect();
  const margin = 24;
  const axis = (start: number, end: number, viewStart: number, viewEnd: number): number => {
    if (start < viewStart) return start - viewStart - margin;
    if (end > viewEnd) return Math.min(end - viewEnd + margin, start - viewStart - margin);
    return 0;
  };
  const dy = axis(f.top + rect.top, f.top + rect.bottom, s.top, s.bottom);
  const dx = axis(f.left + rect.left, f.left + rect.right, s.left, s.right);
  if (dx !== 0 || dy !== 0) stage.scrollBy({ top: dy, left: dx, behavior: "smooth" });
}

type Loaded =
  | { status: "loading" }
  | { status: "ok"; entry: LabEntry }
  | { status: "error"; message: string };

/** The whole document inside the specimen iframe. */
export function SpecimenDocument(props: { slug: string }): JSX.Element {
  const [search, setSearch] = useState(() => window.location.search);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadEntry(props.slug).then(
      (entry) => !cancelled && setLoaded({ status: "ok", entry }),
      (error: unknown) =>
        !cancelled &&
        setLoaded({ status: "error", message: error instanceof Error ? error.message : String(error) }),
    );
    return () => {
      cancelled = true;
    };
  }, [props.slug]);

  useEffect(() => {
    const onMessage = (event: MessageEvent): void => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      const data = event.data as Record<string, unknown> | null;
      if (data?.type === MSG_QUERY && typeof data.search === "string") setSearch(data.search);
      if (data?.type === MSG_HIGHLIGHT) {
        const h = data.highlight as Partial<Highlight> | null;
        setHighlight(h && typeof h.part === "string" ? { part: h.part } : null);
      }
    };
    window.addEventListener("message", onMessage);
    // The parent may have changed the query while this document was loading.
    window.parent.postMessage({ type: MSG_READY }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useReportHeight();
  useReportParts();
  useHighlightOverlay(highlight);

  if (loaded.status === "loading") return <></>;
  if (loaded.status === "error") {
    return (
      <div className="lab-ui lab-problem">
        <strong>{props.slug}/entry.tsx failed to load.</strong>
        <pre className="lab-pre">{loaded.message}</pre>
      </div>
    );
  }
  return <SpecimenBody entry={loaded.entry} search={search} />;
}

/** Posts the content height of `#lab-root` to the parent whenever it changes. */
function useReportHeight(): void {
  useEffect(() => {
    const root = document.getElementById("lab-root");
    if (!root || window.parent === window) return;
    let last = -1;
    const report = (): void => {
      // `scrollHeight`, not the document's: the document is as tall as the iframe the parent sized.
      const height = root.scrollHeight;
      if (height === last) return;
      last = height;
      const message: SizeMessage = { type: MSG_SIZE, height };
      window.parent.postMessage(message, window.location.origin);
    };
    const observer = new ResizeObserver(report);
    observer.observe(root);
    const mutations = new MutationObserver(report);
    mutations.observe(root, { childList: true, subtree: true, attributes: true, characterData: true });
    report();
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);
}

function partsInDom(root: HTMLElement): string[] {
  const names = new Set<string>();
  root.querySelectorAll<HTMLElement>("[data-part]").forEach((el) => {
    if (el.dataset.part) names.add(el.dataset.part);
  });
  return [...names].sort();
}

/** Posts the sorted `data-part` values present under `#lab-root` whenever they change. */
function useReportParts(): void {
  useEffect(() => {
    const root = document.getElementById("lab-root");
    if (!root || window.parent === window) return;
    let last: string | null = null;
    const report = (): void => {
      const parts = partsInDom(root);
      const key = parts.join("\n");
      if (key === last) return;
      last = key;
      const message: PartsMessage = { type: MSG_PARTS, parts };
      window.parent.postMessage(message, window.location.origin);
    };
    const observer = new MutationObserver(report);
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-part"] });
    report();
    return () => observer.disconnect();
  }, []);
}

/** The element's box; for a box-less element (`display: contents`) the union of its children's. */
function boxOf(el: Element): DOMRect | null {
  const r = el.getBoundingClientRect();
  if (r.width > 0 || r.height > 0) return r;
  const boxes = [...el.children].map(boxOf).filter((b): b is DOMRect => b !== null);
  if (boxes.length === 0) return null;
  const top = Math.min(...boxes.map((b) => b.top));
  const left = Math.min(...boxes.map((b) => b.left));
  const bottom = Math.max(...boxes.map((b) => b.bottom));
  const right = Math.max(...boxes.map((b) => b.right));
  return new DOMRect(left, top, right - left, bottom - top);
}

/**
 * Draws the highlight in a fixed layer outside `#lab-root`: it takes no layout
 * space, no pointer events, and does not change the height the parent measures.
 */
function useHighlightOverlay(highlight: Highlight | null): void {
  useEffect(() => {
    const root = document.getElementById("lab-root");
    if (!highlight || !root) return;
    const layer = document.createElement("div");
    layer.className = "lab-highlight-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
    let located = false;

    const draw = (): void => {
      const selector = `[data-part="${CSS.escape(highlight.part)}"]`;
      const boxes = [...root.querySelectorAll(selector)]
        .map(boxOf)
        .filter((b): b is DOMRect => b !== null);
      layer.replaceChildren(
        ...boxes.map((b) => {
          const box = document.createElement("div");
          box.className = "lab-highlight-box";
          Object.assign(box.style, {
            top: `${b.top}px`,
            left: `${b.left}px`,
            width: `${b.width}px`,
            height: `${b.height}px`,
          });
          return box;
        }),
      );
      if (boxes.length === 0) return;
      if (!located) {
        located = true;
        const message: LocatedMessage = {
          type: MSG_LOCATED,
          top: Math.min(...boxes.map((b) => b.top)),
          left: Math.min(...boxes.map((b) => b.left)),
          bottom: Math.max(...boxes.map((b) => b.bottom)),
          right: Math.max(...boxes.map((b) => b.right)),
        };
        window.parent.postMessage(message, window.location.origin);
      }
    };

    let frame = 0;
    const schedule = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    const mutations = new MutationObserver(schedule);
    mutations.observe(root, { childList: true, subtree: true, attributes: true, characterData: true });
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    draw();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutations.disconnect();
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      layer.remove();
    };
  }, [highlight?.part]);
}

function SpecimenBody(props: { entry: LabEntry; search: string }): JSX.Element {
  const { entry, search } = props;
  const controls = useMemo(() => allControls(entry), [entry]);
  const state = useMemo(() => parseState(search, controls), [search, controls]);
  const view = useMemo(() => parseView(search, entry), [search, entry]);

  useEffect(() => {
    document.documentElement.classList.toggle("lab-specimen-doc--outline", view.outline);
  }, [view.outline]);

  return (
    <Guarded
      resetKey={`${JSON.stringify(state)}|${view.example ?? ""}`}
      render={() => renderSpecimen(entry, state, view)}
    />
  );
}
