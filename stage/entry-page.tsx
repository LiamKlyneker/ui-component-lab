import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { navigate } from "./navigation";
import {
  AxisPanel,
  DesignPanel,
  ExamplesPanel,
  PartsPanel,
  safeUsage,
  ScreenshotFigure,
  TokensPanel,
} from "./panels";
import { isNumber, isOneOf, PREF_KEYS, usePref } from "./prefs";
import { allControls, defaultState, validateEntry } from "./registry";
import { SpecimenFrame, type Highlight } from "./specimen";
import type { Background, ControlState, LabEntry } from "./types";
import { buildUrl, entryBackgroundOf, parseState, parseView, type ViewState } from "./url-state";
import { CodeBlock, ControlGroup, Segmented, Splitter } from "./widgets";

const TABS = [
  { id: "controls", label: "Controls" },
  { id: "parts", label: "Parts" },
  { id: "examples", label: "Examples" },
  { id: "tokens", label: "Tokens" },
  { id: "axis", label: "Figma → code" },
  { id: "design", label: "Design" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PANEL_MIN = 320;
const PANEL_DEFAULT = 420;
const SPLIT_MIN = 0.15;
const SPLIT_MAX = 0.85;
const SPLIT_DEFAULT = 0.62;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

function useWindowWidth(): number {
  const [width, setWidth] = useState(() =>
    typeof window === "undefined" ? 1440 : window.innerWidth,
  );
  useEffect(() => {
    const onResize = (): void => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

export function EntryPage(props: {
  entry: LabEntry;
  folder: string;
  search: string;
}): JSX.Element {
  const { entry, folder, search } = props;
  const controls = useMemo(() => allControls(entry), [entry]);
  const defaults = useMemo(() => defaultState(entry), [entry]);
  const state = useMemo(() => parseState(search, controls), [search, controls]);
  const view = useMemo(() => parseView(search, entry), [search, entry]);
  const problems = useMemo(() => validateEntry(entry, folder), [entry, folder]);
  const entryBackground = entryBackgroundOf(entry);
  const background = view.background ?? entryBackground;
  const loadedExample =
    view.example === null ? null : (entry.examples.find((e) => e.name === view.example) ?? null);

  const canonicalUrl = buildUrl(folder, controls, state, view);
  const queryStart = canonicalUrl.indexOf("?");
  const canonicalSearch = queryStart === -1 ? "" : canonicalUrl.slice(queryStart);
  useEffect(() => {
    if (`${window.location.pathname}${window.location.search}` !== canonicalUrl) {
      navigate(canonicalUrl, { replace: true });
    }
  }, [canonicalUrl]);

  const update = (nextState: ControlState, nextView: ViewState = view): void => {
    navigate(buildUrl(folder, controls, nextState, nextView), { replace: true });
  };
  const setView = (patch: Partial<ViewState>): void => update(state, { ...view, ...patch });
  const setControl = (key: string, value: string | number | boolean): void =>
    update({ ...state, [key]: value });

  const [tab, setTab] = usePref<TabId>(
    PREF_KEYS.panelTab,
    "controls",
    isOneOf(TABS.map((t) => t.id)),
  );
  const windowWidth = useWindowWidth();
  const panelMax = Math.max(PANEL_MIN, Math.floor(windowWidth * 0.5));
  const [storedPanelWidth, setPanelWidth] = usePref(PREF_KEYS.panelWidth, PANEL_DEFAULT, isNumber);
  const panelWidth = clamp(storedPanelWidth, PANEL_MIN, panelMax);
  const [storedSplit, setSplit] = usePref(PREF_KEYS.centreSplit, SPLIT_DEFAULT, isNumber);
  const split = clamp(storedSplit, SPLIT_MIN, SPLIT_MAX);
  const splitArea = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [presentParts, setPresentParts] = useState<string[] | null>(null);

  const code = loadedExample && "code" in loadedExample ? loadedExample.code : safeUsage(entry, state);
  const changedCount = controls.filter((c) => state[c.key] !== c.default).length;
  const shot = view.design === null ? null : entry.screenshots[view.design];

  return (
    <div
      className="lab-entry"
      style={{ gridTemplateColumns: `minmax(0, 1fr) ${panelWidth}px` }}
    >
      <section className="lab-centre" aria-label="Stage">
        <header className="lab-ui lab-topbar">
          <h1 className="lab-topbar-name">{entry.name}</h1>
          <span className={`lab-badge lab-badge--${entry.status}`}>{entry.status}</span>
          <span className="lab-topbar-meta">
            {entry.ticket ? <span>ticket {entry.ticket}</span> : <span>no ticket</span>}
            {entry.brief ? <code title="Brief">{entry.brief}</code> : null}
          </span>
        </header>
        {problems.length > 0 ? (
          <ul className="lab-ui lab-problem lab-problem--bar">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : null}

        <div className="lab-ui lab-toolbar" role="toolbar" aria-label="View">
          <span className="lab-toolbar-group">
            <span className="lab-toolbar-label" id="lab-view-width">Width</span>
            <Segmented
              name="lab-view-width"
              labelledBy="lab-view-width"
              value={view.fullWidth ? "full" : "design"}
              options={[
                { value: "design", label: `${entry.designWidth}px`, title: "Design width" },
                { value: "full", label: "Full" },
              ]}
              onChange={(v) => setView({ fullWidth: v === "full" })}
            />
          </span>
          <span className="lab-toolbar-group">
            <span className="lab-toolbar-label" id="lab-view-bg">Background</span>
            <Segmented<Background>
              name="lab-view-bg"
              labelledBy="lab-view-bg"
              value={background}
              options={[
                { value: "canvas", label: "Grey", title: "Neutral canvas grey" },
                { value: "light", label: "White", title: "--lab-canvas-white" },
                { value: "dark", label: "Dark" },
              ]}
              onChange={(v) => setView({ background: v === entryBackground ? null : v })}
            />
          </span>
          <button
            type="button"
            className="lab-button lab-button--small"
            aria-pressed={view.outline}
            title="A 1px outline on every element inside the specimen"
            onClick={() => setView({ outline: !view.outline })}
          >
            Outline
          </button>
          {entry.screenshots.length > 0 ? (
            <span className="lab-toolbar-group">
              <button
                type="button"
                className="lab-button lab-button--small"
                aria-pressed={view.design !== null}
                title="Show a design screenshot beside the specimen"
                onClick={() => setView({ design: view.design === null ? 0 : null })}
              >
                Design
              </button>
              {view.design !== null && entry.screenshots.length > 1 ? (
                <select
                  className="lab-input lab-input--small"
                  aria-label="Screenshot beside the specimen"
                  value={view.design}
                  onChange={(e) => setView({ design: Number(e.target.value) })}
                >
                  {entry.screenshots.map((s, i) => (
                    <option key={`${i}-${s.label}`} value={i}>
                      {s.label}
                    </option>
                  ))}
                </select>
              ) : null}
            </span>
          ) : null}
        </div>

        {loadedExample ? (
          <div className="lab-ui lab-banner" role="status">
            <span>
              Showing example: <strong>{loadedExample.name}</strong> — controls are inactive
            </span>
            <button
              type="button"
              className="lab-button lab-button--small"
              onClick={() => setView({ example: null })}
            >
              Back to controls
            </button>
          </div>
        ) : null}

        <div
          ref={splitArea}
          className="lab-split"
          style={{ gridTemplateRows: `minmax(0, ${split}fr) auto minmax(0, ${1 - split}fr)` }}
        >
          <div
            className={`lab-stage lab-canvas--${background}`}
            role="region"
            aria-label="Specimen"
          >
            <div className={`lab-stage-inner${shot ? " lab-stage-inner--compare" : ""}`}>
              <div
                className={`lab-frame-column${view.fullWidth ? " lab-frame-column--full" : ""}`}
                style={view.fullWidth ? undefined : { width: entry.designWidth }}
              >
                {view.fullWidth ? null : (
                  <span className="lab-ui lab-frame-width" title="Design width in px">
                    {entry.designWidth}
                  </span>
                )}
                <SpecimenFrame
                  slug={folder}
                  search={canonicalSearch}
                  title={`${entry.name} specimen`}
                  width={view.fullWidth ? null : entry.designWidth}
                  highlight={highlight}
                  onParts={setPresentParts}
                />
              </div>
              {shot ? (
                <div className="lab-stage-shot">
                  <ScreenshotFigure shot={shot} />
                </div>
              ) : null}
            </div>
          </div>
          <Splitter
            orientation="horizontal"
            label="Resize specimen and code"
            onDrag={(_, y) => {
              const rect = splitArea.current?.getBoundingClientRect();
              if (rect && rect.height > 0) {
                setSplit(clamp((y - rect.top) / rect.height, SPLIT_MIN, SPLIT_MAX));
              }
            }}
            onStep={(d) => setSplit(clamp(split + d * 0.05, SPLIT_MIN, SPLIT_MAX))}
          />
          <div className="lab-code-area" role="region" aria-label="Code">
            <CodeBlock
              fill
              code={code}
              title={loadedExample ? `Example code · ${loadedExample.name}` : "Usage"}
            >
              {entry.alternativeShape && !loadedExample ? (
                <p className="lab-alt">
                  <span className="lab-alt-label">Alternative API shape</span>
                  {entry.alternativeShape}
                </p>
              ) : null}
            </CodeBlock>
          </div>
        </div>
      </section>

      <aside className="lab-panel" aria-label="Inspector">
        <Splitter
          orientation="vertical"
          label="Resize the inspector panel"
          className="lab-panel-edge"
          onDrag={(x) => setPanelWidth(clamp(window.innerWidth - x, PANEL_MIN, panelMax))}
          onStep={(d) => setPanelWidth(clamp(panelWidth - d * 20, PANEL_MIN, panelMax))}
        />
        <PanelTabs tab={tab} onSelect={setTab} />
        <div
          className="lab-panel-body"
          role="tabpanel"
          id={`lab-tabpanel-${tab}`}
          aria-labelledby={`lab-tab-${tab}`}
        >
          {tab === "controls" ? (
            <div className="lab-ui">
              <div className="lab-panel-head">
                <span className="lab-muted">
                  {changedCount === 0
                    ? "All controls at their defaults."
                    : `${changedCount} changed from the default.`}
                </span>
                <button
                  type="button"
                  className="lab-button lab-button--small"
                  disabled={changedCount === 0 || loadedExample !== null}
                  onClick={() => update(defaults)}
                >
                  Reset all
                </button>
              </div>
              {loadedExample ? (
                <div className="lab-banner">
                  <span>Controls are inactive while an example is shown.</span>
                  <button
                    type="button"
                    className="lab-button lab-button--small"
                    onClick={() => setView({ example: null })}
                  >
                    Back to controls
                  </button>
                </div>
              ) : null}
              <fieldset className="lab-fieldset" disabled={loadedExample !== null}>
                <ControlGroup
                  title="Component props"
                  hint="The component's public API."
                  controls={entry.controls.props}
                  state={state}
                  onChange={setControl}
                />
                <ControlGroup
                  title="Example content"
                  hint="Demo content only: filled slots, text lengths, item counts."
                  controls={entry.controls.example}
                  state={state}
                  onChange={setControl}
                />
              </fieldset>
            </div>
          ) : null}
          {tab === "examples" ? (
            <ExamplesPanel
              entry={entry}
              defaults={defaults}
              state={state}
              loadedExample={view.example}
              background={background}
              onLoadState={(next) => update(next, { ...view, example: null })}
              onLoadExample={(name) => setView({ example: name })}
            />
          ) : null}
          {tab === "parts" ? (
            <PartsPanel
              entry={entry}
              folder={folder}
              background={background}
              presentParts={presentParts}
              onHighlight={setHighlight}
              onApply={(patch) => update({ ...state, ...patch }, { ...view, example: null })}
              onShowTokens={() => setTab("tokens")}
            />
          ) : null}
          {tab === "tokens" ? <TokensPanel entry={entry} /> : null}
          {tab === "axis" ? <AxisPanel entry={entry} /> : null}
          {tab === "design" ? (
            <DesignPanel
              entry={entry}
              comparing={view.design}
              onCompare={(index) => setView({ design: index })}
            />
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function PanelTabs(props: { tab: TabId; onSelect: (tab: TabId) => void }): JSX.Element {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const index = TABS.findIndex((t) => t.id === props.tab);
    const next = TABS[(index + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
    props.onSelect(next.id);
    document.getElementById(`lab-tab-${next.id}`)?.focus();
  };
  return (
    <div className="lab-ui lab-tabs" role="tablist" aria-label="Inspector" onKeyDown={onKeyDown}>
      {TABS.map((t) => {
        const selected = t.id === props.tab;
        return (
          <button
            key={t.id}
            id={`lab-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={selected ? `lab-tabpanel-${t.id}` : undefined}
            tabIndex={selected ? 0 : -1}
            className={`lab-tab${selected ? " lab-tab--on" : ""}`}
            onClick={() => props.onSelect(t.id)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
