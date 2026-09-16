// vite.config.ts
// WHAT: the build config Figma Make normally injects at runtime but does not commit.
// WHY:  without it, `pnpm dev` outside Make starts a server with no Tailwind plugin
//       (unstyled app) and no `@/` alias (import errors). Fable / Claude Code and
//       the Figma "Make in your local codebase" beta both need this file present.
// HOW:  three pieces — React fast-refresh, Tailwind v4's Vite plugin (replaces the
//       old tailwind.config.js + PostCSS), and the `@` → `src` alias mirrored from tsconfig.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    // Mic capture (getUserMedia) requires a secure context. localhost counts, but
    // testing on a real iPhone over LAN needs https — see docs/RECOGNITION.md.
    port: 5173,
    host: true,
  },
});
