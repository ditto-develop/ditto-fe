"use client";

import { useCallback, useEffect, useState } from "react";

import { getSystemPeriod, type SystemPeriod } from "@/features/system/api/systemStateApi";
import { usePolling } from "@/shared/lib/hooks/usePolling";
import { POLLING_INTERVAL_MS } from "@/shared/lib/constants/polling";

/**
 * 서버 기간을 읽어 준다. 아직 못 읽었거나 조회에 실패하면 null이다.
 *
 * 채팅 개방 판정이 클라이언트 시계만 보면 어드민 시각 오버라이드가 반영되지 않는다
 * — 방 목록의 `opensAt`은 오버라이드와 무관하게 실제 금요일 00:00 그대로 내려오기 때문이다.
 */
export function useSystemPeriod(): SystemPeriod | null {
  const [period, setPeriod] = useState<SystemPeriod | null>(null);

  useEffect(() => {
    let active = true;

    void getSystemPeriod().then((value) => {
      if (active) setPeriod(value);
    });

    return () => {
      active = false;
    };
  }, []);

  /**
   * 30초 캐시(`systemStateApi`)를 두고 있어 `force`로 우회하지 않으면 이 폴링이
   * 사실상 무의미해진다 — 어드민 시각 오버라이드가 바뀌는 것도 이걸로 반영된다.
   */
  usePolling(
    useCallback(async () => {
      const value = await getSystemPeriod({ force: true });
      setPeriod(value);
    }, []),
    POLLING_INTERVAL_MS,
  );

  return period;
}
