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
  status: string;
  attempts: number;
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
    items: { rawArtist: string; playCount: number; stationSlugs: string[] }[]
  ): Promise<{ created: number; seen: number }> {
    return this.client.mutation(anyApi.steward.seedWorklist, { items });
  }

  pendingItems(limit?: number): Promise<WorkItem[]> {
    return this.client.query(anyApi.steward.pendingItems, { limit });
  }

  workItemCounts(): Promise<Record<string, number>> {
    return this.client.query(anyApi.steward.workItemCounts, {});
  }

  markItem(id: string, status: string, runId: string): Promise<null> {
    return this.client.mutation(anyApi.steward.markItem, { id, status, runId });
  }

  judgePlays(): Promise<{ artistRaw: string; stationSlug: string; enrichmentStatus: string }[]> {
    return this.client.query(anyApi.steward.judgePlays, {});
  }
}
