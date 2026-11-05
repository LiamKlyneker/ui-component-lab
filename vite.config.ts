import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineLabConfig } from "./stage/vite.ts";

const labRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineLabConfig({
  labRoot,
  repoRoot: labRoot,
  styles: [path.join(labRoot, "demo-library/styles.css"), path.join(labRoot, "project.css")],
});
