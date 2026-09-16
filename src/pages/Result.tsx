// src/pages/Result.tsx
// WHAT: the match sheet — art, title, "Times discovered", actions, Vibe & Tone,
//       PLUS the two social pieces that were described but never built:
//       (1) where you were when you Shazamed it, with a per-discovery share toggle;
//       (2) friends who also found this song, and when relative to you.
// WHY:  reads the song from router state (set by Listening) and falls back to the
//       mock, exactly as the roadmap specifies, so Supabase can slot in behind it.
// A11Y: icon buttons are labelled; tags are a list; toggle is a real switch.
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Play, Plus, Heart, Share, Tag, Headphones, ListPlus, Captions, Clapperboard, MapPin, Users } from "lucide-react";
import { cn } from "../lib/utils";
import { MOCK_SONG, MOCK_PLACE, MOCK_FRIEND_OVERLAP, relativeTime } from "../lib/data/mock";
import { ENVIRONMENT_LABEL, type Song, type Environment } from "../lib/types";

const ACTIONS = [
  { id: "listen",  label: "Listen",  Icon: Headphones },
  { id: "library", label: "Add",     Icon: ListPlus },
  { id: "lyrics",  label: "Lyrics",  Icon: Captions },
  { id: "video",   label: "Video",   Icon: Clapperboard },
];

