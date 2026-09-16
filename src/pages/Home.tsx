import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Music, MicrophoneFilled, VolumeUpFilled, ShoppingBag, VolumeDownFilled } from "@carbon/icons-react";
import { cn } from "../lib/utils";

const ENVIRONMENTS = [
  { id: "auto",  label: "Auto-Detect",   hint: "Standard conditions",  Icon: MicrophoneFilled },
  { id: "bar",   label: "Noisy Bar",     hint: "Heavy background noise", Icon: VolumeUpFilled },
  { id: "mall",  label: "Crowded Mall",  hint: "Ambient crowd noise",  Icon: ShoppingBag },
  { id: "faint", label: "Faint Audio",   hint: "Quiet or distant source", Icon: VolumeDownFilled },
];


export function Home() {
  const navigate = useNavigate();
  const [activeEnv, setActiveEnv] = useState("auto");

  return (
    <div
      className="flex flex-col min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(175deg, #5aaae8 0%, #1836d0 55%, #1228b8 100%)" }}
    >
      {/* Main centered content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-7 px-8 pb-4">

        <p className="text-white text-xl font-semibold tracking-tight select-none">
          Tap to Shazam
        </p>

        {/* Circular button */}
        <div className="relative flex items-center justify-center" style={{ width: 232, height: 232 }}>
          {/* Outer halo ring — breathing pulse signals "alive & ready" */}
          <motion.div
            className="absolute inset-0"
            style={{
              borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.28)",
            }}
            animate={{ scale: [1, 1.14, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Breathing wrapper keeps the idle pulse independent of tap/hover springs */}
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Circle IS the button */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              onClick={() => navigate("/listening", { state: { env: activeEnv } })}
              className="flex items-center justify-center focus:outline-none"
              style={{
                width: 204,
                height: 204,
                minWidth: 204,
                minHeight: 204,
                borderRadius: "50%",
                padding: 0,
                appearance: "none",
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <Music size={72} className="text-white" />
            </motion.button>
          </motion.div>
        </div>

        {/* Environment selector — 2×2 grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs mt-1">
          {ENVIRONMENTS.map(({ id, label, hint, Icon }) => {
            const isActive = activeEnv === id;
            return (
              <button
                key={id}
                onClick={() => setActiveEnv(id)}
                className={cn(
                  "flex flex-col items-start gap-2 p-3 rounded-xl text-left transition-all duration-200",
                  isActive
                    ? "bg-white/25 ring-1 ring-white/70 text-white"
                    : "bg-white/10 text-white/65 hover:bg-white/18 hover:text-white"
                )}
              >
                <Icon size={20} className={isActive ? "text-white" : "text-white/60"} />
                <div>
                  <p className="text-xs font-semibold leading-tight">{label}</p>
                  <p className="text-[10px] leading-snug mt-0.5 opacity-70">{hint}</p>
                </div>
              </button>
            );
          })}
        </div>

      </div>

      {/* Bottom status */}
      <div className="pb-20 flex justify-center">
        <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest">
          Ready · {ENVIRONMENTS.find(e => e.id === activeEnv)?.label}
        </p>
      </div>
    </div>
  );
}
