// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0

// Result shapes of the Convex queries in convex/convex/app.ts. The web
// workspace talks to Convex through anyApi (no codegen across workspaces —
// same pattern as /review), so these types are maintained by hand.

export type ArtistLite = {
  artistId: string;
  displayName: string;
  imageUrl?: string;
  genres: string[];
  spinCount: number;
  stations: string[];
  neighborhoodId?: string;
  bridgeScore?: number;
};

export type EdgeReceipt = {
  coPlayCount?: number;
  stations?: string[];
  exampleShowDate?: number;
  mbRelationType?: string;
  quote?: string;
  citationUrl?: string;
  relationType?: string;
  confidence?: number;
};

export type EgoEdge = {
  id: string;
  from: string;
  to: string;
  type: string; // "curation" | "canonical" | "editorial"
  weight: number;
  receipt: EdgeReceipt;
};

export type EgoNetwork = {
  focus: string;
  nodes: ArtistLite[];
  edges: EgoEdge[];
};

export type Resolution = {
  method: string;
  confidence: number;
  evidence: string;
  runId?: string;
  resolvedAt?: number;
};

export type TrackLite = {
  id: string;
  title: string;
  isrc?: string;
  releaseYear?: number;
  previewUrl?: string;
  streamingLinks: Record<string, string>;
};

export type ArtistPanel = {
  artistId: string;
  displayName: string;
  rawNames: string[];
  mbid?: string;
  imageUrl?: string;
  genres: string[];
  resolution: Resolution | null;
  lastRunAt: number | null;
  spinCount: number;
  firstAired?: number;
  lastAired?: number;
  stations: string[];
  bridgeScore?: number;
  neighborhood: { id: string; name: string } | null;
  tracks: TrackLite[];
};

export type Neighborhood = {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
};

export function formatDate(ms: number | undefined | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