export function Result() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const state = useLocation().state as { song?: Song; env?: Environment; corrections?: { from: string; to: string }[] } | null;
  const song = state?.song ?? MOCK_SONG;
  const env: Environment = state?.env ?? "bar";
  const corrections = state?.corrections ?? [];

  const [tags, setTags] = useState(song.communityTags);
  const [newTag, setNewTag] = useState("");
  const [saved, setSaved] = useState(false);
  const [sharePlace, setSharePlace] = useState(MOCK_PLACE.shareWithFriends);

  // Signifier: "Lyrics" label peeks out once so the icon-only button teaches itself.
  const [showSignifier, setShowSignifier] = useState(!reduceMotion);
  useEffect(() => { const t = setTimeout(() => setShowSignifier(false), 1800); return () => clearTimeout(t); }, []);

  const addTag = (e: React.FormEvent) => {
    e.preventDefault();
    const t = newTag.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setNewTag("");
  };

  return (
    <div className="flex flex-col min-h-full pb-32 bg-bg">
      {/* Hero */}
      <div className="relative px-6 pt-14 pb-6">
        <button onClick={() => navigate("/")} aria-label="Close" className="absolute top-3 right-3 size-11 flex items-center justify-center rounded-full bg-fill text-label">
          <X size={20} aria-hidden />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="size-52 rounded-xl bg-bg-secondary overflow-hidden mb-6 shadow-[0_16px_40px_rgba(0,0,0,0.5)] relative">
            {song.albumArtUrl && <img src={song.albumArtUrl} alt={`${song.title} album art`} className="w-full h-full object-cover" />}
            <button aria-label={`Preview ${song.title}`} className="absolute inset-0 flex items-center justify-center opacity-0 focus-visible:opacity-100 hover:opacity-100 bg-bg/40 transition-opacity">
              <Play size={40} fill="currentColor" aria-hidden />
            </button>
          </div>
          <motion.h1
            initial={reduceMotion ? {} : { opacity: 0, scale: 0.94, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="t-large-title text-glow"
          >
            {song.title}
          </motion.h1>
          <p className="t-title3 text-label-secondary font-normal mt-1">{song.artist}</p>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Count + save/share */}
        <div className="flex items-center justify-between rounded-xl bg-bg-secondary p-4">
          <div>
            <p className="t-title2 tabular">{song.discoverCount.toLocaleString()}</p>
            <p className="t-footnote text-label-secondary">times discovered</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSaved((s) => !s)} aria-pressed={saved} aria-label="Save to My Discoveries"
              className={cn("size-11 rounded-full flex items-center justify-center", saved ? "bg-tint text-white" : "bg-fill text-label")}>
              <Heart size={20} fill={saved ? "currentColor" : "none"} aria-hidden />
            </button>
            <button aria-label="Share" className="size-11 rounded-full bg-fill flex items-center justify-center text-label"><Share size={20} aria-hidden /></button>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-4 gap-2">
          {ACTIONS.map(({ id, label, Icon }) => (
            <button key={id} aria-label={label} className="relative h-16 rounded-lg bg-bg-secondary flex flex-col items-center justify-center gap-1 text-label">
              <Icon size={22} aria-hidden />
              <span className="t-caption1 text-label-secondary">{label}</span>
              <AnimatePresence>
                {id === "lyrics" && showSignifier && (
                  <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="absolute -top-2 rounded-full bg-tint text-white t-caption2 px-2 py-0.5" aria-hidden>
                    Fix lyrics
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </div>

        {/* Where you were */}
        <section className="rounded-xl bg-bg-secondary divide-y divide-separator" aria-labelledby="place-h">
          <div className="flex items-center gap-3 p-4">
            <MapPin size={20} className="text-tint shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <h2 id="place-h" className="t-headline truncate">{MOCK_PLACE.label}</h2>
              <p className="t-footnote text-label-secondary">Just now · {ENVIRONMENT_LABEL[env]}</p>
            </div>
          </div>
          <label className="flex items-center justify-between p-4 cursor-pointer">
            <span className="t-body">Show this place to friends</span>
            <button role="switch" aria-checked={sharePlace} onClick={() => setSharePlace((v) => !v)}
              className={cn("w-[51px] h-[31px] rounded-full p-0.5 transition-colors", sharePlace ? "bg-success" : "bg-fill")}>
              <span className={cn("block size-[27px] rounded-full bg-white shadow transition-transform", sharePlace && "translate-x-5")} />
            </button>
          </label>
        </section>

        {/* Friends who found it too */}
        <section className="rounded-xl bg-bg-secondary" aria-labelledby="friends-h">
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <Users size={18} className="text-label-secondary" aria-hidden />
            <h2 id="friends-h" className="t-headline">{MOCK_FRIEND_OVERLAP.length} friends found this before you</h2>
          </div>
          <ul className="divide-y divide-separator">
            {MOCK_FRIEND_OVERLAP.map((f) => (
              <li key={f.userId} className="flex items-center gap-3 px-4 py-3">
                <img src={f.avatarUrl} alt="" className="size-9 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="t-subheadline font-semibold">{f.name}</p>
                  <p className="t-footnote text-label-secondary truncate">
                    {relativeTime(f.discoveredAt)} · {ENVIRONMENT_LABEL[f.environment]}{f.placeLabel ? ` · ${f.placeLabel}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Vibe & tone */}
        <section className="rounded-xl bg-bg-secondary p-4" aria-labelledby="tags-h">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={18} className="text-label-secondary" aria-hidden />
            <h2 id="tags-h" className="t-headline">Vibe & tone</h2>
          </div>
          <ul className="flex flex-wrap gap-2 mb-4" aria-label="Community descriptors">
            {tags.map((t) => <li key={t} className="rounded-full bg-fill px-3 py-1.5 t-subheadline">{t}</li>)}
          </ul>
          <form onSubmit={addTag} className="flex gap-2">
            <label htmlFor="new-tag" className="visually-hidden">Add a descriptor</label>
            <input id="new-tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="How does it feel? e.g. Late night"
              className="flex-1 h-11 rounded-md bg-fill-secondary px-4 t-body placeholder:text-label-tertiary outline-none focus-visible:ring-2 ring-tint" />
            <button type="submit" disabled={!newTag.trim()} aria-label="Add descriptor" className="size-11 rounded-md bg-tint text-white flex items-center justify-center disabled:opacity-40">
              <Plus size={20} aria-hidden />
            </button>
          </form>
        </section>

        {/* Corrections receipt — proves the edits travelled with the match. */}
        {corrections.length > 0 && (
          <p className="t-footnote text-label-tertiary px-1">
            You fixed {corrections.length} {corrections.length === 1 ? "word" : "words"} — thanks, that helps the next listener.
          </p>
        )}
      </div>
    </div>
  );
}
