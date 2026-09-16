// src/pages/Profile.tsx
// WHAT: Friends feed + My discoveries, as iOS segmented control + grouped lists.
// WHY:  the feed items now carry environment AND place (when the friend shared it),
//       which is the social claim of the redesign.
// A11Y: real tablist/tab/tabpanel; keyboard arrow switching; avatars decorative.
import { useState } from "react";
import { Search, UserPlus, MapPin } from "lucide-react";
import { cn } from "../lib/utils";
import { MOCK_FRIENDS_ACTIVITY } from "../lib/data/mock";
import { ENVIRONMENT_LABEL } from "../lib/types";

type Tab = "friends" | "mine";
const TABS: { id: Tab; label: string }[] = [{ id: "friends", label: "Friends" }, { id: "mine", label: "My discoveries" }];

export function Profile() {
  const [tab, setTab] = useState<Tab>("friends");

  return (
    <div className="flex flex-col min-h-full bg-bg pb-32">
      <div className="px-5 pt-14 pb-3 flex items-end justify-between">
        <h1 className="t-large-title">Friends</h1>
        <button className="flex items-center gap-1.5 text-tint t-body min-h-11 px-1">
          <UserPlus size={18} aria-hidden /> Add
        </button>
      </div>

      <div className="px-5 mb-4">
        <div role="tablist" aria-label="Feed" className="flex rounded-md bg-fill-secondary p-0.5">
          {TABS.map((t) => (
            <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") setTab(tab === "friends" ? "mine" : "friends"); }}
              className={cn("flex-1 h-9 rounded-[7px] t-subheadline font-semibold transition-colors", tab === t.id ? "bg-bg-tertiary text-label shadow" : "text-label-secondary")}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="px-5">
        {tab === "friends" ? (
          <ul className="rounded-xl bg-bg-secondary divide-y divide-separator">
            {MOCK_FRIENDS_ACTIVITY.map((a) => (
              <li key={a.id} className="flex gap-3 p-4">
                <img src={a.user.avatarUrl} alt="" className="size-10 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="t-subheadline">
                    <span className="font-semibold">{a.user.name}</span>
                    <span className="text-label-secondary"> found </span>
                    <span className="font-semibold">{a.song.title}</span>
                    <span className="text-label-secondary"> by {a.song.artist}</span>
                  </p>
                  <p className="t-footnote text-label-secondary mt-1 flex items-center gap-1 flex-wrap">
                    <span>{a.timeLabel}</span>
                    <span aria-hidden>·</span>
                    <span>{ENVIRONMENT_LABEL[a.environment]}</span>
                    {a.placeLabel && (<><span aria-hidden>·</span><MapPin size={12} aria-hidden /><span>{a.placeLabel}</span></>)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl bg-bg-secondary flex flex-col items-center text-center px-6 py-14">
            <Search size={28} className="text-label-tertiary mb-3" aria-hidden />
            <p className="t-headline mb-1">Nothing here yet</p>
            <p className="t-subheadline text-label-secondary">Songs you Shazam will show up here, with where you heard them.</p>
          </div>
        )}
      </div>
    </div>
  );
}
