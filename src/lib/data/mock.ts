// src/lib/data/mock.ts
// WHAT: the single home for hardcoded demo data (was scattered across pages).
// WHY:  centralising it means the Supabase layer replaces ONE module, and the pages
//       already read the real shapes from ../types.
import type { Song, FriendOverlap, FriendActivity, Place } from "../types";

export const MOCK_SONG: Song = {
  id: "seed-m83-midnight-city",
  title: "Midnight City",
  artist: "M83",
  albumArtUrl: "https://images.unsplash.com/photo-1614613535308-eb51bd3d2c17?auto=format&fit=crop&w=400&q=80",
  discoverCount: 12_405_192,
  communityTags: ["Synthwave", "Night drive", "Nostalgic", "Upbeat"],
};

/** Demo place — Pittsburgh, near Miles. Real value comes from geolocation + reverse geocode. */
export const MOCK_PLACE: Place = {
  lat: 40.4655, lng: -79.9606,
  label: "Spirit, Lawrenceville",
  shareWithFriends: true,
};

export const MOCK_FRIEND_OVERLAP: FriendOverlap[] = [
  { userId: "u-sarah", name: "Sarah J.", discoveredAt: "2026-08-02T03:12:00Z", environment: "bar", placeLabel: "Spirit, Lawrenceville",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces" },
  { userId: "u-alex", name: "Alex R.", discoveredAt: "2025-11-19T22:40:00Z", environment: "mall",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces" },
];

export const MOCK_FRIENDS_ACTIVITY: FriendActivity[] = [
  { id: "a1", user: { name: "Sarah J.", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces" },
    song: { title: "Blinding Lights", artist: "The Weeknd" }, timeLabel: "2 hours ago", environment: "bar", placeLabel: "Spirit, Lawrenceville" },
  { id: "a2", user: { name: "Mike T.", avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop&crop=faces" },
    song: { title: "Inner City Blues", artist: "Kevin Saunderson" }, timeLabel: "5 hours ago", environment: "faint" },
  { id: "a3", user: { name: "Alex R.", avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces" },
    song: { title: "Strobe", artist: "deadmau5" }, timeLabel: "Yesterday", environment: "mall", placeLabel: "Ross Park Mall" },
];

/** Formats "when they found it vs. you" copy. Kept here so Result and Profile agree. */
export function relativeTime(iso: string, now = new Date()): string {
  const days = Math.round((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  return `${Math.round(days / 365)} years ago`;
}
