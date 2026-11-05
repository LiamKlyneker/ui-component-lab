import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const packageVersion = JSON.parse(readFileSync(new URL("package.json", root), "utf8")).version;
const stageVersion = readFileSync(new URL("stage/VERSION", root), "utf8").trim();

if (packageVersion !== stageVersion) {
  console.error(`stage/VERSION is ${stageVersion}, package.json is ${packageVersion}; they must match.`);
  process.exit(1);
}
