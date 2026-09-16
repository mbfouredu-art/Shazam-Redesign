# Handoff — Shazam Redesign

A redesigned, upgraded Shazam concept focused on **noisy environments** (bars, malls, faint audio) with smarter UX: an environment-context selector before listening, a live **editable lyric transcript** whose corrections travel with the match, crowd-sourced "Vibe & Tone" tags, a global "Times Discovered" count, **where you were** when you Shazamed it (with a per-discovery share toggle), and **friends who found the same song** and when relative to you. Dark-mode first, on **Apple's iOS 26 design system + SF Pro**.

> `AGENTS.md` is the canonical source for project structure, build/dev, styling, and font wiring — read it too rather than relying on a copy here. Round-trip workflow with Figma Make: `docs/FIGMA-MAKE-ROUNDTRIP.md`. Recognition engines: `docs/RECOGNITION.md`.

## Stack & running it

- **React 19** + **Vite** + **Tailwind CSS v4** (`@tailwindcss/vite`; `vite.config.ts` is committed so it runs outside Figma Make)
- **framer-motion** for animation, **lucide-react** for icons
- Package manager: **pnpm**

```bash
pnpm install
pnpm dev      # Vite dev server (hot reload) — http://localhost:5173
pnpm build    # production build
pnpm preview  # preview the build
pnpm format   # oxfmt
```

Engines are opt-in: `http://localhost:5173/?engine=olaf` (needs the wasm build); everything else runs the scripted `mock`.

## File map

| Path | Role |
| --- | --- |
| `src/main.tsx` | Entry; mounts `App`, imports `index.css` |
| `src/App.tsx` | Renders `RouterProvider` |
| `src/routes.tsx` | `createBrowserRouter`; `Shell` wraps `Home`/`Listening`/`Result`/`Profile` |
| `src/components/layout/Shell.tsx` | App frame + floating glass tab bar (Shazam / Friends) |
| `src/pages/Home.tsx` | Blue-gradient home; 200pt breathing button; environment radiogroup |
| `src/pages/Listening.tsx` | Subscribes to a Recognizer; waveform, editable transcript, reveal, no-match + mic-denied states |
| `src/pages/Result.tsx` | Song hero, Times Discovered, actions, place + share toggle, friends overlap, Vibe & Tone |
| `src/pages/Profile.tsx` | Friends feed (env + place) and My discoveries, as a segmented control |
| `src/index.css` | Tailwind import, iOS 26 tokens (`@theme`), HIG text styles, glass + glow utilities |
| `src/lib/types.ts` | Shared shapes: `Environment`, `Song`, `Discovery`, `Place`, `FriendOverlap`, `FriendActivity` |
| `src/lib/data/mock.ts` | ALL hardcoded demo data (single module to replace with Supabase) |
| `src/lib/recognition/` | `Recognizer` contract; `mock` (default), `olaf` (WASM scaffold) |
| `src/lib/audio/useMicrophone.ts` | Web Audio mic capture: waveform levels, ambient RMS, PCM ring buffer |
| `data/seed-tracks.json` | The 20-track demo catalog (from Miles's Spotify On Repeat) |
| `supabase/migrations/0001_init.sql` | Schema, RLS, and RPCs for discoveries, tags, corrections, friendships |
| `src/lib/utils.ts` | `cn()` = clsx + tailwind-merge |

## Design system

- **Base:** Apple iOS 26 (dark) + SF Pro via the system font stack. Tokens in `src/index.css` `@theme`: `bg` #000, `bg-secondary` #1C1C1E, `tint` #0A84FF (swap to Shazam brand #0088FF if wanted), iOS radius scale 8/12/16/22, HIG text styles as `.t-*` utilities.
- **Figma:** build against Apple's official *iOS and iPadOS 26* UI kit (Figma Community 1527721578857867021). Icons: SF Symbols in Figma, lucide in code.
- **Kept from the Carbon version:** `.text-glow` / `.text-glow-tint`, the breathing button, blue→orange waveform, full-screen reveal. All motion respects `prefers-reduced-motion`.
- **Migration note:** the Carbon Gray-100 theme, IBM Plex, `@carbon/icons-react`, and the global `border-radius: 0` are gone. They were the loudest "not Shazam" tells.

## What's real vs mocked

| Area | Today | Replace with |
| --- | --- | --- |
| Waveform + ambient sensing | Real when engine ≠ `mock` (`useMicrophone.ts`) | — |
| Transcript + match | `mockRecognizer` (scripted) | `olafRecognizer` (web) / ShazamKit (iPhone) |
| Song, place, friend overlap, feed | `src/lib/data/mock.ts` | Supabase (`0001_init.sql`) via a `src/lib/api.ts` |
| Auth, persistence | none | Supabase Auth + RLS |

Transcript corrections already travel Listening → Result via router state; persisting them is `transcript_corrections`.

## Working with Claude Code + models

- Switch models with `/model`. Use **Fable** for feature build-out; reach for **Opus** on the heaviest architecture (audio fingerprinting/DSP, data modeling).
- For a focused hard subtask, spawn a subagent with a per-task model override so it doesn't disturb the main thread.

## Next steps

1. Merge `feat/ios26-rebase`, re-import into Figma Make, restyle against the Apple kit.
2. `src/lib/api.ts` over Supabase (schema is ready) → auth → wire Result/Profile.
3. Olaf wasm build (`docs/RECOGNITION.md`) or ShazamKit via Capacitor for the iPhone.
