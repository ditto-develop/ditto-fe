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
  const counterpartId = room.counterpartMemberIds[0];

  if (counterpartId === undefined) {
    return { ...room, counterpartNickname: "알 수 없음", counterpartProfileImageUrl: null };
  }

  try {
    const profile = await getCounterpartProfile(counterpartId);
    return {
      ...room,
      counterpartNickname: profile.nickname,
      counterpartProfileImageUrl: profile.profileImageUrl,
    };
  } catch {
    // 프로필 조회 실패로 방 자체가 목록에서 사라지면 안 된다.
    return { ...room, counterpartNickname: "알 수 없음", counterpartProfileImageUrl: null };
  }
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
