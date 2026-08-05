// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { PlaylistView } from "@/components/PlaylistView";

export default async function PlaylistPage(props: PageProps<"/playlist/[id]">) {
  const { id } = await props.params;
  return <PlaylistView playlistId={id} />;
}
