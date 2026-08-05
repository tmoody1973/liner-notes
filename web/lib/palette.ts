// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0

// Neighborhood accents by list order (query order is stable: _creationTime).
// Mirrors the --hood-* CSS variables in globals.css.
export const HOOD_COLORS = ["#f5b942", "#a78bfa", "#fb7185", "#2dd4bf"];
export const HOOD_NONE = "#5b6272";

export const EDGE_COLORS: Record<string, string> = {
  curation: "#7d879e",
  canonical: "#34d399",
  editorial: "#60a5fa", // arrives in M5; the palette anticipates it
};

// Bridge badge threshold: real distribution is p95≈0.22 with a clear elite
// band 0.6–1.0 (all Milwaukee cross-scene connectors); 0.5 captures them.
export const BRIDGE_THRESHOLD = 0.5;

export function hoodColor(index: number | undefined): string {
  if (index === undefined || index < 0) return HOOD_NONE;
  return HOOD_COLORS[index % HOOD_COLORS.length];
}
