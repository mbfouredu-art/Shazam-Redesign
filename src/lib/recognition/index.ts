// src/lib/recognition/index.ts
// WHAT: picks the engine. `?engine=olaf` on the URL (or VITE_RECOGNIZER) opts in;
//       everything else gets the mock so Figma Make previews keep working.
import type { Recognizer } from "./types";
import { mockRecognizer } from "./mock";
import { olafRecognizer } from "./olaf";

export type { Recognizer, RecognitionEvent, RecognitionSession } from "./types";

export function getRecognizer(): Recognizer {
  const fromUrl = new URLSearchParams(window.location.search).get("engine");
  const choice = fromUrl ?? import.meta.env.VITE_RECOGNIZER ?? "mock";
  return choice === "olaf" ? olafRecognizer : mockRecognizer;
}
