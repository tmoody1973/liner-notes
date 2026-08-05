// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { loadEnv } from "./env.js";
import { runSession } from "./session.js";

loadEnv();

const modeArg = process.argv.find((a) => a.startsWith("--mode="))?.split("=")[1];
const maxItemsArg = process.argv.find((a) => a.startsWith("--max-items="))?.split("=")[1];
const maxItems = maxItemsArg ? Number(maxItemsArg) : undefined;

runSession(modeArg, { maxItems }).catch((error) => {
  console.error(`steward session failed: ${(error as Error).stack ?? error}`);
  process.exit(1);
});
