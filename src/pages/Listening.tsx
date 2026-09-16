// src/pages/Listening.tsx
// WHAT: live listen screen — real-or-mock waveform, editable transcript, song reveal.
// WHY:  the page no longer owns timers or fake data; it subscribes to a Recognizer
//       (mock today, Olaf/ShazamKit later) and runs a small state machine:
//         idle → listening → (match → reveal → /result) | (no-match) | (error)
//       Transcript edits are collected and passed forward as `corrections` — that's
//       the crowd-data differentiator, so they must not be decorative.
// A11Y: aria-live announces status changes and the match; every word is a labelled
//       button; edit row has a real <label>; no-match and mic-denied get real UI.
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, X, MicOff, RotateCcw } from "lucide-react";
import { cn } from "../lib/utils";
import { getRecognizer, type RecognitionSession } from "../lib/recognition";
import type { Environment, Song } from "../lib/types";

const STATUS_COPY: Record<Environment, string[]> = {
  auto:  ["Listening…", "Searching…", "Expanding search…", "Almost there…"],
  bar:   ["Filtering crowd noise…", "Isolating the melody…", "Matching fingerprint…", "Almost there…"],
  mall:  ["Ducking ambient chatter…", "Following the hook…", "Matching fingerprint…", "Almost there…"],
  faint: ["Boosting faint signal…", "Sharpening frequencies…", "Matching fingerprint…", "Almost there…"],
};

interface Word { id: string; text: string; original: string; status: "detecting" | "locked" | "editing" }
type Phase = "listening" | "reveal" | "no-match" | "error";

