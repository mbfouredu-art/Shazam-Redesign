import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { PlayFilledAlt, Add, Favorite, Share, Tag, Close, Headphones, MusicAdd, ListChecked, Video } from "@carbon/icons-react";
import { cn } from "../lib/utils";

const ACTIONS = [
  { id: "listen", label: "Listen", Icon: Headphones },
  { id: "library", label: "Add", Icon: MusicAdd },
  { id: "lyrics", label: "Lyrics", Icon: ListChecked },
  { id: "video", label: "Video", Icon: Video },
];

const MOCK_SONG = {
  title: "Midnight City",
  artist: "M83",
  albumUrl: "https://images.unsplash.com/photo-1614613535308-eb51bd3d2c17?auto=format&fit=crop&w=400&q=80",
  discoverCount: "12,405,192",
  communityTags: ["Synthwave", "Night Drive", "Nostalgic", "Upbeat"],
};

export function Result() {
  const navigate = useNavigate();
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState(MOCK_SONG.communityTags);

  // Animated signifier — the "Lyrics" label briefly expands out of its button on
  // first view, then collapses back in, teaching the affordance (per Pratt critique).
  const [showSignifier, setShowSignifier] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowSignifier(false), 1800);
    return () => clearTimeout(t);
  }, []);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-10 bg-[#161616] font-sans">
      
      {/* Hero Section */}
      <div className="w-full bg-[#262626] border-b border-[#393939] p-6 pb-8 relative pt-12">
        <button 
          onClick={() => navigate("/")}
          className="absolute top-4 left-4 p-2 text-[#c6c6c6] hover:text-[#f4f4f4] hover:bg-[#393939] transition-colors"
          aria-label="Close"
        >
          <Close size={24} />
        </button>

        <div className="flex flex-col items-center text-center mt-4">
          <div className="w-48 h-48 border border-[#393939] bg-[#161616] relative group mb-6 shadow-lg">
            <img src={MOCK_SONG.albumUrl} alt="Album Art" className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="absolute inset-0 bg-[#161616]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm">
               <PlayFilledAlt size={48} className="text-[#f4f4f4]" />
            </div>
          </div>
          
          <motion.h1
            initial={{ opacity: 0, scale: 0.94, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif font-bold text-5xl leading-tight text-[#f4f4f4] text-glow mb-2"
          >
            {MOCK_SONG.title}
          </motion.h1>
          <p className="text-lg text-[#c6c6c6]">{MOCK_SONG.artist}</p>
        </div>
      </div>

      <div className="flex-1 px-4 space-y-8 mt-6">
        
        {/* Stats & Actions */}
        <div className="flex items-center justify-between border-l-4 border-[#0f62fe] pl-4">
          <div className="flex flex-col">
            <span className="text-2xl font-mono text-[#f4f4f4]">{MOCK_SONG.discoverCount}</span>
            <span className="text-[10px] text-[#8d8d8d] uppercase tracking-widest mt-1">Times Discovered</span>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 flex items-center justify-center border border-[#393939] bg-[#262626] hover:bg-[#393939] text-[#f4f4f4] transition-colors">
              <Favorite size={20} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center border border-[#393939] bg-[#262626] hover:bg-[#393939] text-[#f4f4f4] transition-colors">
              <Share size={20} />
            </button>
          </div>
        </div>

        {/* Streaming / discovery actions */}
        <div className="grid grid-cols-4 gap-2">
          {ACTIONS.map(({ id, label, Icon }) => {
            const isSignifier = id === "lyrics";
            return (
              <button
                key={id}
                className="relative h-16 flex flex-col items-center justify-center gap-1.5 border border-[#393939] bg-[#262626] hover:bg-[#393939] text-[#f4f4f4] transition-colors"
              >
                <Icon size={20} />
                <span className="text-[10px] uppercase tracking-wider text-[#c6c6c6]">{label}</span>
                <AnimatePresence>
                  {isSignifier && showSignifier && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="absolute left-full ml-2 whitespace-nowrap overflow-hidden bg-[#0f62fe] text-white text-[10px] uppercase tracking-wider px-2 py-1 font-mono z-10"
                    >
                      Lyrics
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        {/* Community Descriptors (Carbon Tags) */}
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-[#393939] pb-2">
            <Tag size={16} className="text-[#c6c6c6]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#f4f4f4]">Vibe & Tone</h3>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-[#393939] text-[#f4f4f4] text-xs font-mono">
                {tag}
              </span>
            ))}
          </div>

          <form onSubmit={handleAddTag} className="flex flex-col gap-2">
            <label className="text-xs text-[#c6c6c6]">Add Descriptor</label>
            <div className="flex">
              <input
                type="text"
                placeholder="e.g. 'Chill', 'Workout'"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 bg-[#262626] border-b border-[#8d8d8d] px-4 py-3 text-sm text-[#f4f4f4] focus:outline-none focus:border-[#0f62fe] focus:bg-[#393939] transition-colors"
              />
              <button
                type="submit"
                disabled={!newTag.trim()}
                className="w-12 bg-[#0f62fe] text-white disabled:bg-[#393939] disabled:text-[#8d8d8d] flex items-center justify-center transition-colors"
              >
                <Add size={20} />
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
