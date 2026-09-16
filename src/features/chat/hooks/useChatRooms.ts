"use client";

import { useCallback, useEffect, useState } from "react";

import { getChatRooms } from "@/features/chat/api/chatApi";
import { getCounterpartProfile } from "@/features/chat/api/counterpartApi";
import type { ChatRoom, ChatRoomWithCounterpart } from "@/features/chat/model/types";

type UseChatRoomsResult = {
  rooms: ChatRoomWithCounterpart[];
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
};

async function attachCounterpart(room: ChatRoom): Promise<ChatRoomWithCounterpart> {
  const ids = room.sourceType === "GROUP"
    ? room.counterpartMemberIds
    : room.counterpartMemberIds.slice(0, 1);
  const profiles = await Promise.all(ids.map((id) => getCounterpartProfile(id).catch(() => null)));
  return {
    ...room,
    counterpartNickname: profiles.map((profile) => profile?.nickname ?? "알 수 없음").join(", ") || "알 수 없음",
    counterpartProfileImageUrl: profiles[0]?.profileImageUrl ?? null,
  };
}

export function useChatRooms(): UseChatRoomsResult {
  const [rooms, setRooms] = useState<ChatRoomWithCounterpart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await getChatRooms();
      setRooms(await Promise.all(list.map(attachCounterpart)));
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const run = async () => {
      const list = await getChatRooms().catch(() => null);
      if (!active) return;

      if (!list) {
        setError(true);
        setLoading(false);
        return;
      }

      const withCounterpart = await Promise.all(list.map(attachCounterpart));
      if (!active) return;

      setRooms(withCounterpart);
      setError(false);
      setLoading(false);
    };

    void run();

    return () => {
      active = false;
    };
  }, []);

  return { rooms, loading, error, refresh: load };
}
