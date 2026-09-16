# Backend / Complex-Parts Roadmap

Scoped plan for the non-UI work that turns the mocked prototype into a real app. Each section names the mock it replaces so the existing UI (props/shape) can be preserved. Recommended order top-to-bottom.

## 0. Data-access layer (do this first)

Introduce `src/lib/api.ts` (or `src/lib/data/*`) as the single place components read data from. Swap each `MOCK_*` constant for a function/subscription that returns the **same shape**, so pages don't need structural rewrites — only their data source changes.

- `getSong(id)` → replaces `MOCK_SONG` in `Result.tsx`
- `getFriendActivity()` → replaces `MOCK_FRIENDS_ACTIVITY` in `Profile.tsx`
- `recognize(stream)` / transcript subscription → replaces `MOCK_STREAM` + faux `levels` in `Listening.tsx`

## 1. Supabase data layer

Supabase integration is available in this environment (see the Supabase skill / `create_supabase_secret` for keys — keep secrets server-side, never in client code).

Schema sketch:
- `songs` — id, title, artist, album_art_url, metadata
- `discoveries` — id, user_id, song_id, environment (`auto|bar|mall|faint`), created_at. Powers the global **Times Discovered** count on `Result.tsx` (aggregate) and the friend feed.
- `tags` + `song_tags` — crowd-sourced Vibe & Tone; replaces `MOCK_SONG.communityTags`. Upsert on add; de-dupe per song.
- `profiles` — user profile (display name, avatar) linked to auth user
- `friendships` — user_id ↔ friend_id (+ status); powers `Profile.tsx` friend activity

Add RLS policies: users read public song/tag data; discoveries readable by self + friends; writes scoped to the authenticated user.

## 2. Auth

- Supabase Auth (email/OAuth). Add a session provider above the router in `src/App.tsx`; expose `useSession()`.
- Gate Profile/social behind auth; Home/Listening/Result can work anonymously, but a discovery is only persisted once signed in.

## 3. Audio recognition (hardest — Opus-worthy)

Replaces the `setInterval` mock stream and random `levels` in `Listening.tsx`.
- Capture mic via `getUserMedia` + Web Audio API; drive the existing waveform from a real analyser node (`levels`).
- Recognition: choose between a **third-party recognition API** (fastest path) vs. **custom fingerprinting** (biggest lift — landmark/constellation hashing; likely a server component). Decide based on licensing/cost.
- Feed the returned transcript into the existing editable-word UI (keep the `detecting → locked → editing` state machine); drive `matchProgress` from real confidence.
- On match, pass the resolved song into the reveal + navigate: `navigate("/result", { state: { song } })`, replacing the hardcoded `REVEAL_TITLE` / `MOCK_SONG` coupling. Update `Result.tsx` to read from router state (fall back to a fetch by id).
- The editable-transcript corrections are a differentiator: capture them as feedback (store corrections to improve matching / crowd data).

## 4. Social feed & live counters

- Wire `Profile.tsx` friend feed to real `discoveries` joined with `profiles` (most recent first, with environment tag).
- Real-time **Times Discovered**: increment on each discovery; use a Supabase subscription or on-load aggregate for the Result count.
- "Add Friend" flow → `friendships` insert.

## Constraints & notes

- Preserve the current visual system (Carbon Gray 100, glow utilities, motion) — this roadmap is data/logic only.
- Keep all API keys out of the client bundle; use Supabase RLS + edge functions / secrets for anything privileged.
- Environment selector (`env`) is already threaded from Home → Listening via router state; persist it onto each `discovery` for the noisy-environment analytics angle.
