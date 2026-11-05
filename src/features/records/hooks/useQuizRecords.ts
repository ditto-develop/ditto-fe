"use client";

import { useCallback, useEffect, useState } from "react";

import { getQuizHistory, getQuizHistoryDetail } from "@/features/records/api/recordsApi";
import type { QuizHistoryDetail, QuizHistoryResponse } from "@/features/records/model/types";
import { describeError } from "@/shared/lib/api/apiError";

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: boolean;
  /** 다시 불러온다. 이미 보이는 값은 그대로 두고 바꿔 끼운다(카운트다운이 끝났을 때 등). */
  reload: () => void;
};

/**
 * 한 번 부르고, `reload` 로 다시 부르는 공통 모양. 같은 화면 안에서만 쓰므로 캐시는 두지 않는다.
 * 늦게 도착한 이전 응답이 새 응답을 덮지 않게 요청마다 `cancelled` 를 둔다.
 */
function useFetchOnce<T>(load: (() => Promise<T>) | null, label: string): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(load !== null);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!load) return undefined;
    let cancelled = false;
    setLoading(true);
    load()
      .then((next) => {
        if (cancelled) return;
        setData(next);
        setError(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error(`[${label}] 조회 실패:`, describeError(err));
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load, label, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, loading, error, reload };
}

/** 기록 탭: 상단 요약 + 이번 주 + 끝까지 푼 퀴즈셋 목록. */
export function useQuizRecords(): AsyncState<QuizHistoryResponse> {
  return useFetchOnce(getQuizHistory, "useQuizRecords");
}

/** 퀴즈셋 하나의 내 답(공개 후에는 선택 비율까지). id 가 숫자가 아니면 부르지 않고 오류로 둔다. */
export function useQuizRecordDetail(quizSetId: number): AsyncState<QuizHistoryDetail> & {
  invalidId: boolean;
} {
  const invalidId = !Number.isInteger(quizSetId) || quizSetId <= 0;
  const load = useCallback(() => getQuizHistoryDetail(quizSetId), [quizSetId]);
  const state = useFetchOnce(invalidId ? null : load, "useQuizRecordDetail");
  return { ...state, invalidId };
}
