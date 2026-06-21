import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// The dashboard reads the governed campaign JSON from the repo root
// (../data/...), so the dev server must be allowed to serve files from the
// parent directory. This keeps a SINGLE source of truth: the same campaign
// file the Phase 01 gate validates is the one the UI renders.
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    fs: { allow: [repoRoot] },
  },
});
