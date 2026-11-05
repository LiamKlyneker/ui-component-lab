import { forwardRef, type ReactNode } from "react";

import { cx } from "./cx";
import "./chip.css";

export type ChipProps = {
  variant?: "default" | "accent";
  size?: "sm" | "md";
  className?: string;
  children?: ReactNode;
};

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ variant = "default", size = "md", className, children }, ref) => (
    <span
      ref={ref}
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
