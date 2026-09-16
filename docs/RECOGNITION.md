# Recognition engines — how listening becomes a match

The UI codes against one interface (`src/lib/recognition/types.ts`). Three engines plug in:

| Engine | Where | Status | Select with |
|---|---|---|---|
| `mock` | everywhere, incl. Figma Make preview | working | default |
| `olaf` | browser (WASM), 20-track seeded catalog | scaffold — needs the wasm build below | `?engine=olaf` or `VITE_RECOGNIZER=olaf` |
| `shazamkit` | iPhone via Capacitor | not started | — |

## 1. Olaf in the browser (web demo)

Olaf = Overly Lightweight Acoustic Fingerprinting (Joren Six, Ghent). Landmark/constellation
hashing — the same family Shazam described in Wang 2003 — so the write-up can explain
the match. AGPL-3.0, and the README carries a patent notice; academic/demo use is the
stated aim of the project. Cite: JOSS paper doi 10.21105/joss.05459.

### One-time toolchain (macOS)
```bash
brew install ffmpeg zig emscripten
git clone https://github.com/JorenSix/Olaf ~/dev/Olaf && cd ~/dev/Olaf
make && sudo make install      # CLI at /usr/local/bin/olaf
zig build test                 # sanity
```

### Seed the catalog
Audio is NOT in this repo. Spotify streams are DRM-locked, so buy/own each file. Put them
in `seed-audio/` (git-ignored), named by the ids in `data/seed-tracks.json`
(e.g. `16-bennett-coast-being-there.mp3`).

```bash
# Desktop index — lets you test matching from the CLI before touching the browser
olaf store seed-audio/
olaf query seed-audio/16-bennett-coast-being-there.mp3   # should match itself
olaf microphone                                          # live mic match from the laptop

# Browser index — the web build has no database; prints are compiled in as a header
make mem
for f in seed-audio/*.mp3; do olaf to_raw "$f"; done
# olaf_mem writes one header per call; concatenate into the header the wasm build includes
bin/olaf_mem store olaf_audio_16-bennett-coast-being-there.raw "16-bennett-coast-being-there" > wasm/olaf_fp_ref_mem.h
# ...repeat/append for the other 19 (a small shell loop; see the Olaf ESP32 docs for the header layout)
make web                                                 # emits wasm/*.wasm + *.js
cp wasm/olaf*.js wasm/olaf*.wasm  <this-repo>/public/olaf/
```
`public/olaf/*` is git-ignored: the wasm embeds fingerprints derived from copyrighted audio,
so it stays local / on the demo host, not in the public repo.

### Wiring left in `src/lib/recognition/olaf.ts`
- Confirm the exported symbol names from the Emscripten build (`_olaf_query`, factory name)
  against `wasm/` in the Olaf repo and adjust the `OlafModule` interface.
- Map the returned identifier to a `Song` via `data/seed-tracks.json` (TODO marked in code).
- If matches are flaky, replace `downsampleTo16k` with libsamplerate-js (what Olaf's own
  browser demo uses).

### Testing on the iPhone
`getUserMedia` needs a secure context. `localhost` is fine on the Mac; on the phone use
`pnpm dev` + a tunnel (`npx localtunnel --port 5173` or `ngrok http 5173`) or the
`@vitejs/plugin-basic-ssl` plugin.

## 2. Lyrics — two different jobs
- **Live transcript** (what the mic hears) = speech-to-text. Plan: `@huggingface/transformers`
  Whisper (tiny/base, WebGPU) fed the same PCM ring buffer. Singing transcription is
  unreliable — which is the *design rationale* for the editable transcript.
- **Lyric fallback search** (fingerprint fails in a loud bar) = LRCLIB. No key, no rate limit:
  `GET https://lrclib.net/api/search?q=<corrected words>`. Corrected words → candidates →
  user confirms. Npm wrapper: `lrclib-api`. This is a flow Shazam does not have.

## 3. ShazamKit on iPhone (later)
Real Shazam catalog, free with an Apple Developer account. Wrap this Vite app with
Capacitor, add a ShazamKit plugin, and register a third `Recognizer`. Signature generation
runs on-device; enable the ShazamKit App Service on the App ID in the developer portal.

## 4. If Olaf never gets built
The demo does not depend on it. Two cheap alternatives for a real "it listens" moment:
- **AudD** recognition API behind a Supabase edge function (keeps the key off the client).
- A richer `mock` that rotates through `data/seed-tracks.json` with a pre-written
  misheard transcript per track, so every tap reveals a different song.
