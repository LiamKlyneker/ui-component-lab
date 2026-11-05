import {
  Component,
  useState,
  type ErrorInfo,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

import { highlight } from "./highlight";
import type { Background, Control, ControlState } from "./types";

type BoundaryProps = { resetKey: string; children: ReactNode };
type BoundaryState = { error: Error | null; resetKey: string };

export class RenderBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<BoundaryState> {
    return { error };
  }

  static getDerivedStateFromProps(
    props: BoundaryProps,
    state: BoundaryState,
  ): Partial<BoundaryState> | null {
    return props.resetKey === state.resetKey ? null : { error: null, resetKey: props.resetKey };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[lab] render failed", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="lab-ui lab-problem">
          <strong>Render threw.</strong>
          <pre className="lab-pre">{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Calls `render` inside a boundary, so a throw shows as a red box instead of unmounting the page. */
export function Guarded(props: { resetKey: string; render: () => ReactNode }): JSX.Element {
  return (
    <RenderBoundary resetKey={props.resetKey}>
      <Invoke render={props.render} />
    </RenderBoundary>
  );
}

function Invoke(props: { render: () => ReactNode }): JSX.Element {
  return <>{props.render()}</>;
}

/**
 * An in-page render on a plain canvas-coloured area: no border, no padding
 * around the render itself. No stage styles reach inside the render.
 */
export function Surface(props: {
  background: Background;
  width?: number;
  resetKey: string;
  render: () => ReactNode;
}): JSX.Element {
  return (
    <div className={`lab-render-area lab-canvas--${props.background}`}>
      <div className="lab-surface" style={props.width ? { width: props.width } : undefined}>
        <Guarded resetKey={props.resetKey} render={props.render} />
      </div>
    </div>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function CopyButton(props: { text: string }): JSX.Element {
  const [copied, setCopied] = useState<"idle" | "ok" | "failed">("idle");
  return (
    <button
      type="button"
      className="lab-button lab-button--small"
      onClick={() => {
        void copyText(props.text).then((ok) => {
          setCopied(ok ? "ok" : "failed");
          window.setTimeout(() => setCopied("idle"), 1500);
        });
      }}
    >
      {copied === "idle" ? "Copy" : copied === "ok" ? "Copied" : "Copy failed"}
    </button>
  );
}

/** Code with a header row that holds the Copy button, so the button never covers code. */
export function CodeBlock(props: {
  code: string;
  title: ReactNode;
  fill?: boolean;
  children?: ReactNode;
}): JSX.Element {
  return (
    <div className={`lab-ui lab-code${props.fill ? " lab-code--fill" : ""}`}>
      <div className="lab-code-head">
        <span className="lab-code-title">{props.title}</span>
        <CopyButton text={props.code} />
      </div>
      <div className="lab-code-body">
        <pre className="lab-pre lab-code-pre">{highlight(props.code)}</pre>
        {props.children}
      </div>
    </div>
  );
}

/** Every option visible; a real radio group, so arrow keys move between options. */
export function Segmented<T extends string>(props: {
  name: string;
  value: T;
  options: readonly { value: T; label: ReactNode; title?: string }[];
  onChange: (value: T) => void;
  labelledBy?: string;
  ariaLabel?: string;
  disabled?: boolean;
}): JSX.Element {
  return (
    <span
      className="lab-segmented"
      role="radiogroup"
      aria-labelledby={props.labelledBy}
      aria-label={props.ariaLabel}
    >
      {props.options.map((option) => (
        <label
          key={option.value}
          className={`lab-segment${option.value === props.value ? " lab-segment--on" : ""}`}
          title={option.title}
        >
          <input
            type="radio"
            className="lab-segment-input"
            name={props.name}
            value={option.value}
            checked={option.value === props.value}
            disabled={props.disabled}
            onChange={() => props.onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </span>
  );
}

const SEGMENTED_MAX_OPTIONS = 5;

function ControlInput(props: {
  control: Control;
  value: string | number | boolean;
  labelId: string;
  onChange: (value: string | number | boolean) => void;
}): JSX.Element {
  const { control, value, onChange, labelId } = props;
  const id = `lab-control-${control.key}`;
  switch (control.kind) {
    case "select":
      return control.options.length <= SEGMENTED_MAX_OPTIONS ? (
        <Segmented
          name={id}
          labelledBy={labelId}
          value={String(value)}
          options={control.options.map((option) => ({ value: option, label: option }))}
          onChange={onChange}
        />
      ) : (
        <select
          id={id}
          className="lab-input"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        >
          {control.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    case "boolean":
      return (
        <input
          id={id}
          type="checkbox"
          className="lab-checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
    case "number":
      return (
        <span className="lab-number">
          <input
            id={id}
            type="range"
            min={control.min}
            max={control.max}
            step={1}
            value={Number(value)}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <span className="lab-number-value">{String(value)}</span>
        </span>
      );
    case "text":
      return (
        <input
          id={id}
          type="text"
          className="lab-input"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

/** A throwing condition counts as met, so a bad `when` never hides a control silently. */
export function isControlShown(control: Control, state: ControlState): boolean {
  if (!control.when) return true;
  try {
    return control.when(state) !== false;
  } catch {
    return true;
  }
}

const formatValue = (value: string | number | boolean): string =>
  typeof value === "string" ? JSON.stringify(value) : String(value);

export function ControlGroup(props: {
  title: string;
  hint: string;
  controls: Control[];
  state: ControlState;
  onChange: (key: string, value: string | number | boolean) => void;
}): JSX.Element {
  const shown = props.controls.filter((c) => isControlShown(c, props.state));
  const hidden = props.controls.length - shown.length;
  return (
    <section className="lab-group">
      <h3 className="lab-group-title">{props.title}</h3>
      <p className="lab-group-hint">{props.hint}</p>
      {props.controls.length === 0 ? <p className="lab-muted">None.</p> : null}
      {shown.map((control) => {
        const value = props.state[control.key];
        const changed = value !== control.default;
        const labelId = `lab-control-label-${control.key}`;
        const radio = control.kind === "select" && control.options.length <= SEGMENTED_MAX_OPTIONS;
        return (
          <div key={control.key} className={`lab-control${changed ? " lab-control--changed" : ""}`}>
            <div className="lab-control-head">
              {radio ? (
                <span id={labelId} className="lab-control-label">
                  {control.label}
                </span>
              ) : (
                <label id={labelId} className="lab-control-label" htmlFor={`lab-control-${control.key}`}>
                  {control.label}
                </label>
              )}
              <code className="lab-control-key">{control.key}</code>
              {changed ? (
                <button
                  type="button"
                  className="lab-reset"
                  title={`Reset to the default, ${formatValue(control.default)}`}
                  aria-label={`Reset ${control.label} to ${formatValue(control.default)}`}
                  onClick={() => props.onChange(control.key, control.default)}
                >
                  ↺
                </button>
              ) : null}
            </div>
            <div className="lab-control-input">
              <ControlInput
                control={control}
                value={value}
                labelId={labelId}
                onChange={(next) => props.onChange(control.key, next)}
              />
            </div>
            {control.note || changed ? (
              <p className="lab-control-note">
                {changed ? (
                  <span className="lab-control-default">default {formatValue(control.default)}</span>
                ) : null}
                {control.note}
              </p>
            ) : null}
          </div>
        );
      })}
      {hidden > 0 ? (
        <p className="lab-muted lab-group-hidden">
          {hidden === 1 ? "1 control is" : `${hidden} controls are`} hidden because a condition
          is not met in this state. Hidden values stay in the URL.
        </p>
      ) : null}
    </section>
  );
}

/**
 * A drag handle between two regions. `onDrag` gets pointer coordinates; `onStep`
 * gets -1 or +1 from the arrow keys.
 */
export function Splitter(props: {
  orientation: "vertical" | "horizontal";
  label: string;
  className?: string;
  onDrag: (clientX: number, clientY: number) => void;
  onStep: (direction: -1 | 1) => void;
}): JSX.Element {
  const vertical = props.orientation === "vertical";
  const end = (e: PointerEvent<HTMLDivElement>): void => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    document.documentElement.classList.remove("lab-dragging", "lab-dragging--x", "lab-dragging--y");
  };
  return (
    <div
      role="separator"
      aria-orientation={props.orientation}
      aria-label={props.label}
      tabIndex={0}
      className={`lab-splitter lab-splitter--${props.orientation} ${props.className ?? ""}`}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        // An iframe under the pointer would swallow the move events.
        document.documentElement.classList.add(
          "lab-dragging",
          vertical ? "lab-dragging--x" : "lab-dragging--y",
        );
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) props.onDrag(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
        const back = vertical ? "ArrowLeft" : "ArrowUp";
        const forward = vertical ? "ArrowRight" : "ArrowDown";
        if (e.key === back || e.key === forward) {
          e.preventDefault();
          props.onStep(e.key === back ? -1 : 1);
        }
      }}
    />
  );
}
