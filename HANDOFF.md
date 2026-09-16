# Handoff — Shazam Redesign

A redesigned, upgraded Shazam concept focused on **noisy environments** (bars, malls, faint audio) with smarter UX: an environment-context selector before listening, a live **editable lyric transcript**, crowd-sourced "Vibe & Tone" tags, a global "Times Discovered" count, and a social feed of friends' discoveries. Dark-mode first, built on the **IBM Carbon Design System** (Gray 100 theme).

> This doc is the onboarding entrypoint. `AGENTS.md` is the canonical source for project structure, build/dev, styling, and font wiring — read it too rather than relying on a copy here.

## Stack & running it

- **React 19** + **Vite** + **Tailwind CSS v4** (`@tailwindcss/vite`, no config file)
- **framer-motion** for animation, **@carbon/icons-react** for icons
- Package manager: **pnpm**

```bash
pnpm install
pnpm dev      # Vite dev server (hot reload)
pnpm build    # production build
pnpm preview  # preview the build
pnpm format   # oxfmt
```

## File map

| Path | Role |
| --- | --- |
| `src/main.tsx` | Entry; mounts `App`, imports `index.css` |
| `src/App.tsx` | Renders `RouterProvider` |
| `src/routes.tsx` | `createBrowserRouter`; `Shell` wraps `Home`/`Listening`/`Result`/`Profile` |
| `src/components/layout/Shell.tsx` | App shell + fixed bottom nav (Discover / Profile) |
| `src/pages/Home.tsx` | Blue-gradient home; breathing Shazam button; 2×2 environment selector |
| `src/pages/Listening.tsx` | Live audio-reactive waveform, env-aware status copy, editable transcript, full-screen song-name reveal |
| `src/pages/Result.tsx` | Song hero, Times Discovered, streaming actions, Vibe & Tone tags |
| `src/pages/Profile.tsx` | Friend-activity feed + My Discoveries tabs |
| `src/index.css` | Tailwind import, Carbon tokens, fonts, glow utilities |
| `src/lib/utils.ts` | `cn()` = clsx + tailwind-merge |

## Design system

- **Theme:** Carbon Design System, **Gray 100** dark. Tokens defined in `src/index.css` (`--background #161616`, `--card #262626`, `--border #393939`, `--muted-foreground #c6c6c6`, success `#24a148`, destructive `#fa4d56`).
- **Accent:** Carbon Blue 60 `#0f62fe` — the single accent color.
- **Corners:** sharp everywhere — enforced by a global `* { border-radius: 0 !important }`. Round shapes (e.g. the Home button) use inline `border-radius: 50%`.
- **Type:** IBM Plex Sans (`--font-sans`), IBM Plex Mono (`--font-mono`), and **Playfair Display** (`--font-serif`, `.font-serif`) for the illuminated song title. All loaded via one Google Fonts `@import` at the top of `src/index.css`.
- **"Illuminated" text:** `.text-glow` (white halo) and `.text-glow-blue` (blue halo) utilities in `src/index.css` — used by the `LISTENING…` header, the large transcript words, and the song-name reveal / result title.
- **Signature motion:** Home button idle breathing pulse → blue→orange audio-reactive waveform on Listening → full-screen glowing song-name reveal that leads into the Result page.

## What's real vs mocked

Everything runs on hardcoded data; there is **no audio capture, API, auth, or persistence**. Local UI state (edited words, added tags, favorites) resets on navigation.

| Area | Mock (file) | Needs |
| --- | --- | --- |
| Detected lyrics | `MOCK_STREAM` (`Listening.tsx`) | Real mic capture + recognition |
| Revealed title | `REVEAL_TITLE` (`Listening.tsx`) | Resolved match, passed via router state |
| Song + stats + tags | `MOCK_SONG` (`Result.tsx`) | DB-backed song, discovery count, crowd tags |
| Friend feed | `MOCK_FRIENDS_ACTIVITY` (`Profile.tsx`) | Social graph + friends' discoveries |

See `plans/backend-roadmap.md` for the prioritized plan to replace these.

## Working with Claude Code + models

- Switch models with `/model`. Use **Fable** (`claude-fable-5`) for feature build-out; reach for **Opus** on the heaviest architecture (audio fingerprinting/DSP, data modeling).
- For a focused hard subtask, spawn a subagent with a per-task model override so it doesn't disturb the main thread.

## Next steps

Start with `plans/backend-roadmap.md`. The recommended order: Supabase data layer → auth → wire Result/Profile to real data → real audio recognition on Listening.
