// src/lib/recognition/types.ts
// WHAT: the contract Listening.tsx codes against, regardless of engine.
// WHY:  three engines are planned (mock now, Olaf-WASM for the web demo,
//       ShazamKit via Capacitor on iPhone). One interface keeps the UI untouched.
// HOW:  a session emits events; the page subscribes and drives its state machine.
import type { Environment, Song } from "../types";

export type RecognitionEvent =
  | { type: "level"; levels: number[] }                    // 0..1 per bar, for the waveform
  | { type: "transcript"; words: string[]; partial: boolean } // live words (speech-to-text)
  | { type: "progress"; value: number }                    // 0..100 confidence / search progress
  | { type: "match"; song: Song; confidence: number }
  | { type: "no-match"; reason: "timeout" | "low-confidence" | "silence" }
  | { type: "error"; message: string; code: "mic-denied" | "unsupported" | "engine" };

export interface RecognitionSession {
  /** Stop capturing and release the mic. Safe to call twice. */
  stop(): void;
}

export interface Recognizer {
  readonly name: string;
  start(opts: { environment: Environment; onEvent: (e: RecognitionEvent) => void }): Promise<RecognitionSession>;
}
