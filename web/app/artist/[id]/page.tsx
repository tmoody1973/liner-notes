// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { ArtistView } from "@/components/ArtistView";

export default async function ArtistPage(props: PageProps<"/artist/[id]">) {
  const { id } = await props.params;
  return <ArtistView artistId={id} />;
}
