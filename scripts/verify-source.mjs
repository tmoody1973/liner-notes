#!/usr/bin/env node
// Read-only smoke test against the source deployment (rm-playlist-v2) via
// Convex's streaming export REST API. Proves the deploy key works and real
// rows come back. Zero dependencies. Usage: npm run verify:source

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Minimal .env.local loader (no dotenv dep): KEY=value, optional quotes.
function loadEnvLocal() {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!match) continue;
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!(match[1] in process.env)) process.env[match[1]] = value;
    }
  } catch {
    // no .env.local — rely on the ambient environment
  }
}

loadEnvLocal();

const url = process.env.CONVEX_SOURCE_URL;
const key = process.env.CONVEX_SOURCE_DEPLOY_KEY;

if (!url || !key) {
  console.error(
    "Missing CONVEX_SOURCE_URL or CONVEX_SOURCE_DEPLOY_KEY (set them in .env.local — see .env.example).\n" +
      "Judge mode: skip this check and run `npm run seed` instead."
  );
  process.exit(1);
}

const headers = { Authorization: `Convex ${key}` };

const schemaRes = await fetch(`${url}/api/json_schemas`, { headers });
if (!schemaRes.ok) {
  console.error(`json_schemas failed: HTTP ${schemaRes.status} — ${await schemaRes.text()}`);
  process.exit(1);
}
const tables = Object.keys(await schemaRes.json()).sort();
console.log(`Source deployment reachable. ${tables.length} tables: ${tables.join(", ")}`);

let cursor = null;
let count = 0;
let pages = 0;
const MAX_PAGES = 5; // enough to prove real data without walking the full table

do {
  const params = new URLSearchParams({ tableName: "plays" });
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`${url}/api/list_snapshot?${params}`, { headers });
  if (!res.ok) {
    console.error(`list_snapshot failed: HTTP ${res.status} — ${await res.text()}`);
    process.exit(1);
  }
  const page = await res.json();
  count += page.values.length;
  cursor = page.cursor;
  pages += 1;
  if (!page.hasMore) {
    console.log(`plays: ${count} rows total (complete count).`);
    process.exit(0);
  }
} while (pages < MAX_PAGES);

console.log(`plays: ${count}+ rows (stopped after ${MAX_PAGES} pages; more exist).`);
