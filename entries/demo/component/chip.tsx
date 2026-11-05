import { forwardRef, type CSSProperties, type ReactNode } from "react";

import { cx } from "../../../demo-library/cx";
import "./chip.css";

export type ChipProps = {
  variant?: "default" | "accent" | "outline";
  size?: "sm" | "md";
  className?: string;
  children?: ReactNode;
};

const outlineBorder = "#8a9299"; // PROVISIONAL(chip-outline-border): token `border/chip/outline` once the library has it
const iconOffset = "1px"; // PROVISIONAL(chip-icon-nudge): align the icon in Chip's own layout instead of a 1px offset

const chipVars = {
  "--demo-chip-outline-border": outlineBorder,
  "--demo-chip-icon-offset": iconOffset,
} as CSSProperties;

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ variant = "default", size = "md", className, children }, ref) => (
    <span
      ref={ref}
      data-part="chip"
      style={chipVars}
      className={cx(
        "demo-chip demo-text-label",
        variant !== "default" && `demo-chip--${variant}`,
        `demo-chip--${size}`,
        className,
      )}
    >
      {children}
    </span>
  ),
);
Chip.displayName = "Chip";
