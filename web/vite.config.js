import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { intakeApiPlugin } from "./server/intakeApi.js";

// The dashboard reads the governed campaign JSON from the repo root
// (../data/...), so the dev server must be allowed to serve files from the
// parent directory. This keeps a SINGLE source of truth: the same campaign
// file the Phase 01 gate validates is the one the UI renders.
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  // intakeApiPlugin registers /api/campaigns + /api/intake ONLY on the `vite
  // dev` server (Vite's configureServer hook is dev-only — it does not run
  // for `vite preview` or the static `vite build` output). That is a
  // deliberate boundary: local sovereign execution (`npm run dev`) gets a real
  // operator intake form; a statically hosted build has no write backend and
  // the UI degrades to its existing read-only, bundled-sample behavior.
  plugins: [react(), intakeApiPlugin()],
  server: {
    fs: { allow: [repoRoot] },
  },
});
