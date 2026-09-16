// src/lib/types.ts
// WHAT: the shared data shapes every page and adapter agrees on.
// WHY:  the backend roadmap's rule is "swap the data SOURCE, not the SHAPE" — pages
//       type against these, so mock → Supabase → ShazamKit is a one-file change.

/** Listening presets. `auto` means "let ambient-noise sensing pick one". */
export type Environment = "auto" | "bar" | "mall" | "faint";

/** Where a discovery happened. Stored per-discovery, never on the profile. */
export interface Place {
  lat: number;
  lng: number;
  /** Human label from reverse geocoding, e.g. "Spirit, Lawrenceville". */
  label: string;
  /** Per-discovery privacy: friends only see the place if the user opted in. */
  shareWithFriends: boolean;
}

export interface Song {
  id: string;            // catalog id (Olaf index id now; ISRC / ShazamKit id later)
  title: string;
  artist: string;
  albumArtUrl?: string;
  /** Global "Times Discovered" count — an aggregate over `discoveries`. */
  discoverCount: number;
  communityTags: string[];
}

export interface Discovery {
  id: string;
  songId: string;
  userId: string;
  environment: Environment;
  createdAt: string;     // ISO timestamp
  place?: Place;
}

/** A friend who has also discovered the same song — powers the Result overlap module. */
export interface FriendOverlap {
  userId: string;
  name: string;
  avatarUrl?: string;
  discoveredAt: string;
  environment: Environment;
  placeLabel?: string;
}

export interface FriendActivity {
  id: string;
  user: { name: string; avatarUrl: string };
  song: Pick<Song, "title" | "artist">;
  timeLabel: string;
  environment: Environment;
  placeLabel?: string;
}

export const ENVIRONMENT_LABEL: Record<Environment, string> = {
  auto: "Auto",
  bar: "Noisy bar",
  mall: "Crowded mall",
  faint: "Faint audio",
};
