import { forwardRef, type ReactNode } from "react";

import { cx } from "../../../demo-library/cx";
import { Chip } from "./chip";
import "./chip-row.css";

export type ChipRowItem = { key: string; label: string; icon?: ReactNode };

export type ChipRowProps = {
  label?: ReactNode;
  chips: ChipRowItem[];
  variant?: "default" | "accent" | "outline";
  size?: "sm" | "md";
  className?: string;
};

const chipGap = "10px"; // PROVISIONAL(chip-row-gap): token `space/chip-row/gap` (10px) once the library has it

export const ChipRow = forwardRef<HTMLDivElement, ChipRowProps>(
  ({ label, chips, variant = "default", size = "md", className }, ref) => (
    <div ref={ref} data-part="chip-row" className={cx("demo-chip-row", className)}>
      {label ? (
        <span data-part="chip-row-label" className="demo-text-caption">
          {label}
        </span>
      ) : null}
      <div className="demo-chip-row-chips" style={{ gap: chipGap }}>
        {chips.map((chip) => (
          <Chip key={chip.key} variant={variant} size={size}>
            {chip.icon ? (
              // The wrapper only names the icon for the lab; `display: contents` keeps it out of Chip's flex row.
              <span data-part="chip-icon" className="demo-contents">
                {chip.icon}
              </span>
            ) : null}
            <span>{chip.label}</span>
          </Chip>
        ))}
      </div>
    </div>
  ),
);
ChipRow.displayName = "ChipRow";
