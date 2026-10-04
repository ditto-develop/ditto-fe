"use client";

import { useEffect, useRef } from "react";

import { subscribeAppResume } from "@/shared/lib/appResume";

type UsePollingOptions = {
  enabled?: boolean;
};

/**
 * 화면이 보이는 동안 `fn`을 `intervalMs`마다 재호출한다.
 *
 * 폴링 가드(중복 호출 방지, 백그라운드 탭 스킵, 복귀 시 즉시 재조회, 네이티브 앱 상태
 * 복귀 대응)를 묶은 공용 훅이다.
 */
export function usePolling(
  fn: () => Promise<void> | void,
  intervalMs: number,
  options?: UsePollingOptions,
): void {
  const enabled = options?.enabled ?? true;
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return;

    let isFetching = false;

    const tick = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        await fnRef.current();
      } catch {
        // 폴링 실패는 무시한다 — 다음 tick에서 다시 시도한다.
      } finally {
        isFetching = false;
      }
    };

    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      void tick();
    }, intervalMs);

    const unsubscribeResume = subscribeAppResume(() => void tick());

    return () => {
      window.clearInterval(intervalId);
      unsubscribeResume();
    };
  }, [enabled, intervalMs]);
}
