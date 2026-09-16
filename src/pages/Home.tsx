// src/pages/Home.tsx
// WHAT: the Shazam gradient home — one big button, plus the environment picker.
// WHY:  proportions now follow the real app (button ≈ 200pt with a soft halo,
//       "Tap to Shazam" in Title 3, presets as iOS grouped tiles).
// A11Y: the picker is a radiogroup (arrow keys move, one is always checked); the
//       button announces which preset it will use; idle pulse stops under reduced motion.
import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Volume2, ShoppingBag, Volume1 } from "lucide-react";
import { cn } from "../lib/utils";
import type { Environment } from "../lib/types";

const ENVIRONMENTS: { id: Environment; label: string; hint: string; Icon: typeof Volume2 }[] = [
  { id: "auto",  label: "Auto",         hint: "Senses the room",         Icon: Sparkles },
  { id: "bar",   label: "Noisy bar",    hint: "Heavy crowd noise",       Icon: Volume2 },
  { id: "mall",  label: "Crowded mall", hint: "Ambient chatter",         Icon: ShoppingBag },
  { id: "faint", label: "Faint audio",  hint: "Quiet or distant source", Icon: Volume1 },
];

/** Shazam's own "S" glyph is trademarked; this is an original mark with the same
 *  gesture — two mirrored arcs — so the button reads as "listen" without copying. */
function ListenGlyph() {
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" fill="none" aria-hidden>
      <path d="M50 18c-8-8-22-8-30 0s-8 22 0 30l6 6" stroke="white" strokeWidth="7" strokeLinecap="round" />
      <path d="M34 66c8 8 22 8 30 0s8-22 0-30l-6-6" stroke="white" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

export function Home() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [activeEnv, setActiveEnv] = useState<Environment>("auto");
  const active = ENVIRONMENTS.find((e) => e.id === activeEnv)!;

  const pulse = reduceMotion ? {} : { scale: [1, 1.04, 1] };
  const halo  = reduceMotion ? { opacity: 0.35 } : { scale: [1, 1.16, 1], opacity: [0.5, 0, 0.5] };

  return (
    <div
      className="flex flex-col min-h-full relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #2E8BFF 0%, #0F62E0 48%, #0A3FB8 100%)" }}
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 pt-16 pb-32">
        <p className="t-title3 text-white">Tap to Shazam</p>

        <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: "1.5px solid rgba(255,255,255,0.3)" }}
            animate={halo}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          <motion.div animate={pulse} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
            <motion.button
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              onClick={() => navigate("/listening", { state: { env: activeEnv } })}
              aria-label={`Shazam. Start listening, ${active.label} preset.`}
              className="flex items-center justify-center rounded-full"
              style={{
                width: 200, height: 200,
                background: "radial-gradient(circle at 40% 35%, rgba(255,255,255,0.32), rgba(255,255,255,0.14) 70%)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35)",
              }}
            >
              <ListenGlyph />
            </motion.button>
          </motion.div>
        </div>

        <div className="w-full max-w-xs">
          <p id="env-label" className="t-footnote text-white/70 mb-2 px-1">Listening for</p>
          <div role="radiogroup" aria-labelledby="env-label" className="grid grid-cols-2 gap-2.5">
            {ENVIRONMENTS.map(({ id, label, hint, Icon }) => {
              const isActive = activeEnv === id;
              return (
                <button
                  key={id}
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setActiveEnv(id)}
                  onKeyDown={(e) => {
                    // Arrow keys cycle presets, per the WAI-ARIA radiogroup pattern.
                    const idx = ENVIRONMENTS.findIndex((x) => x.id === id);
                    if (e.key === "ArrowRight" || e.key === "ArrowDown") setActiveEnv(ENVIRONMENTS[(idx + 1) % 4].id);
                    if (e.key === "ArrowLeft" || e.key === "ArrowUp") setActiveEnv(ENVIRONMENTS[(idx + 3) % 4].id);
                  }}
                  className={cn(
                    "flex flex-col items-start gap-2 p-3.5 rounded-lg text-left transition-colors min-h-[72px]",
                    isActive ? "bg-white/25 ring-1 ring-white/80 text-white" : "bg-white/10 text-white/70"
                  )}
                >
                  <Icon size={20} aria-hidden />
                  <div>
                    <p className="t-subheadline font-semibold">{label}</p>
                    <p className="t-caption1 opacity-75">{hint}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
