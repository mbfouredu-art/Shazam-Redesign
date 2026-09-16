// src/lib/recognition/mock.ts
// WHAT: the scripted demo engine — replays a transcript, fakes levels, then "matches".
// WHY:  keeps the prototype demoable with no mic permission and no catalog, and is
//       the engine Figma Make's preview will use. Also the reference for how the
//       event stream is expected to look, which the Olaf adapter must reproduce.
import type { Recognizer, RecognitionEvent } from "./types";
import { MOCK_SONG } from "../data/mock";

const SCRIPT = ["I'm", "caught", "up", "in", "the", "middle", "of", "it", "I", "can't", "stop", "the", "feeling", "now"];

export const mockRecognizer: Recognizer = {
  name: "mock",
  async start({ onEvent }) {
    let i = 0;
    let stopped = false;
    const emit = (e: RecognitionEvent) => !stopped && onEvent(e);

    // Fake amplitude ~9 fps — the same cadence the real analyser will produce.
    const levelTimer = setInterval(() => {
      emit({ type: "level", levels: Array.from({ length: 28 }, () => 0.15 + Math.random() * 0.85) });
    }, 110);

    // One word every 600 ms, then a match 1.2 s after the last word.
    const wordTimer = setInterval(() => {
      if (i < SCRIPT.length) {
        i++;
        emit({ type: "transcript", words: SCRIPT.slice(0, i), partial: true });
        emit({ type: "progress", value: Math.round((i / SCRIPT.length) * 100) });
      } else {
        clearInterval(wordTimer);
        setTimeout(() => emit({ type: "match", song: MOCK_SONG, confidence: 0.94 }), 1200);
      }
    }, 600);

    return {
      stop() {
        stopped = true;
        clearInterval(levelTimer);
        clearInterval(wordTimer);
      },
    };
  },
};
