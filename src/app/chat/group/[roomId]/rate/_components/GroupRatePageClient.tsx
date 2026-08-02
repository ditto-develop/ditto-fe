"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { GroupRatingContainer } from "@/features/rating/containers/GroupRatingContainer";

function resolveRoomId(paramRoomId: string): string {
  if (typeof window === "undefined") return paramRoomId;
  const segments = window.location.pathname.split("/").filter(Boolean);
  const chatIndex = segments.indexOf("group");
  const roomId = chatIndex >= 0 ? segments[chatIndex + 1] : undefined;
  return roomId && roomId !== "placeholder" ? decodeURIComponent(roomId) : paramRoomId;
}

export function GroupRatePageClient() {
  const params = useParams<{ roomId: string }>();
  const [roomId] = useState(() => resolveRoomId(params.roomId));

  return <GroupRatingContainer roomId={roomId} />;
}
