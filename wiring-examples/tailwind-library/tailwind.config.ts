import path from "node:path";
import type { Config } from "tailwindcss";

import libraryConfig from "../tailwind.config";

const repoRoot = path.resolve(__dirname, "..");

// The library's globs are relative to the process cwd; anchoring them to the
// repo root keeps the scan correct whichever directory the stage starts from.
const libraryContent = (libraryConfig.content as string[]).map((glob) =>
  path.resolve(repoRoot, glob),
);

const config: Config = {
  ...libraryConfig,
  content: [...libraryContent, path.join(__dirname, "entries/**/*.{ts,tsx}")],
};

export default config;
