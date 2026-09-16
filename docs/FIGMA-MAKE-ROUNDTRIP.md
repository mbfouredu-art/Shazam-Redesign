# Round-trip: Figma Make ⇄ GitHub ⇄ Fable / Claude Code

Goal: design and quick prototyping in Figma Make; heavy logic in the repo with Fable;
the repo is the single source of truth.

## Ground rules (both directions)
1. **Pages never own data or timers.** They read shapes from `src/lib/types.ts` and events
   from `getRecognizer()`. Make can restyle a page freely; Fable can swap engines freely.
2. **Tokens live in `src/index.css` `@theme`.** Restyle by editing tokens or Tailwind
   classes — do not reintroduce hard-coded hex values in pages.
3. **The mock engine is the default.** Make's preview has no mic and no wasm, so anything
   Make renders runs on `mock`. Engines are opt-in via `?engine=`.
4. **Files Make regenerates** (`vite.config.ts`, `AGENTS.md`) are committed here anyway so
   `pnpm dev` works outside Make. If Make overwrites them on import, take Make's version and
   re-add the `@` alias + Tailwind plugin if they went missing.

## Repo → Make
Push to `main`, then in Make use its GitHub import/sync for this repository (Make created
this repo, so it is already linked). Make will show the iOS-26 tokens and the new pages.
Anything Make can't run (mic, wasm) silently uses the mock.

## Make → repo
Export/push from Make to a branch (`make/<date>`), then in Fable:
```bash
git fetch && git switch make/<date>
pnpm install && pnpm dev          # check it runs outside Make
git diff main -- src/pages        # review what Make touched
```
Merge with the rule above: keep Make's *presentation* changes, keep the repo's *data/engine*
changes. Conflicts almost always mean Make put data back into a page — move it to `src/lib`.

## Branches
- `main` — always builds (`pnpm build`), always demoable on `mock`.
- `feat/*` — Fable work (recognition, Supabase, Capacitor).
- `make/*` — imports from Figma Make.

## Getting Claude's chat work into the repo (no git knowledge needed)
Claude (in the chat) can write files straight into this folder on the Mac, but cannot run
git or push. So the loop is:
1. Claude writes/updates files here.
2. You open Claude Code in this folder and paste:
   > Review the uncommitted changes, run `pnpm install` and `pnpm build`, commit them on a
   > branch named `feat/<short-name>`, push it, and open a PR. Don't merge. Give me the link.
3. You press **Merge** on GitHub. Figma Make picks up `main` on its next sync.
