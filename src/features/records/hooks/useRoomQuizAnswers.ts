"use client";

import { useCallback, useEffect, useState } from "react";

import { getQuizCompare, getQuizDistribution } from "@/features/records/api/recordsApi";
import type {
  QuizCompareResponse,
  QuizDistributionResponse,
} from "@/features/records/model/types";

type RoomQuizData = QuizCompareResponse | QuizDistributionResponse;

type UseRoomQuizResult<T extends RoomQuizData> = {
  /**
   * 못 읽었으면 null 이고, 화면은 "우리의 답변" 을 통째로 숨긴다 — 끝난 방(7004)·상대 탈퇴/차단(7008)·
   * 퀴즈로 만든 방이 아님(7012)·서버에 API 가 아직 없음(404) 모두 같다.
   */
  data: T | null;
  refetch: () => void;
  /** 질문 카드가 올라간 직후 서버를 다시 읽지 않고 그 문항을 '보냄' 으로 둔다. */
  markSent: (quizId: number) => void;
};

/**
 * 대화방 답변 데이터 공통 모양. 채팅 자체는 그대로 써야 하므로 실패해도 토스트를 띄우지 않는다.
 * `enabled` 가 false(테스터 모드 꺼짐·끝난 방)면 부르지 않고 비운다.
 */
function useRoomQuizData<T extends RoomQuizData>(
  load: (roomId: number) => Promise<T>,
  roomId: number,
  enabled: boolean,
): UseRoomQuizResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled || !Number.isFinite(roomId)) {
      setData(null);
      return undefined;
    }

    let active = true;
    load(roomId)
      .then((next) => {
        if (active) setData(next);
      })
      .catch(() => {
        if (active) setData(null);
      });

    return () => {
      active = false;
    };
  }, [enabled, load, roomId, version]);

  const refetch = useCallback(() => setVersion((previous) => previous + 1), []);

  const markSent = useCallback((quizId: number) => {
    setData((previous) => {
      if (!previous) return previous;
      // 두 응답 모두 items[].sent 를 갖는다. 모양을 그대로 둔 채 그 문항만 바꾼다.
      const items = previous.items.map((item) =>
        item.quizId === quizId ? { ...item, sent: true } : item,
      );
      return { ...previous, items } as T;
    });
  }, []);

  return { data, refetch, markSent };
}

/** 1:1·재매칭 방 "우리의 답변"(8.1.1). */
export function useRoomQuizCompare(roomId: number, enabled: boolean) {
  return useRoomQuizData(getQuizCompare, roomId, enabled);
}

/** 그룹 방 "우리 그룹의 답변"(8.1.2). */
export function useRoomQuizDistribution(roomId: number, enabled: boolean) {
  return useRoomQuizData(getQuizDistribution, roomId, enabled);
}
