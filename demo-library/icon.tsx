import { forwardRef } from "react";

import { cx } from "./cx";

const PATHS = {
  check: "M2.5 6.5 5 9l4.5-6",
  star: "M6 1.5 7.4 4.4l3.1.4-2.3 2.2.6 3.1L6 8.6 3.2 10.1l.6-3.1-2.3-2.2 3.1-.4Z",
  dot: "M6 4.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z",
  plus: "M6 2v8M2 6h8",
  minus: "M2 6h8",
  arrow: "M2 6h8M7 3l3 3-3 3",
} as const;

export type IconName = keyof typeof PATHS;

export type IconProps = { name: IconName; className?: string };

export const Icon = forwardRef<SVGSVGElement, IconProps>(({ name, className }, ref) => (
  <svg
    ref={ref}
    className={cx("demo-icon", className)}
    viewBox="0 0 12 12"
    width="12"
    height="12"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={PATHS[name]} />
  </svg>
));
Icon.displayName = "Icon";
