// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0

export const STATION_LABELS: Record<string, string> = {
  "88nine": "88Nine",
  hyfin: "HYFIN",
  "414music": "414 Music",
  rhythmlab: "Rhythm Lab",
};

export const STATION_SLUGS = Object.keys(STATION_LABELS);

export function stationLabel(slug: string): string {
  return STATION_LABELS[slug] ?? slug;
}
