import { useEffect, useState } from "react";

import { loadMarkers, type Marker } from "./registry";
import type { Highlight } from "./specimen";
import type { Background, ControlState, Example, LabEntry, Part, Screenshot } from "./types";
import { CodeBlock, Surface } from "./widgets";

const screenshotUrl = (src: string): string =>
  `/@fs${__LAB_REPO_ROOT__}/${src.replace(/^\/+/, "")}`;

export function safeUsage(entry: LabEntry, state: ControlState): string {
  try {
    return entry.usage(state);
  } catch (error) {
    return `// usage(state) threw: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export function ScreenshotFigure(props: { shot: Screenshot }): JSX.Element {
  const { shot } = props;
  return (
    <figure className="lab-ui lab-shot">
      {"src" in shot ? (
        <img className="lab-shot-img" src={screenshotUrl(shot.src)} alt={shot.label} />
      ) : (
        <div className="lab-shot-missing">No screenshot — {shot.missing}</div>
      )}
      <figcaption className="lab-shot-caption">
        <span>{shot.label}</span>
        {shot.figma ? <code className="lab-ref">{shot.figma}</code> : null}
      </figcaption>
    </figure>
  );
}

export function DesignPanel(props: {
  entry: LabEntry;
  comparing: number | null;
  onCompare: (index: number) => void;
}): JSX.Element {
  const { entry } = props;
  if (entry.screenshots.length === 0) {
    return <p className="lab-ui lab-muted">This entry lists no screenshots.</p>;
  }
  return (
    <div className="lab-ui lab-stack">
      {entry.screenshots.map((shot, index) => (
        <div key={`${index}-${shot.label}`} className="lab-card">
          <ScreenshotFigure shot={shot} />
          <div className="lab-card-actions">
            <button
              type="button"
              className="lab-button lab-button--small"
              aria-pressed={props.comparing === index}
              onClick={() => props.onCompare(index)}
            >
              {props.comparing === index ? "Beside the specimen" : "Show beside the specimen"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AxisPanel(props: { entry: LabEntry }): JSX.Element {
  return (
    <table className="lab-ui lab-table lab-table--wrap">
      <thead>
        <tr>
          <th>Figma</th>
          <th>Code</th>
          <th>Kind</th>
        </tr>
      </thead>
      <tbody>
        {props.entry.axisMap.map((row) => (
          <tr key={row.figma}>
            <td>{row.figma}</td>
            <td>
              <code>{row.code}</code>
              {row.note ? <div className="lab-cell-note">{row.note}</div> : null}
            </td>
            <td>
              <span className={`lab-kind lab-kind--${row.kind}`}>{row.kind}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const sameState = (a: ControlState, b: ControlState): boolean =>
  Object.keys(b).every((key) => a[key] === b[key]);

export function ExamplesPanel(props: {
  entry: LabEntry;
  defaults: ControlState;
  state: ControlState;
  loadedExample: string | null;
  background: Background;
  onLoadState: (state: ControlState) => void;
  onLoadExample: (name: string) => void;
}): JSX.Element {
  const { entry } = props;
  if (entry.examples.length === 0) return <p className="lab-ui lab-muted">This entry lists no examples.</p>;
  return (
    <div className="lab-stack">
      {entry.examples.map((example, index) => {
        const exampleState =
          "state" in example ? ({ ...props.defaults, ...example.state } as ControlState) : null;
        const active = exampleState
          ? props.loadedExample === null && sameState(props.state, exampleState)
          : props.loadedExample === example.name;
        return (
          <ExampleCard
            key={`${index}-${example.name}`}
            entry={entry}
            example={example}
            exampleState={exampleState}
            active={active}
            background={props.background}
            onLoad={() =>
              exampleState ? props.onLoadState(exampleState) : props.onLoadExample(example.name)
            }
          />
        );
      })}
    </div>
  );
}

function ExampleCard(props: {
  entry: LabEntry;
  example: Example<ControlState>;
  exampleState: ControlState | null;
  active: boolean;
  background: Background;
  onLoad: () => void;
}): JSX.Element {
  const { entry, example, exampleState } = props;
  const [codeOpen, setCodeOpen] = useState(false);
  const code = exampleState ? safeUsage(entry, exampleState) : "code" in example ? example.code : "";
  return (
    <article className={`lab-card lab-example${props.active ? " lab-card--active" : ""}`}>
      <h3 className="lab-ui lab-example-title">{example.name}</h3>
      <p className="lab-ui lab-example-meta">
        <span className="lab-ref">
          {example.source.type === "figma" ? `figma · ${example.source.ref}` : "created"}
        </span>
        {exampleState ? null : <span> · composition, not a control state</span>}
      </p>
      {example.note ? <p className="lab-ui lab-example-meta">{example.note}</p> : null}
      <Surface
        background={props.background}
        width={entry.designWidth}
        resetKey={exampleState ? JSON.stringify(exampleState) : example.name}
        render={() =>
          exampleState ? entry.render(exampleState) : "render" in example ? example.render() : null
        }
      />
      <div className="lab-ui lab-card-actions">
        <button
          type="button"
          className="lab-button lab-button--small lab-button--primary"
          disabled={props.active}
          onClick={props.onLoad}
        >
          {props.active ? "In the specimen" : exampleState ? "Load into specimen" : "Show in specimen"}
        </button>
        <button
          type="button"
          className="lab-button lab-button--small"
          aria-expanded={codeOpen}
          onClick={() => setCodeOpen(!codeOpen)}
        >
          {codeOpen ? "Hide code" : "Code"}
        </button>
      </div>
      {codeOpen ? <CodeBlock code={code} title="Code" /> : null}
    </article>
  );
}

function useMarkers(folder: string): Marker[] | null {
  const [markers, setMarkers] = useState<Marker[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    void loadMarkers(folder).then((m) => {
      if (!cancelled) setMarkers(m);
    });
    return () => {
      cancelled = true;
    };
  }, [folder]);
  return markers;
}

export function PartsPanel(props: {
  entry: LabEntry;
  folder: string;
  background: Background;
  presentParts: string[] | null;
  onHighlight: (highlight: Highlight | null) => void;
  /** Applies a part's `show` or `hide` patch to the control state. */
  onApply: (patch: ControlState) => void;
  onShowTokens: () => void;
}): JSX.Element {
  const { entry, folder, background, onHighlight } = props;
  const markers = useMarkers(folder);
  const declared = entry.parts.flatMap((p) => (p.standIns ?? []).map((s) => ({ part: p.name, id: s.id })));
  const declaredIds = new Set(declared.map((d) => d.id));
  const orphanMarkers = (markers ?? []).filter((m) => !declaredIds.has(m.id));
  const unmarked = markers === null ? [] : declared.filter((d) => !markers.some((m) => m.id === d.id));
  const present = props.presentParts === null ? null : new Set(props.presentParts);

  useEffect(() => () => onHighlight(null), [onHighlight]);

  return (
    <div className="lab-stack">
      {orphanMarkers.length > 0 || unmarked.length > 0 ? (
        <ul className="lab-ui lab-problem">
          {orphanMarkers.map((m) => (
            <li key={`${m.file}:${m.line}`}>
              PROVISIONAL({m.id}) at {m.file}:{m.line} is not listed in any part&apos;s standIns.
            </li>
          ))}
          {unmarked.map((d) => (
            <li key={`unmarked-${d.id}`}>
              Part &ldquo;{d.part}&rdquo; lists stand-in {d.id}, but no PROVISIONAL({d.id}) marker is in
              component/.
            </li>
          ))}
        </ul>
      ) : null}
      {entry.parts.length === 0 ? (
        <p className="lab-ui lab-muted">This entry lists no parts.</p>
      ) : (
        <p className="lab-ui lab-muted">
          {entry.parts.length} {entry.parts.length === 1 ? "part" : "parts"}. Hover a part with a
          location to outline it in the specimen.
        </p>
      )}
      {entry.parts.map((part) => (
        <PartRow
          key={part.name}
          part={part}
          background={background}
          present={part.locate === undefined || present === null ? null : present.has(part.locate)}
          onHighlight={onHighlight}
          onApply={props.onApply}
          onShowTokens={props.onShowTokens}
        />
      ))}
    </div>
  );
}

const describePatch = (patch: object): string =>
  `Sets ${Object.entries(patch)
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(", ")}`;

function PartRow(props: {
  part: Part;
  background: Background;
  /** `null` = the part has no `locate`, or the specimen has not reported yet. */
  present: boolean | null;
  onHighlight: (highlight: Highlight | null) => void;
  onApply: (patch: ControlState) => void;
  onShowTokens: () => void;
}): JSX.Element {
  const { part, background, present, onHighlight } = props;
  const locate = part.locate;
  const hoverable = locate !== undefined;
  const on = (): void => {
    if (locate !== undefined) onHighlight({ part: locate });
  };
  const off = (): void => {
    if (hoverable) onHighlight(null);
  };
  const standIns = part.standIns?.length ?? 0;
  return (
    <article
      className={`lab-card lab-part${hoverable ? " lab-part--locatable" : ""}`}
      tabIndex={hoverable ? 0 : undefined}
      aria-label={hoverable ? `${part.name}: focus to outline it in the specimen` : undefined}
      onMouseEnter={on}
      onMouseLeave={off}
      onFocus={on}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) off();
      }}
    >
      <div className="lab-ui lab-part-head">
        <h3 className="lab-part-name">{part.name}</h3>
        <span className={`lab-class lab-class--${part.class}`}>{part.class}</span>
      </div>
      {part.uses ? <code className="lab-ui lab-part-uses">{part.uses}</code> : null}
      {part.note ? <p className="lab-ui lab-part-note">{part.note}</p> : null}
      {present === true && part.hide ? (
        <div className="lab-ui lab-part-toggle">
          <span className="lab-muted">In the specimen.</span>
          <button
            type="button"
            className="lab-button lab-button--small lab-part-toggle-button"
            title={describePatch(part.hide)}
            onClick={() => {
              onHighlight(null);
              props.onApply(part.hide as ControlState);
            }}
          >
            Remove
          </button>
        </div>
      ) : null}
      {present === false ? (
        <div className="lab-ui lab-part-toggle">
          <span className="lab-muted">Not in the specimen in this state.</span>
          {part.show ? (
            <button
              type="button"
              className="lab-button lab-button--small lab-button--primary lab-part-toggle-button"
              title={describePatch(part.show)}
              onClick={() => props.onApply(part.show as ControlState)}
            >
              Add
            </button>
          ) : null}
        </div>
      ) : null}
      {standIns > 0 ? (
        <button type="button" className="lab-ui lab-link" onClick={props.onShowTokens}>
          {standIns === 1 ? "1 value is" : `${standIns} values are`} not real yet
        </button>
      ) : null}
      {part.class === "updated" ? (
        <div className="lab-compare">
          <div className="lab-ui lab-compare-label">Before · library today</div>
          <Surface background={background} resetKey="before" render={part.before} />
          <div className="lab-ui lab-compare-label">After · proposal</div>
          <Surface background={background} resetKey="after" render={part.after} />
        </div>
      ) : null}
    </article>
  );
}

const COLOUR = /^(#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(?:rgb|hsl)a?\([^()]*\))$/i;

function Value(props: { value: string }): JSX.Element {
  const colour = COLOUR.test(props.value.trim());
  return (
    <span className="lab-token-value">
      {colour ? <span className="lab-swatch" style={{ background: props.value.trim() }} /> : null}
      <code>{props.value}</code>
    </span>
  );
}

const TOKEN_GROUPS = [
  { cls: "new", title: "New" },
  { cls: "updated", title: "Updated" },
  { cls: "reused", title: "Reused" },
] as const;

export function TokensPanel(props: { entry: LabEntry }): JSX.Element {
  const { entry } = props;
  const standIns = entry.parts.flatMap((part) =>
    (part.standIns ?? []).map((standIn) => ({ part: part.name, standIn })),
  );
  const byId = new Map(standIns.map((s) => [s.standIn.id, s.standIn]));
  const tokens = entry.tokens ?? [];
  const referenced = new Set(tokens.map((t) => t.standIn).filter((id) => id !== undefined));
  const others = standIns.filter((s) => !referenced.has(s.standIn.id));

  return (
    <div className="lab-ui lab-stack">
      {entry.tokens === undefined ? (
        <p className="lab-muted">This entry lists no tokens yet.</p>
      ) : null}
      {TOKEN_GROUPS.map((group) => {
        const rows = tokens.filter((t) => t.class === group.cls);
        if (rows.length === 0) return null;
        return (
          <section key={group.cls} className="lab-token-group">
            <h3 className="lab-group-title">
              {group.title} <span className="lab-group-count">{rows.length}</span>
            </h3>
            {rows.map((token, index) => {
              const standIn = token.standIn === undefined ? undefined : byId.get(token.standIn);
              return (
                <div
                  key={`${index}-${token.figma}`}
                  className={`lab-token${group.cls === "reused" ? " lab-token--compact" : ""}`}
                >
                  <div className="lab-token-head">
                    <span className="lab-token-figma">{token.figma}</span>
                    {token.code === null ? (
                      <span className="lab-muted">no name yet</span>
                    ) : (
                      <code className="lab-token-code">{token.code}</code>
                    )}
                  </div>
                  <div className="lab-token-line">
                    {token.class === "updated" && token.before !== undefined ? (
                      <>
                        <Value value={token.before} />
                        <span className="lab-muted">→</span>
                      </>
                    ) : null}
                    <Value value={token.value} />
                    {token.parts && token.parts.length > 0 ? (
                      <span className="lab-muted lab-token-parts">{token.parts.join(", ")}</span>
                    ) : null}
                  </div>
                  {standIn ? (
                    <div className="lab-token-note">
                      in the code today: <code>{standIn.value}</code>
                    </div>
                  ) : null}
                  {token.note ? <div className="lab-token-note">{token.note}</div> : null}
                </div>
              );
            })}
          </section>
        );
      })}
      {others.length > 0 ? (
        <section className="lab-token-group">
          <h3 className="lab-group-title">
            Other stand-ins <span className="lab-group-count">{others.length}</span>
          </h3>
          {others.map(({ part, standIn }) => (
            <div key={standIn.id} className="lab-token">
              <div className="lab-token-line">
                <code>{standIn.value}</code>
                <span className="lab-muted">→</span>
                <span>{standIn.replaceWith}</span>
              </div>
              <div className="lab-token-note">{part}</div>
            </div>
          ))}
        </section>
      ) : null}
      {tokens.length === 0 && others.length === 0 ? (
        <p className="lab-muted">No stand-ins either: every value in the component is real.</p>
      ) : null}
    </div>
  );
}
