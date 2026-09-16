import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Checkmark, Close } from "@carbon/icons-react";
import { cn } from "../lib/utils";

const MOCK_STREAM = [
  "I'm", "caught", "up", "in", "the", "middle", "of", "it",
  "I", "can't", "stop", "the", "feeling", "now"
];

// The song revealed at the end of the listen — animates full-screen, then leads into /result.
const REVEAL_TITLE = "Midnight City";

// Environment-aware narrative copy — turns dead wait time into a reassuring,
// context-specific story (per Shazam's "listening → searching → last try" pattern).
const STATUS_COPY: Record<string, string[]> = {
  auto: ["Listening for music…", "Searching…", "Expanding search…", "Locking result…"],
  bar: ["Filtering crowd noise…", "Isolating melody…", "Matching fingerprint…", "Locking result…"],
  mall: ["Ducking ambient chatter…", "Following the hook…", "Matching fingerprint…", "Locking result…"],
  faint: ["Boosting faint signal…", "Sharpening frequencies…", "Matching fingerprint…", "Locking result…"],
};

interface Word {
  id: string;
  text: string;
  status: "detecting" | "locked" | "editing";
}

export function Listening() {
  const navigate = useNavigate();
  const location = useLocation();
  const env = location.state?.env || "auto";

  const [words, setWords] = useState<Word[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [matchProgress, setMatchProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: 28 }, () => 0.2));
  const inputRef = useRef<HTMLInputElement>(null);

  const phrases = STATUS_COPY[env] || STATUS_COPY.auto;
  const phraseIndex = Math.min(
    Math.floor((matchProgress / 100) * phrases.length),
    phrases.length - 1
  );
  const statusPhrase = isFinished ? phrases[phrases.length - 1] : phrases[phraseIndex];

  // Faux audio level — drives the reactive waveform while listening.
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setLevels(prev => prev.map(() => 0.15 + Math.random() * 0.85));
    }, 110);
    return () => clearInterval(interval);
  }, [isFinished]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < MOCK_STREAM.length) {
        const newWord = { id: `w-${index}`, text: MOCK_STREAM[index], status: "detecting" as const };
        setWords(prev => [...prev, newWord]);
        index++;
        setMatchProgress(prev => Math.min(prev + (100 / MOCK_STREAM.length), 100));
      } else {
        clearInterval(interval);
        setIsFinished(true);
        setTimeout(() => {
          navigate("/result");
        }, 1500);
      }
    }, 600);
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    const timeouts = words.map((w, i) => {
      if (w.status === "detecting") {
        return setTimeout(() => {
          setWords(prev => {
            const copy = [...prev];
            if (copy[i] && copy[i].status !== "editing") {
              copy[i] = { ...copy[i], status: "locked" };
            }
            return copy;
          });
        }, 2000);
      }
      return null;
    });
    return () => { timeouts.forEach(t => t && clearTimeout(t)); };
  }, [words]);

  const handleWordClick = (id: string, currentText: string) => {
    setEditingId(id);
    setEditValue(currentText);
    setWords(prev => prev.map(w => w.id === id ? { ...w, status: "editing" } : w));
  };

  const handleSaveEdit = (id: string) => {
    setWords(prev => prev.map(w => w.id === id ? { ...w, text: editValue, status: "locked" } : w));
    setEditingId(null);
  };

  const handleCancelEdit = (id: string) => {
    setWords(prev => prev.map(w => w.id === id ? { ...w, status: "locked" } : w));
    setEditingId(null);
  };

  return (
    <div className="flex flex-col min-h-full px-4 pt-20 pb-8 bg-[#161616] text-[#f4f4f4] relative">
      
      {/* Full-screen illuminated song-name reveal — blurs the transcription behind it,
          the title glows in, then the effect leads straight into /result. */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#161616]/75 backdrop-blur-2xl px-6"
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[10px] uppercase tracking-[0.4em] text-[#0f62fe] font-mono mb-6 text-glow-blue"
            >
              Match Found
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, scale: 0.82, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="font-mono font-bold uppercase text-5xl leading-[1.05] tracking-tight text-center text-white text-glow"
            >
              {REVEAL_TITLE}
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => navigate("/")}
        className="absolute top-20 right-4 text-sm text-[#c6c6c6] hover:text-[#f4f4f4] hover:underline"
      >
        Cancel
      </button>

      <div className="flex flex-col items-center pb-4 mb-4">
        <div className="flex items-center gap-2">
          <svg className="animate-spin text-[#0f62fe]" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h2 className="text-sm font-mono font-medium uppercase tracking-[0.25em] text-[#0f62fe] text-glow-blue">
            Listening...
          </h2>
        </div>
      </div>

      <p className="text-xs text-[#8d8d8d] font-mono uppercase tracking-wide mb-6 leading-relaxed">
        [Env: {env}] Real-time transcription active. Tap to correct.
      </p>

      {/* Audio-reactive visual — the orb "grows in" from the tapped button for continuity,
          then pulses a live waveform tinted blue→orange while listening. */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="mb-8"
      >
        <div
          className="w-full flex items-center justify-center gap-[3px] h-24 px-2 border border-[#393939] bg-[#262626] overflow-hidden"
          aria-hidden
        >
          {levels.map((lvl, i) => (
            <motion.div
              key={i}
              className="flex-1"
              animate={{ height: `${Math.round(lvl * 100)}%` }}
              transition={{ duration: 0.11, ease: "easeOut" }}
              style={{
                minWidth: 2,
                background: "linear-gradient(180deg, #ff832b 0%, #0f62fe 100%)",
              }}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs mt-2">
          <motion.span
            key={statusPhrase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#c6c6c6] font-mono"
          >
            {statusPhrase}
          </motion.span>
          <span className="font-mono text-[#8d8d8d]">{Math.round(matchProgress)}%</span>
        </div>
      </motion.div>

      <div className="mb-2">
        <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8d8d8d]">Live Transcription</span>
      </div>

      <div className="flex-1 bg-[#262626] border border-[#393939] p-6 flex flex-wrap gap-x-4 gap-y-3 content-start items-center overflow-y-auto">
        <AnimatePresence>
          {words.map((word) => (
            <motion.div
              key={word.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative"
            >
              {word.status === "editing" ? (
                <div className="flex items-center bg-[#161616] border border-[#0f62fe] h-12">
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    className="bg-transparent text-[#f4f4f4] px-3 w-40 text-2xl outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(word.id);
                      if (e.key === 'Escape') handleCancelEdit(word.id);
                    }}
                  />
                  <button onClick={() => handleSaveEdit(word.id)} className="w-12 h-12 flex items-center justify-center bg-[#262626] hover:bg-[#393939] border-l border-[#393939] text-[#24a148]">
                    <Checkmark size={20} />
                  </button>
                  <button onClick={() => handleCancelEdit(word.id)} className="w-12 h-12 flex items-center justify-center bg-[#262626] hover:bg-[#393939] border-l border-[#393939] text-[#fa4d56]">
                    <Close size={20} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleWordClick(word.id, word.text)}
                  className={cn(
                    "text-3xl font-medium transition-all duration-300",
                    word.status === "detecting"
                      ? "text-white text-glow"
                      : "text-[#8d8d8d] hover:text-[#f4f4f4]"
                  )}
                >
                  {word.text}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
