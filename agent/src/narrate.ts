// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0

const PHASES = ["orient", "detect", "resolve", "enrich", "document"] as const;
export type Phase = (typeof PHASES)[number];

export function phaseBanner(phase: Phase): void {
  const index = PHASES.indexOf(phase) + 1;
  console.log(`\n━━━ ${index}/${PHASES.length} ${phase.toUpperCase()} ${"━".repeat(Math.max(4, 40 - phase.length))}`);
}

export function say(message: string): void {
  console.log(`  ${message}`);
}
