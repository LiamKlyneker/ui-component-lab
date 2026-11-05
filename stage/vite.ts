import path from "node:path";
import react from "@vitejs/plugin-react";
import type { CSSOptions, Plugin, PluginOption, UserConfig } from "vite";

type PostcssPlugins = NonNullable<Exclude<NonNullable<CSSOptions["postcss"]>, string>["plugins"]>;

export const LAB_DEFAULT_PORT = 6100;

export type LabConfigOptions = {
  /** Absolute path of the lab folder: the one that holds `stage/`, `entries/` and `index.html`. */
  labRoot: string;
  /** Absolute path of the host repo root. Screenshot and brief paths are relative to it. */
  repoRoot: string;
  /** Absolute paths of stylesheets the page and the specimen load before the stage's own, in order. */
  styles?: string[];
  /** Vite `resolve.alias` entries, so entries can import the library the way its own code does. */
  alias?: Record<string, string>;
  /** PostCSS plugins, e.g. Tailwind. Without them, CSS goes through no PostCSS plugin at all. */
  postcssPlugins?: PostcssPlugins;
  /** Dev server port; startup fails when it is taken. Default `LAB_DEFAULT_PORT`. */
  port?: number;
  /** Extra Vite plugins, added after the stage's own. */
  plugins?: PluginOption[];
};

const PROJECT_STYLES_ID = "virtual:lab-project-styles";

function projectStyles(files: readonly string[]): Plugin {
  const resolvedId = `\0${PROJECT_STYLES_ID}`;
  return {
    name: "lab-project-styles",
    resolveId: (id) => (id === PROJECT_STYLES_ID ? resolvedId : undefined),
    load: (id) =>
      id === resolvedId ? files.map((file) => `import ${JSON.stringify(file)};`).join("\n") : undefined,
  };
}

// An entry module default-exports a plain object, so React Fast Refresh cannot
// patch it in place; the stage would keep rendering the old object. Reload the
// page instead — control state survives because it lives in the URL.
function reloadOnEntryChange(entriesDir: string): Plugin {
  const isEntryFile = (file: string): boolean =>
    file.startsWith(entriesDir) && path.basename(file) === "entry.tsx";

  return {
    name: "lab-reload-on-entry-change",
    handleHotUpdate({ file, server }) {
      if (!isEntryFile(file)) return;
      server.ws.send({ type: "full-reload" });
      return [];
    },
    configureServer(server) {
      const reloadIfEntries = (file: string): void => {
        if (file.startsWith(entriesDir)) server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", reloadIfEntries);
      server.watcher.on("unlink", reloadIfEntries);
      server.watcher.on("addDir", reloadIfEntries);
      server.watcher.on("unlinkDir", reloadIfEntries);
    },
  };
}

/** The whole Vite config of a lab. A project's `vite.config.ts` default-exports its result. */
export function defineLabConfig(options: LabConfigOptions): UserConfig {
  const { labRoot, repoRoot } = options;
  return {
    root: labRoot,
    cacheDir: path.join(labRoot, ".vite-cache"),
    // Serves index.html for every path, so `/<slug>` and `/_specimen/<slug>` reach the stage.
    appType: "spa",
    plugins: [
      react(),
      reloadOnEntryChange(path.join(labRoot, "entries")),
      projectStyles(options.styles ?? []),
      ...(options.plugins ?? []),
    ],
    resolve: { alias: options.alias ?? {} },
    // An inline PostCSS config stops Vite from searching the folders above the lab for one,
    // so a host's own PostCSS config never applies to the lab by accident.
    css: { postcss: { plugins: options.postcssPlugins ?? [] } },
    define: {
      __LAB_REPO_ROOT__: JSON.stringify(repoRoot),
      __LAB_DIR__: JSON.stringify(path.relative(repoRoot, labRoot).split(path.sep).join("/")),
    },
    server: {
      port: options.port ?? LAB_DEFAULT_PORT,
      strictPort: true,
      // Screenshots are served from anywhere in the repo through `/@fs/`.
      fs: { allow: [repoRoot] },
    },
  };
}
