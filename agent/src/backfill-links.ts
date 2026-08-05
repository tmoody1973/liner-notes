// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { loadEnv, requireEnv } from "./env.js";
import { say } from "./narrate.js";
import { sonovaultLinksByIsrc } from "./sonovault.js";
import { deezerSearchTrack, deezerTrackByIsrc, type DeezerTrack } from "./sources.js";

// MOO-471 backfill: for every track in the catalog, fill streaming links
// (SonoVault by ISRC) and Deezer link + 30s preview (by ISRC, else polite
// artist+title search). Deezer's track object carries the ISRC, so search
// hits also backfill missing ISRCs. Idempotent: merges, never overwrites,
// and every HTTP response is disk-cached — re-runs are free.

type BackfillTrack = {
  _id: string;
  title: string;
  artistName: string;
  isrc?: string;
  previewUrl?: string;
  streamingLinks: Record<string, string>;
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]|feat\..*$|ft\..*$/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();

// Guard against wrong-song search hits: artist must match, titles must overlap.
function plausibleMatch(track: BackfillTrack, hit: DeezerTrack): boolean {
  const a = norm(track.artistName);
  const ha = norm(hit.artistName);
  if (!a || !ha || (!ha.includes(a) && !a.includes(ha))) return false;
  const t = norm(track.title);
  const ht = norm(hit.title);
  return Boolean(t && ht && (ht.includes(t) || t.includes(ht)));
}

async function main() {
  loadEnv();
  const client = new ConvexHttpClient(requireEnv("CONVEX_URL"));
  const tracks = (await client.query(
    anyApi.steward.tracksForBackfill,
    {}
  )) as BackfillTrack[];
  say(`Backfill worklist: ${tracks.length} tracks.`);

  const counts = { sonovault: 0, deezerLink: 0, preview: 0, isrc: 0, skipped: 0 };
  for (const [i, track] of tracks.entries()) {
    const label = `${track.artistName} — ${track.title}`;
    const patch: {
      isrc?: string;
      previewUrl?: string;
      streamingLinks?: Record<string, string>;
    } = {};
    const links: Record<string, string> = {};

    // Deezer first: it can supply a missing ISRC for the SonoVault call.
    let hit: DeezerTrack | null = null;
    if (track.isrc) hit = await deezerTrackByIsrc(track.isrc).catch(() => null);
    if (!hit && track.artistName) {
      const found = await deezerSearchTrack(track.artistName, track.title).catch(
        () => null
      );
      if (found && plausibleMatch(track, found)) hit = found;
    }
    if (hit) {
      if (!track.streamingLinks.deezer) {
        links.deezer = hit.link;
        counts.deezerLink += 1;
      }
      if (!track.previewUrl && hit.previewUrl) {
        patch.previewUrl = hit.previewUrl;
        counts.preview += 1;
      }
      if (!track.isrc && hit.isrc) {
        patch.isrc = hit.isrc;
        counts.isrc += 1;
      }
    }

    const isrc = track.isrc ?? hit?.isrc;
    if (isrc && Object.keys(track.streamingLinks).length === 0) {
      const sono = await sonovaultLinksByIsrc(isrc);
      if (sono) {
        Object.assign(links, { ...sono, ...links });
        counts.sonovault += 1;
      }
    }

    if (Object.keys(links).length > 0) patch.streamingLinks = links;
    if (Object.keys(patch).length > 0) {
      await client.mutation(anyApi.steward.setTrackMedia, {
        trackId: track._id,
        ...patch,
      });
      say(
        `[${i + 1}/${tracks.length}] ${label}: ${Object.keys(patch).join(", ")}`
      );
    } else {
      counts.skipped += 1;
    }
  }

  say(
    `Backfill done. sonovault=${counts.sonovault} deezerLink=${counts.deezerLink} ` +
      `preview=${counts.preview} isrcFilled=${counts.isrc} unchanged=${counts.skipped}`
  );
}

main().catch((err) => {
  console.error("backfill failed:", err);
  process.exit(1);
});
