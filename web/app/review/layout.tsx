// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { notFound } from "next/navigation";

// The review queue mutates the production catalog (approve/reject). It is a
// steward-operator tool, not part of the public demo — hide it on any Vercel
// deployment; it stays available on localhost.
export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  if (process.env.VERCEL) notFound();
  return <>{children}</>;
}
