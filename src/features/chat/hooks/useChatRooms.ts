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

  /**
   * 화면이 다시 보일 때 목록을 새로 읽는다.
   *
   * 안읽은 수는 방에 들어간 순간 서버에서 0 이 되는데, 목록은 마운트할 때 한 번만 읽어서
   * 방에서 뒤로 나오면 들어가기 전의 배지가 그대로 남아 있었다. 뒤로가기가 이 컴포넌트를
   * 다시 마운트하지 않는 경로(웹뷰 복귀·bfcache)가 있어 최초 로드 이펙트로는 못 잡는다.
   *
   * `visibilitychange` 는 앱 전환·화면 복귀를, `pageshow` 는 bfcache 복원을 각각 잡는다.
   * 둘 다 같은 복귀에서 함께 뜰 수 있지만 재조회가 멱등이라 문제되지 않는다.
   */
  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState !== "visible") return;
      void load();
    };

    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("pageshow", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);

    return () => {
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("pageshow", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
    };
  }, [load]);

  return { rooms, loading, error, refresh: load };
}
