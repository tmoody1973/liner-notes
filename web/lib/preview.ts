// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0

// Prefer a click-time-fresh preview via /api/preview/<deezerId> (stored Deezer
// preview URLs expire within hours); fall back to the stored URL when there is
// no Deezer link to derive an id from.
export function previewSrc(
  previewUrl: string | undefined,
  streamingLinks: Record<string, string> | undefined
): string | undefined {
  const deezer = streamingLinks?.deezer;
  const id = deezer?.match(/deezer\.com\/track\/(\d+)/)?.[1];
  if (id) return `/api/preview/${id}`;
  return previewUrl;
}