export function Listening() {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const env: Environment = location.state?.env ?? "auto";

  const [phase, setPhase] = useState<Phase>("listening");
  const [errorMsg, setErrorMsg] = useState("");
  const [words, setWords] = useState<Word[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [progress, setProgress] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(28).fill(0.1));
  const [song, setSong] = useState<Song | null>(null);
  const sessionRef = useRef<RecognitionSession | null>(null);
  const [attempt, setAttempt] = useState(0); // bump to retry

  const phrases = STATUS_COPY[env];
  const statusPhrase = phrases[Math.min(Math.floor((progress / 100) * phrases.length), phrases.length - 1)];

  // Subscribe to the recognizer. Cleanup stops the mic when the user leaves.
  useEffect(() => {
    let cancelled = false;
    setPhase("listening"); setWords([]); setProgress(0); setSong(null);
    getRecognizer()
      .start({
        environment: env,
        onEvent: (e) => {
          if (cancelled) return;
          switch (e.type) {
            case "level": setLevels(e.levels); break;
            case "progress": setProgress(e.value); break;
            case "transcript":
              // Merge: keep user edits, append new words as "detecting".
              setWords((prev) => e.words.map((t, i) => prev[i] ?? { id: `w-${i}`, text: t, original: t, status: "detecting" }));
              break;
            case "match":
              setSong(e.song); setPhase("reveal");
              break;
            case "no-match": setPhase("no-match"); break;
            case "error": setErrorMsg(e.message); setPhase("error"); break;
          }
        },
      })
      .then((s) => { if (cancelled) s.stop(); else sessionRef.current = s; })
      .catch((err: { message?: string }) => { setErrorMsg(err.message ?? "Couldn't start listening"); setPhase("error"); });
    return () => { cancelled = true; sessionRef.current?.stop(); };
  }, [env, attempt]);

  // Words settle from "detecting" (glowing) to "locked" after 2 s unless being edited.
  useEffect(() => {
    const t = setTimeout(() => setWords((p) => p.map((w) => (w.status === "detecting" ? { ...w, status: "locked" } : w))), 2000);
    return () => clearTimeout(t);
  }, [words.length]);

  // After the reveal, hand everything to /result via router state.
  useEffect(() => {
    if (phase !== "reveal" || !song) return;
    const corrections = words.filter((w) => w.text !== w.original).map((w) => ({ from: w.original, to: w.text }));
    const t = setTimeout(() => navigate("/result", { state: { song, env, corrections } }), reduceMotion ? 600 : 1600);
    return () => clearTimeout(t);
  }, [phase, song, words, env, navigate, reduceMotion]);

  const startEdit = (w: Word) => { setEditingId(w.id); setEditValue(w.text); setWords((p) => p.map((x) => (x.id === w.id ? { ...x, status: "editing" } : x))); };
  const saveEdit = useCallback((id: string) => { setWords((p) => p.map((x) => (x.id === id ? { ...x, text: editValue.trim() || x.text, status: "locked" } : x))); setEditingId(null); }, [editValue]);
  const cancelEdit = (id: string) => { setWords((p) => p.map((x) => (x.id === id ? { ...x, status: "locked" } : x))); setEditingId(null); };

  return (
    <div className="flex flex-col min-h-full px-5 pt-14 pb-32 bg-bg text-label relative">
      {/* Song-name reveal — the one orchestrated moment. */}
      <AnimatePresence>
        {phase === "reveal" && song && (
          <motion.div
            role="status" aria-live="assertive"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/80 backdrop-blur-2xl px-6 text-center"
          >
            <span className="t-footnote text-tint text-glow-tint mb-4">Match found</span>
            <motion.h1
              initial={reduceMotion ? {} : { opacity: 0, scale: 0.85, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="t-display text-glow"
            >
              {song.title}
            </motion.h1>
            <p className="t-title3 text-label-secondary mt-3">{song.artist}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="t-headline text-tint text-glow-tint flex items-center gap-2">
          <span className="inline-block size-2 rounded-full bg-tint animate-pulse" aria-hidden />
          Listening
        </h1>
        <button onClick={() => navigate("/")} className="t-body text-tint min-h-11 px-2">Cancel</button>
      </div>

      {/* Waveform + status. aria-live so VoiceOver hears the phase changes. */}
      <div className="rounded-xl bg-bg-secondary p-4 mb-6">
        <div className="flex items-end justify-center gap-[3px] h-20" aria-hidden>
          {levels.map((lvl, i) => (
            <motion.div key={i} className="flex-1 rounded-full min-w-[2px]"
              animate={{ height: `${Math.round(lvl * 100)}%` }}
              transition={{ duration: reduceMotion ? 0 : 0.11, ease: "easeOut" }}
              style={{ background: "linear-gradient(180deg, var(--color-orange) 0%, var(--color-tint) 100%)" }} />
          ))}
        </div>
        <div className="flex justify-between items-center mt-3" aria-live="polite">
          <span className="t-subheadline text-label-secondary">{phase === "listening" ? statusPhrase : ""}</span>
          <span className="t-footnote text-label-tertiary tabular">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Non-happy paths — these were missing entirely before. */}
      {phase === "no-match" && (
        <div role="alert" className="rounded-xl bg-bg-secondary p-5 mb-6">
          <p className="t-headline mb-1">No match yet</p>
          <p className="t-subheadline text-label-secondary mb-4">
            Try getting closer to the speaker, or search by the words you caught below.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setAttempt((a) => a + 1)} className="flex items-center gap-2 h-11 px-4 rounded-md bg-tint text-white t-subheadline font-semibold">
              <RotateCcw size={16} aria-hidden /> Listen again
            </button>
            <button onClick={() => navigate("/result", { state: { lyricQuery: words.map((w) => w.text).join(" "), env } })}
              disabled={words.length === 0}
              className="h-11 px-4 rounded-md bg-fill t-subheadline font-semibold disabled:opacity-40">
              Search by lyrics
            </button>
          </div>
        </div>
      )}
      {phase === "error" && (
        <div role="alert" className="rounded-xl bg-bg-secondary p-5 mb-6 flex gap-3">
          <MicOff className="text-destructive shrink-0" aria-hidden />
          <div>
            <p className="t-headline mb-1">Microphone unavailable</p>
            <p className="t-subheadline text-label-secondary">{errorMsg}. Allow the mic in Settings, then try again.</p>
          </div>
        </div>
      )}

      {/* Transcript */}
      <h2 className="t-footnote text-label-secondary mb-2 px-1">Words we're hearing. Tap one to fix it.</h2>
      <div className="flex-1 rounded-xl bg-bg-secondary p-5 flex flex-wrap gap-x-3 gap-y-2 content-start items-center min-h-40" role="list" aria-label="Live transcript">
        <AnimatePresence>
          {words.map((word) => (
            <motion.div key={word.id} role="listitem" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {word.status === "editing" ? (
                <div className="flex items-center rounded-md bg-bg ring-1 ring-tint h-12 overflow-hidden">
                  <label htmlFor={`edit-${word.id}`} className="visually-hidden">Correct the word {word.original}</label>
                  <input id={`edit-${word.id}`} type="text" value={editValue} autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit(word.id); if (e.key === "Escape") cancelEdit(word.id); }}
                    className="bg-transparent px-3 w-36 t-title3 outline-none" />
                  <button onClick={() => saveEdit(word.id)} aria-label="Confirm correction" className="w-12 h-12 flex items-center justify-center text-success"><Check size={22} aria-hidden /></button>
                  <button onClick={() => cancelEdit(word.id)} aria-label="Cancel correction" className="w-12 h-12 flex items-center justify-center text-destructive"><X size={22} aria-hidden /></button>
                </div>
              ) : (
                <button onClick={() => startEdit(word)} aria-label={`Edit word ${word.text}`} disabled={editingId !== null}
                  className={cn("t-title2 min-h-11 px-1 rounded-sm transition-colors",
                    word.status === "detecting" ? "text-label text-glow" : "text-label-secondary",
                    word.text !== word.original && "underline decoration-tint decoration-2 underline-offset-4")}>
                  {word.text}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {words.length === 0 && phase === "listening" && (
          <p className="t-subheadline text-label-tertiary">Waiting for vocals…</p>
        )}
      </div>
    </div>
  );
}
