// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { requireEnv } from "./env.js";

// Client for the Liner Notes deployment (steward run records + work queue).
// anyApi keeps the agent decoupled from convex codegen output across packages.
// ponytail: swap for typed `api` via a shared package if drift ever bites.

export type WorkItem = {
  _id: string;
  rawArtist: string;
  playCount: number;
  stationSlugs: string[];
  topTitle?: string;
  firstPlayedAt?: number;
  lastPlayedAt?: number;
  status: string;
  attempts: number;
};

export type ReviewCandidate = {
  mbid: string;
  name: string;
  evidence: string;
  score: number;
};

export type Artist = {
  _id: string;
  mbid?: string;
  displayName: string;
  rawNames: string[];
  genres?: string[];
};

export class LinerNotesClient {
  private client: ConvexHttpClient;

  constructor() {
    this.client = new ConvexHttpClient(requireEnv("CONVEX_URL"));
  }

  startRun(): Promise<string> {
    return this.client.mutation(anyApi.steward.startRun, {});
  }

  finishRun(runId: string, counts: Record<string, number>, report: string): Promise<null> {
    return this.client.mutation(anyApi.steward.finishRun, { runId, counts, report });
  }

  seedWorklist(
    items: {
      rawArtist: string;
      playCount: number;
      stationSlugs: string[];
      topTitle?: string;
      firstPlayedAt?: number;
      lastPlayedAt?: number;
    }[]
  ): Promise<{ created: number; seen: number }> {
    return this.client.mutation(anyApi.steward.seedWorklist, { items });
  }

  requeueDeferred(): Promise<{ requeued: number }> {
    return this.client.mutation(anyApi.steward.requeueDeferred, {});
  }

  applyResolution(args: {
    workItemId: string;
    rawArtist: string;
    mbid: string;
    displayName: string;
    method: string;
    confidence: number;
    evidence: string;
    runId: string;
  }): Promise<string> {
    return this.client.mutation(anyApi.steward.applyResolution, args);
  }

  queueReview(args: {
    workItemId: string;
    rawArtist: string;
    candidates: ReviewCandidate[];
    adjudicatorNote?: string;
    runId: string;
  }): Promise<null> {
    return this.client.mutation(anyApi.steward.queueReview, args);
  }

  artistsNeedingEnrichment(limit?: number): Promise<Artist[]> {
    return this.client.query(anyApi.steward.artistsNeedingEnrichment, { limit });
  }

  enrichArtist(args: {
    artistId: string;
    genres: string[];
    imageUrl?: string;
    deezerId?: string;
    discogsId?: string;
    mbRelations?: { type: string; targetMbid: string; targetName: string }[];
    track?: {
      title: string;
      isrc?: string;
      releaseYear?: number;
      streamingLinks?: Record<string, string>;
    };
  }): Promise<null> {
    return this.client.mutation(anyApi.steward.enrichArtist, args);
  }

  pendingItems(limit?: number): Promise<WorkItem[]> {
    return this.client.query(anyApi.steward.pendingItems, { limit });
  }

  workItemCounts(): Promise<Record<string, number>> {
    return this.client.query(anyApi.steward.workItemCounts, {});
  }

  datahubStats(): Promise<{
    workItems: { total: number } & Record<string, number>;
    duplicateReviewRows: number;
    artists: { total: number; resolved: number; enriched: number };
  }> {
    return this.client.query(anyApi.steward.datahubStats, {});
  }

  markItem(id: string, status: string, runId: string): Promise<null> {
    return this.client.mutation(anyApi.steward.markItem, { id, status, runId });
  }

  // ── Graph build (M3) ─────────────────────────────────────────────────

  catalogArtists(): Promise<
    {
      _id: string;
      mbid?: string;
      displayName: string;
      rawNames: string[];
      genres: string[];
      mbRelations: { type: string; targetMbid: string; targetName: string }[];
    }[]
  > {
    return this.client.query(anyApi.graph.catalogArtists, {});
  }

  async clearGraph(): Promise<{ deleted: number }> {
    let deleted = 0;
    // Chunked server-side deletes; loop until the mutation reports done.
    for (;;) {
      const result = (await this.client.mutation(anyApi.graph.clearGraph, {})) as {
        deleted: number;
        done: boolean;
      };
      deleted += result.deleted;
      if (result.done) return { deleted };
    }
  }

  insertNeighborhoods(items: { name: string; description?: string }[]): Promise<string[]> {
    return this.client.mutation(anyApi.graph.insertNeighborhoods, { items });
  }

  insertNodes(
    items: {
      artistId: string;
      spinCount: number;
      firstAired?: number;
      lastAired?: number;
      stations: string[];
      neighborhoodId?: string;
      bridgeScore?: number;
    }[]
  ): Promise<number> {
    return this.client.mutation(anyApi.graph.insertNodes, { items });
  }

  insertEdges(
    items: {
      fromArtistId: string;
      toArtistId: string;
      type: string;
      weight: number;
      receipt: Record<string, unknown>;
    }[]
  ): Promise<number> {
    return this.client.mutation(anyApi.graph.insertEdges, { items });
  }

  // Paginated server-side (32k-docs-per-query limit); aggregated here.
  async graphStats(): Promise<{
    nodes: number;
    edges: number;
    edgesByType: Record<string, number>;
    neighborhoods: number;
    nodesWithBridgeScore: number;
    nodesWithNeighborhood: number;
  }> {
    const edgesByType: Record<string, number> = {};
    let cursor: string | null = null;
    for (;;) {
      const page = (await this.client.query(anyApi.graph.graphStats, { cursor })) as {
        edgesByType: Record<string, number>;
        continueCursor: string | null;
        done: boolean;
        nodes?: number;
        neighborhoods?: number;
        nodesWithBridgeScore?: number;
        nodesWithNeighborhood?: number;
      };
      for (const [type, count] of Object.entries(page.edgesByType)) {
        edgesByType[type] = (edgesByType[type] ?? 0) + count;
      }
      if (page.done) {
        return {
          nodes: page.nodes ?? 0,
          edges: Object.values(edgesByType).reduce((a, b) => a + b, 0),
          edgesByType,
          neighborhoods: page.neighborhoods ?? 0,
          nodesWithBridgeScore: page.nodesWithBridgeScore ?? 0,
          nodesWithNeighborhood: page.nodesWithNeighborhood ?? 0,
        };
      }
      cursor = page.continueCursor;
    }
  }

  judgePlays(): Promise<
    {
      artistRaw: string;
      titleRaw?: string;
      playedAt?: number;
      stationSlug: string;
      enrichmentStatus: string;
    }[]
  > {
    return this.client.query(anyApi.steward.judgePlays, {});
  }
}
