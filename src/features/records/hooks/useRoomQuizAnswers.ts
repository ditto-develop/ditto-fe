"use client";

import { useCallback, useEffect, useState } from "react";

import { getRoomQuizAnswers } from "@/features/records/api/recordsApi";
import type { RoomQuizAnswers } from "@/features/records/model/types";

type UseRoomQuizAnswersResult = {
  /** 못 읽었으면(꺼짐·404·네트워크) null 이고, 화면은 "우리의 답변" 을 통째로 숨긴다. */
  data: RoomQuizAnswers | null;
  refetch: () => void;
  /** 질문 보내기 직후 서버를 다시 읽지 않고 그 문항의 "말 걸기" 를 막는다. */
  markShared: (quizId: number, sharedAt: string) => void;
};

/**
 * 대화방 "우리의 답변"(8.1.1 · 8.1.2) 데이터.
 *
 * 2026-11-03 운영 BE 에는 이 API 가 없어 테스터 기기에서도 404 가 난다. 그때는 아무 것도
 * 알리지 않고 null 로 둔다 — 채팅 자체는 그대로 써야 하므로 오류 토스트도 띄우지 않는다.
 * `enabled` 가 false(플래그 꺼짐·방 미확인)면 부르지 않는다.
 */
export function useRoomQuizAnswers(roomId: number, enabled: boolean): UseRoomQuizAnswersResult {
  const [data, setData] = useState<RoomQuizAnswers | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled || !Number.isFinite(roomId)) {
      setData(null);
      return undefined;
    }

    let active = true;
    getRoomQuizAnswers(roomId)
      .then((answers) => {
        if (active) setData(answers);
      })
      .catch(() => {
        if (active) setData(null);
      });

    return () => {
      active = false;
    };
  }, [enabled, roomId, version]);

  const refetch = useCallback(() => setVersion((previous) => previous + 1), []);

  const markShared = useCallback((quizId: number, sharedAt: string) => {
    setData((previous) =>
      previous
        ? {
            ...previous,
            questions: previous.questions.map((question) =>
              question.quizId === quizId ? { ...question, sharedAt } : question,
            ),
          }
        : previous,
    );
  }, []);

  return { data, refetch, markShared };
}
