"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getChatRooms } from "@/features/chat/api/chatApi";
import { getCounterpartProfile } from "@/features/chat/api/counterpartApi";
import { createChatRoomsSocket } from "@/features/chat/lib/chatSocket";
import { deriveRoomState } from "@/features/chat/lib/roomState";
import type { ChatMessage, ChatRoom, ChatRoomWithCounterpart } from "@/features/chat/model/types";
import { getMyMemberId } from "@/shared/lib/auth";

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

  /**
   * 구독할 수 있는 방만 추린다. 서버는 이탈·개방 전·종료된 방의 SUBSCRIBE 를 거부하고, STOMP 는
   * 그 거부에 **연결 전체를 끊는다** — 한 방을 잘못 넣으면 나머지 방의 실시간까지 같이 죽는다.
   * 판정은 화면이 쓰는 것과 같은 `deriveRoomState` 로 한다(기준이 갈리면 또 어긋난다).
   */
  const subscribableRoomIds = useMemo(
    () =>
      rooms
        .filter((room) => !room.hasLeft && deriveRoomState(room) === "OPEN")
        .map((room) => room.roomId),
    [rooms],
  );

  // 구독 목록이 바뀔 때만 소켓에 알린다. 배열 정체성이 매번 바뀌어도 내용이 같으면 넘긴다.
  const roomIdsKey = subscribableRoomIds.join(",");

  /**
   * 목록을 보고 있는 동안 들어온 메시지를 그 방 줄에 반영한다.
   *
   * 안읽음은 **보낸 사람과 무관하게** 올린다 — 서버의 방 단위 안읽음이 `id > 커서` 의 개수라
   * 내 메시지도 SYSTEM 메시지도 함께 세기 때문이다. 목록에서는 내가 보낼 수 없으므로 실제로는
   * 상대·시스템 메시지만 들어온다.
   */
  const applyIncoming = useCallback((roomId: number, message: ChatMessage) => {
    setRooms((previous) =>
      previous.map((room) =>
        room.roomId === roomId
          ? { ...room, lastMessage: message, unreadCount: room.unreadCount + 1 }
          : room,
      ),
    );
  }, []);

  /** 다른 화면·기기에서 내가 읽었으면 배지를 내린다. 남이 읽은 것은 내 안읽음과 무관하다. */
  const applySelfRead = useCallback((roomId: number, memberId: number) => {
    if (memberId !== getMyMemberId()) return;
    setRooms((previous) =>
      previous.map((room) => (room.roomId === roomId ? { ...room, unreadCount: 0 } : room)),
    );
  }, []);

  const socketRef = useRef<ReturnType<typeof createChatRoomsSocket> | null>(null);

  useEffect(() => {
    const socket = createChatRoomsSocket({
      onMessage: applyIncoming,
      onSelfRead: (roomId, event) => applySelfRead(roomId, event.memberId),
      // 실시간이 끊겨도 목록은 조회·복귀 갱신으로 계속 동작한다. 조용히 접는다.
      onError: () => undefined,
    });
    socketRef.current = socket;
    socket.activate();

    return () => {
      socketRef.current = null;
      void socket.deactivate();
    };
  }, [applyIncoming, applySelfRead]);

  useEffect(() => {
    socketRef.current?.setRooms(roomIdsKey === "" ? [] : roomIdsKey.split(",").map(Number));
  }, [roomIdsKey]);

  return { rooms, loading, error, refresh: load };
}
