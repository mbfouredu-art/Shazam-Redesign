// src/lib/recognition/olaf.ts
// WHAT: adapter for Olaf (Overly Lightweight Acoustic Fingerprinting) compiled to
//       WebAssembly, matching the mic against a SEEDED catalog (data/seed-tracks.json).
// WHY:  Olaf is open source, runs fully in the browser, and implements the same
//       constellation / landmark-hash family of algorithm Shazam published in 2003 —
//       so the demo can explain its own matching in the write-up. The trade-off is
//       that it only knows the ~20 tracks we index; that's fine for a course demo.
// HOW (three stages, see docs/RECOGNITION.md for the build steps):
//   1. Build: `make web` in the Olaf repo (Emscripten `emcc`) emits the wasm + js
//      glue into Olaf's wasm/ folder. Copy them to /public/olaf/. The web build has
//      NO key-value store: the reference fingerprints for our 20 seed tracks are
//      baked into a C header (`olaf_mem store` → .h) at compile time, so re-run
//      `make web` whenever the catalog changes. Steps in docs/RECOGNITION.md.
//   2. Capture: useMicrophone() gives Float32 mono PCM at the AudioContext rate
//      (44.1/48 kHz). Olaf's native input is f32le mono at 16 kHz, so we
//      downsample before handing it over (see `downsampleTo16k` below).
//   3. Query: every ~2 s we hand Olaf the last N seconds of PCM; if the match score
//      clears a threshold we emit `match`, otherwise keep listening until a timeout.
//
// STATUS: scaffold. `start()` throws until olaf.wasm is present, and Listening.tsx
//         falls back to the mock engine — so the prototype never breaks.
import type { Recognizer } from "./types";
import { openMicrophone, suggestEnvironment } from "../audio/useMicrophone";
import { MOCK_SONG } from "../data/mock";

// Olaf's Emscripten module signature is minimal; we type only what we call.
interface OlafModule {
  _olaf_query(ptr: number, length: number): number;   // returns match id or -1
  _malloc(bytes: number): number;
  _free(ptr: number): void;
  HEAPF32: Float32Array;
}

let olafModulePromise: Promise<OlafModule> | null = null;

const OLAF_RATE = 16_000;

/** Nearest-sample decimation from the AudioContext rate to Olaf's 16 kHz.
 *  WHY not a proper low-pass first: fingerprinting only needs spectral peaks, and
 *  a 3 s demo window tolerates the aliasing; swap for libsamplerate-js (what Olaf's
 *  own browser demo uses) if matches look flaky. */
export function downsampleTo16k(pcm: Float32Array, fromRate: number): Float32Array {
  if (fromRate === OLAF_RATE) return pcm;
  const ratio = fromRate / OLAF_RATE;
  const out = new Float32Array(Math.floor(pcm.length / ratio));
  for (let i = 0; i < out.length; i++) out[i] = pcm[Math.floor(i * ratio)];
  return out;
}

async function loadOlaf(): Promise<OlafModule> {
  if (!olafModulePromise) {
    olafModulePromise = (async () => {
      // Emscripten emits a factory on window; we load it lazily so the mock path
      // never pays the wasm download cost.
      const res = await fetch("/olaf/olaf.js", { method: "HEAD" });
      if (!res.ok) throw new Error("olaf.js not found in /public/olaf — see docs/RECOGNITION.md");
      // Loaded as a classic <script>, not an ES import, because Emscripten's
      // default output attaches a global factory rather than exporting a module —
      // and so TypeScript/Vite don't try to resolve a file that only exists at runtime.
      await new Promise<void>((resolve, reject) => {
        const el = document.createElement("script");
        el.src = "/olaf/olaf.js";
        el.onload = () => resolve();
        el.onerror = () => reject(new Error("failed to load /olaf/olaf.js"));
        document.head.appendChild(el);
      });
      const factory = (window as unknown as { createOlafModule?: () => Promise<OlafModule> }).createOlafModule;
      if (!factory) throw new Error("createOlafModule missing — check the Emscripten EXPORT_NAME flag");
      return factory();
    })();
  }
  return olafModulePromise;
}

export const olafRecognizer: Recognizer = {
  name: "olaf",
  async start({ environment, onEvent }) {
    const olaf = await loadOlaf();
    const mic = await openMicrophone({
      onLevels: (levels) => onEvent({ type: "level", levels }),
      onAmbient: (rms) => {
        // In `auto`, tell the UI which preset the room resembles so status copy adapts.
        if (environment === "auto") onEvent({ type: "progress", value: Math.min(99, Math.round(rms * 400)) });
      },
    });

    const QUERY_EVERY_MS = 2000;
    const MAX_LISTEN_MS = 15_000;
    const started = Date.now();
    let stopped = false;

    const timer = setInterval(() => {
      if (stopped) return;
      const pcm = downsampleTo16k(mic.takeBuffer(), mic.sampleRate); // Olaf wants 16 kHz mono
      const ptr = olaf._malloc(pcm.length * 4);
      olaf.HEAPF32.set(pcm, ptr / 4);
      const matchId = olaf._olaf_query(ptr, pcm.length);
      olaf._free(ptr);

      if (matchId >= 0) {
        // TODO: look the id up in data/seed-tracks.json → Song. Using MOCK_SONG until then.
        onEvent({ type: "match", song: { ...MOCK_SONG, id: String(matchId) }, confidence: 0.9 });
        session.stop();
      } else if (Date.now() - started > MAX_LISTEN_MS) {
        onEvent({ type: "no-match", reason: "timeout" });
        session.stop();
      }
    }, QUERY_EVERY_MS);

    const session = {
      stop() {
        if (stopped) return;
        stopped = true;
        clearInterval(timer);
        mic.close();
      },
    };
    void suggestEnvironment; // re-exported for Listening; keeps tree-shaking honest
    return session;
  },
};
