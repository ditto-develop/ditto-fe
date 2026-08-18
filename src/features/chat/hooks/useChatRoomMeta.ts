"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getChatRooms } from "@/features/chat/api/chatApi";
import { getCounterpartProfile, type CounterpartProfile } from "@/features/chat/api/counterpartApi";
import type { ChatRoom } from "@/features/chat/model/types";

type UseChatRoomMetaResult = {
  /** 목록에서 찾은 방. 방 상세 API가 없어 이게 유일한 출처다. */
  room: ChatRoom | null;
  /** counterpartMemberIds 순서대로 해석한 참여자. 1:1이면 1명, 그룹이면 여러 명. */
  members: CounterpartProfile[];
  memberById: Map<number, CounterpartProfile>;
  loading: boolean;
  refresh: () => Promise<void>;
};

/**
 * 차단 관계면 방은 남아 있는데 프로필 조회만 0003으로 막힌다.
 * 방 자체의 오류로 취급하지 않고 이름 자리만 대체 표시한다.
 */
function toFallbackMember(userId: number): CounterpartProfile {
  return { userId, nickname: "알 수 없음", profileImageUrl: null };
}

/**
 * 방 메타(개방·만료·종료)와 참여자 프로필을 한 번에 읽는다.
 *
 * 1:1·그룹·재매칭이 모두 같은 계약을 쓰므로 화면 구분 없이 이 훅을 쓴다.
 * 방 목록 응답에는 닉네임·이미지가 없어 counterpartMemberIds를 돌며 따로 붙인다.
 */
export function useChatRoomMeta(roomId: number): UseChatRoomMetaResult {
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [members, setMembers] = useState<CounterpartProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (isActive: () => boolean = () => true) => {
      if (!Number.isFinite(roomId)) {
        setLoading(false);
        return;
      }

      const found = await getChatRooms()
        .then((rooms) => rooms.find((item) => item.roomId === roomId) ?? null)
        .catch(() => null);

      if (!isActive()) return;
      if (!found) {
        setLoading(false);
        return;
      }

      const resolved = await Promise.all(
        found.counterpartMemberIds.map((memberId) =>
          getCounterpartProfile(memberId).catch(() => toFallbackMember(memberId)),
        ),
      );

      if (!isActive()) return;
      setRoom(found);
      setMembers(resolved);
      setLoading(false);
    },
    [roomId],
  );

  useEffect(() => {
    let active = true;
    void load(() => active);

    return () => {
      active = false;
    };
  }, [load]);

  const memberById = useMemo(
    () => new Map(members.map((member) => [member.userId, member])),
    [members],
  );

  return { room, members, memberById, loading, refresh: load };
}
