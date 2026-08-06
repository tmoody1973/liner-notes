// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { NextResponse } from "next/server";

// Stored Deezer preview URLs carry CDN tokens that expire within hours, so the
// catalog's previewUrl goes 403 by demo time. This route trades the stable
// Deezer track id for a fresh preview URL at click time and redirects to it.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ deezerId: string }> }
) {
  const { deezerId } = await params;
  if (!/^\d+$/.test(deezerId)) {
    return NextResponse.json({ error: "bad track id" }, { status: 400 });
  }
  const res = await fetch(`https://api.deezer.com/track/${deezerId}`, {
    // fresh enough to stay inside the CDN token's lifetime, cheap on Deezer
    next: { revalidate: 900 },
  });
  if (!res.ok) {
    return NextResponse.json({ error: "deezer unavailable" }, { status: 502 });
  }
  const track = (await res.json()) as { preview?: string };
  if (!track.preview) {
    return NextResponse.json({ error: "no preview" }, { status: 404 });
  }
  return NextResponse.redirect(track.preview, 302);
}
