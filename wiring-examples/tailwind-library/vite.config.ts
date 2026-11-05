import path from "node:path";
import { fileURLToPath } from "node:url";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";

import { defineLabConfig } from "./stage/vite.ts";

const labRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(labRoot, "..");

export default defineLabConfig({
  labRoot,
  repoRoot,
  styles: [
    path.join(repoRoot, "<LIBRARY_STYLESHEET>"),
    path.join(labRoot, "lab.css"),
  ],
  alias: {
    "<ALIAS>": path.join(repoRoot, "<ALIAS_TARGET>"),
  },
  postcssPlugins: [
    tailwindcss({ config: path.join(labRoot, "tailwind.config.ts") }),
    autoprefixer(),
  ],
});
