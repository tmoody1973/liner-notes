// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Rate-limit-polite fetch: per-host minimum interval, exponential backoff on
// 429/5xx, and an optional JSON file cache. All external APIs the steward
// talks to (Convex streaming export, MusicBrainz, Discogs, Deezer in MOO-462)
// go through this.

const CACHE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../.cache");
const lastCallPerHost = new Map<string, number>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface PoliteOptions {
  minIntervalMs?: number; // per-host spacing (default 250ms)
  retries?: number; // backoff retries on 429/5xx (default 4)
  cacheKey?: string; // if set, cache the JSON response on disk under this key
  headers?: Record<string, string>;
  method?: string; // default GET; POST bodies (Perplexity) get the same politeness
  body?: string;
}

export async function politeFetchJson<T = unknown>(
  url: string,
  { minIntervalMs = 250, retries = 4, cacheKey, headers, method, body }: PoliteOptions = {}
): Promise<T> {
  if (cacheKey) {
    const cached = readCache<T>(cacheKey);
    if (cached !== undefined) return cached;
  }

  const host = new URL(url).host;
  for (let attempt = 0; ; attempt++) {
    const waitUntil = (lastCallPerHost.get(host) ?? 0) + minIntervalMs;
    const now = Date.now();
    if (now < waitUntil) await sleep(waitUntil - now);
    lastCallPerHost.set(host, Date.now());

    const response = await fetch(url, { headers, method: method ?? "GET", body });
    if (response.ok) {
      const json = (await response.json()) as T;
      if (cacheKey) writeCache(cacheKey, json);
      return json;
    }
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt >= retries) {
      throw new Error(
        `${method ?? "GET"} ${url} failed: HTTP ${response.status} ${await response.text()}`
      );
    }
    const retryAfter = Number(response.headers.get("retry-after")) * 1000;
    const backoff = retryAfter > 0 ? retryAfter : 500 * 2 ** attempt;
    await sleep(backoff);
  }
}

function cachePath(key: string): string {
  return join(CACHE_DIR, `${createHash("sha256").update(key).digest("hex").slice(0, 24)}.json`);
}

function readCache<T>(key: string): T | undefined {
  try {
    return JSON.parse(readFileSync(cachePath(key), "utf8")) as T;
  } catch {
    return undefined;
  }
}

function writeCache(key: string, value: unknown): void {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath(key), JSON.stringify(value));
}
