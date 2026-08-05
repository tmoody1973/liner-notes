"use client";
// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from "react";

// One shared player so starting a preview stops whatever else was playing.
let sharedAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
}

function toggle(url: string) {
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.addEventListener("ended", () => {
      currentUrl = null;
      notify();
    });
  }
  if (currentUrl === url && !sharedAudio.paused) {
    sharedAudio.pause();
    currentUrl = null;
  } else {
    sharedAudio.src = url;
    currentUrl = url;
    void sharedAudio.play().catch(() => {
      currentUrl = null;
      notify();
    });
  }
  notify();
}

export function PreviewButton({ url }: { url: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  const playing = currentUrl === url && sharedAudio !== null && !sharedAudio.paused;
  return (
    <button
      onClick={() => toggle(url)}
      aria-label={playing ? "Pause preview" : "Play 30-second preview"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--hood-0) text-background transition hover:brightness-110"
    >
      {playing ? (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <rect x="1" y="1" width="3.5" height="10" rx="1" />
          <rect x="7.5" y="1" width="3.5" height="10" rx="1" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2.5 1.2a1 1 0 0 1 1.5-.86l7 4.8a1 1 0 0 1 0 1.72l-7 4.8a1 1 0 0 1-1.5-.86V1.2Z" />
        </svg>
      )}
    </button>
  );
}
