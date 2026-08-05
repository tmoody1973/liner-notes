// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// Load env from the repo root .env.local and the convex package's .env.local
// (which carries CONVEX_URL for the Liner Notes deployment). Quote-safe:
// deploy keys contain `|`.
export function loadEnv(): void {
  for (const file of ["../../.env.local", "../../convex/.env.local"]) {
    try {
      const text = readFileSync(resolve(here, file), "utf8");
      for (const line of text.split("\n")) {
        const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (!match) continue;
        const value = match[2].trim().replace(/^["']|["']$/g, "").replace(/\s+#.*$/, "");
        if (!(match[1] in process.env)) process.env[match[1]] = value;
      }
    } catch {
      // file may not exist in judge setups; fine
    }
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name} (see .env.example)`);
  }
  return value;
}
