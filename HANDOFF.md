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

- **Base:** Apple iOS 26 (dark) + SF Pro via the system font stack. Tokens in `src/index.css` `@theme`: `bg` #000, `bg-secondary` #1C1C1E, `tint` #0A84FF (swap to Shazam brand #0088FF if wanted), iOS radius scale 8/12/16/22, HIG text styles as `.t-*` utilities.
- **Figma:** build against Apple's official *iOS and iPadOS 26* UI kit (Figma Community 1527721578857867021). Icons: SF Symbols in Figma, lucide in code.
- **Kept from the Carbon version:** `.text-glow` / `.text-glow-tint`, the breathing button, blue→orange waveform, full-screen reveal. All motion respects `prefers-reduced-motion`.
- **Migration note:** the Carbon Gray-100 theme, IBM Plex, `@carbon/icons-react`, and the global `border-radius: 0` are gone. They were the loudest "not Shazam" tells.

## What's real vs mocked

Mic capture and the waveform are real when an engine other than `mock` is selected (`src/lib/audio/useMicrophone.ts`). Matching, auth, and persistence are still mocked; the Supabase schema is in `supabase/migrations/0001_init.sql` and the engine plan in `docs/RECOGNITION.md`. Round-trip workflow with Figma Make: `docs/FIGMA-MAKE-ROUNDTRIP.md`.

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
