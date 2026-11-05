import { Chip as LibraryChip } from "../../demo-library/chip";
import { Icon, type IconName } from "../../demo-library/icon";
import { defineEntry } from "../../stage/define-entry";
import { Chip as ProposedChip } from "./component/chip";
import { ChipRow, type ChipRowItem } from "./component/chip-row";

const SHORT = ["Wool", "Linen", "Cotton", "Silk", "Hemp", "Jute"];
const LONG = [
  "Machine washable",
  "Ships in two days",
  "Recycled packaging",
  "Made to order",
  "Free returns",
  "Gift wrapping available",
];

const chipsFor = (
  count: number,
  length: "short" | "long",
  icon: IconName | null,
): ChipRowItem[] =>
  (length === "short" ? SHORT : LONG).slice(0, count).map((label) => ({
    key: label.toLowerCase().replace(/\W+/g, "-"),
    label,
    icon: icon ? <Icon name={icon} /> : undefined,
  }));

export default defineEntry({
  name: "Chip row (demo)",
  slug: "demo",
  ticket: null,
  brief: null,
  status: "draft",
  designWidth: 340,
  screenshots: [
    {
      label: "Chip row — default, with label",
      src: "entries/demo/screenshots/chip-row-default.svg",
    },
    {
      label: "Chip row — hover",
      missing: "hidden state in the design; no screenshot was exported",
    },
  ],
  controls: {
    props: [
      {
        kind: "select",
        key: "variant",
        label: "Variant",
        options: ["default", "accent", "outline"],
        default: "default",
        note: "`outline` is new — see the Chip part.",
      },
      { kind: "select", key: "size", label: "Size", options: ["sm", "md"], default: "md" },
    ],
    example: [
      { kind: "boolean", key: "showLabel", label: "Label slot filled", default: true },
      {
        kind: "text",
        key: "labelText",
        label: "Label text",
        default: "Details",
        note: "Shown only while the label slot is filled.",
        when: (s) => s.showLabel === true,
      },
      { kind: "number", key: "count", label: "Chips", min: 1, max: 6, default: 4 },
      {
        kind: "select",
        key: "textLength",
        label: "Chip text length",
        options: ["short", "long"],
        default: "short",
      },
      { kind: "boolean", key: "withIcon", label: "Leading icon", default: false },
      {
        kind: "select",
        key: "iconName",
        label: "Icon",
        options: ["check", "star", "dot", "plus", "minus", "arrow"],
        default: "check",
        note: "Six options, so the page draws a dropdown.",
        when: (s) => s.withIcon === true,
      },
    ],
  },
  render: (s) => (
    <ChipRow
      variant={s.variant}
      size={s.size}
      label={s.showLabel ? s.labelText : undefined}
      chips={chipsFor(s.count, s.textLength, s.withIcon ? s.iconName : null)}
    />
  ),
  usage: (s) => {
    const props: string[] = [];
    if (s.variant !== "default") props.push(`variant="${s.variant}"`);
    if (s.size !== "md") props.push(`size="${s.size}"`);
    if (s.showLabel) props.push(`label="${s.labelText}"`);
    const items = chipsFor(s.count, s.textLength, null).map(
      (c) =>
        `    { key: "${c.key}", label: "${c.label}"${s.withIcon ? `, icon: <Icon name="${s.iconName}" />` : ""} },`,
    );
    return [
      `import { ChipRow } from "demo-library/chip-row";`,
      ...(s.withIcon ? [`import { Icon } from "demo-library/icon";`] : []),
      ``,
      `<ChipRow`,
      ...props.map((p) => `  ${p}`),
      `  chips={[`,
      ...items,
      `  ]}`,
      `/>`,
    ].join("\n");
  },
  alternativeShape:
    "Children instead of a `chips` array: <ChipRow label=\"…\"><Chip>…</Chip></ChipRow>, with variant and size set on each Chip.",
  axisMap: [
    { figma: "Variant = Default · Accent · Outline", code: `variant: "default" | "accent" | "outline"`, kind: "variant" },
    { figma: "Size = S · M", code: `size: "sm" | "md"`, kind: "variant" },
    { figma: "Show label (boolean)", code: "label?: ReactNode", kind: "slot" },
    { figma: "Chip text (text property)", code: "chips[n].label", kind: "children" },
    { figma: "Icon (instance swap, per chip)", code: "chips[n].icon", kind: "slot" },
    { figma: "Count = 1 … 6", code: "chips.length", kind: "example", note: "Demo content, not an API." },
    { figma: "State = Hover", code: "—", kind: "dropped", note: "Chips are not interactive." },
  ],
  examples: [
    {
      name: "Fabric list",
      source: { type: "figma", ref: "DEMOfileKey:0:1" },
      note: "Demo: the Figma ref is a placeholder.",
      state: { variant: "default", size: "md", showLabel: true, labelText: "Details", count: 4, textLength: "short", withIcon: false },
    },
    {
      name: "Accent, small, no label",
      source: { type: "figma", ref: "DEMOfileKey:0:2" },
      state: { variant: "accent", size: "sm", showLabel: false, count: 2, textLength: "short", withIcon: false },
    },
    {
      name: "Outline with icons, long text",
      source: { type: "created" },
      note: "Created to test wrapping at 340px.",
      state: { variant: "outline", size: "md", showLabel: true, labelText: "Delivery", count: 4, textLength: "long", withIcon: true, iconName: "check" },
    },
    {
      name: "Two rows stacked",
      source: { type: "created" },
      note: "A composition the controls cannot express.",
      render: () => (
        <div className="demo-stack">
          <ChipRow label="Material" chips={chipsFor(2, "short", null).slice(1)} />
          <ChipRow label="Offer" variant="accent" size="sm" chips={[{ key: "sale", label: "Sale" }]} />
        </div>
      ),
      code: [
        `<ChipRow label="Material" chips={[{ key: "linen", label: "Linen" }]} />`,
        `<ChipRow label="Offer" variant="accent" size="sm" chips={[{ key: "sale", label: "Sale" }]} />`,
      ].join("\n"),
    },
  ],
  parts: [
    {
      name: "ChipRow",
      class: "new",
      note: "Label above a wrapping row of chips. Lands as demo-library/chip-row.tsx.",
      locate: "chip-row",
      standIns: [
        {
          id: "chip-row-gap",
          value: `"10px"`,
          replaceWith: "token `space/chip-row/gap` (10px), once the library has it",
        },
      ],
    },
    {
      name: "Chip",
      class: "updated",
      uses: "Chip — demo-library/chip.tsx",
      note: "Adds `variant: \"outline\"`. Copy in component/chip.tsx; demo-library/chip.tsx is unchanged.",
      locate: "chip",
      standIns: [
        {
          id: "chip-outline-border",
          value: `"#8a9299"`,
          replaceWith: "token `border/chip/outline`",
        },
        {
          id: "chip-icon-nudge",
          value: `"1px"`,
          replaceWith: "icon alignment in Chip's own layout, no offset",
        },
      ],
      before: () => (
        <div className="demo-inline">
          <LibraryChip variant="default">Default</LibraryChip>
          <LibraryChip variant="accent">Accent</LibraryChip>
        </div>
      ),
      after: () => (
        <div className="demo-inline">
          <ProposedChip variant="default">Default</ProposedChip>
          <ProposedChip variant="accent">Accent</ProposedChip>
          <ProposedChip variant="outline">Outline</ProposedChip>
        </div>
      ),
    },
    {
      name: "Label",
      class: "new",
      note: "Optional caption above the chips. Absent when `label` is not passed.",
      locate: "chip-row-label",
      show: { showLabel: true },
      hide: { showLabel: false },
    },
    {
      name: "Leading icon",
      class: "reused",
      uses: "Icon — demo-library/icon.tsx",
      note: "Passed in per chip by the consumer; ChipRow does not import an icon. Absent by default.",
      locate: "chip-icon",
      show: { withIcon: true },
      hide: { withIcon: false },
    },
  ],
  tokens: [
    {
      class: "new",
      figma: "space/chip-row/gap",
      code: null,
      value: "10px",
      parts: ["ChipRow"],
      standIn: "chip-row-gap",
    },
    {
      class: "new",
      figma: "border/chip/outline",
      code: null,
      value: "#8a9299",
      parts: ["Chip"],
      standIn: "chip-outline-border",
    },
    {
      class: "updated",
      figma: "surface/chip",
      code: "--demo-chip-bg",
      value: "#e9ecef",
      before: "#eef0f2",
      parts: ["Chip"],
      note: "Demo: the new value is invented to show an update.",
    },
    {
      class: "reused",
      figma: "Type/Label",
      code: "demo-text-label",
      value: "13px / 18px / 500",
      parts: ["Chip"],
    },
    {
      class: "reused",
      figma: "Type/Caption",
      code: "demo-text-caption",
      value: "12px / 16px / 400",
      parts: ["Label"],
    },
    {
      class: "reused",
      figma: "color/accent",
      code: "--demo-accent",
      value: "#3b4a5a",
      parts: ["Chip"],
    },
  ],
});
