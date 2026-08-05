// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import type { Artist, LinerNotesClient } from "./convex.js";
import { sonovaultLinksByIsrc } from "./sonovault.js";
import {
  deezerSearchArtist,
  discogsSearchArtist,
  mbGetArtist,
  mbSearchRecording,
} from "./sources.js";

// Enrichment for a resolved artist: genres + artist relationships from
// MusicBrainz, image + id from Deezer, id from Discogs (cache hit from the
// resolve pass), and ISRC + release year for the most-played track.

export interface EnrichmentResult {
  genres: number;
  relations: number;
  image: boolean;
  isrc: boolean;
  releaseYear?: number;
  streamingLinks: number;
}

export async function enrichOne(
  artist: Artist,
  topTitle: string | undefined,
  linerNotes: LinerNotesClient
): Promise<EnrichmentResult | null> {
  if (!artist.mbid) return null;

  const detail = await mbGetArtist(artist.mbid);
  const [deezer, discogs] = await Promise.all([
    deezerSearchArtist(artist.displayName).catch(() => null),
    discogsSearchArtist(artist.displayName).catch(() => null),
  ]);
  let track:
    | { title: string; isrc?: string; releaseYear?: number; streamingLinks?: Record<string, string> }
    | undefined;
  if (topTitle) {
    track = { title: topTitle };
    try {
      const recording = await mbSearchRecording(topTitle, artist.mbid);
      track = { title: topTitle, isrc: recording.isrc, releaseYear: recording.releaseYear };
    } catch {
      // keep the bare title; ISRC/year stay unset
    }
    if (track.isrc) {
      const links = await sonovaultLinksByIsrc(track.isrc);
      if (links) track.streamingLinks = links;
    }
  }

  await linerNotes.enrichArtist({
    artistId: artist._id,
    genres: detail.genres,
    imageUrl: deezer?.imageUrl,
    deezerId: deezer?.id,
    discogsId: discogs?.id,
    mbRelations: detail.relations.length > 0 ? detail.relations : undefined,
    track,
  });

  return {
    genres: detail.genres.length,
    relations: detail.relations.length,
    image: Boolean(deezer?.imageUrl),
    isrc: Boolean(track?.isrc),
    releaseYear: track?.releaseYear,
    streamingLinks: Object.keys(track?.streamingLinks ?? {}).length,
  };
}
