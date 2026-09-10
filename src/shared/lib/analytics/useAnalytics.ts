"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { buildAnalyticsContext } from "@/shared/lib/analytics/context";
import {
  initGtagQueue,
  resetIdentity,
  setAnalyticsContext,
  setUserId,
  setUserProperties,
} from "@/shared/lib/analytics/gtag";
import { useScreenTracking } from "@/shared/lib/analytics/useScreenTracking";
import { getSystemState } from "@/features/system/api/systemStateApi";
import { getMyMemberId } from "@/shared/lib/auth";
import { getAppVersion } from "@/shared/lib/native/appVersion";
import { getNativePlatform } from "@/shared/lib/native/platform";

/**
 * 계측 배선의 단일 진입점. `ClientLayout` 에서 **한 번만** 부른다.
 *
 * 하는 일 네 가지:
 *   1. gtag 큐 준비 — 스크립트 로드 전에 난 이벤트도 잃지 않는다
 *   2. 사용자 속성(platform/app_version)과 user_id 세팅
 *   3. 기간·주차 컨텍스트를 모든 이벤트에 붙인다
 *   4. 화면 진입·체류 시간 추적
 */
export function useAnalytics({
  enabled,
  isLoggedIn,
}: {
  /** 스플래시가 걷혔는지. 자세한 이유는 `useScreenTracking` 참고. */
  enabled: boolean;
  isLoggedIn: boolean;
}): void {
  const pathname = usePathname();

  useEffect(() => {
    initGtagQueue();
  }, []);

  // 플랫폼·버전은 로그인과 무관하다. 앱 버전은 네이티브 브리지 왕복이라 비동기다.
  useEffect(() => {
    let cancelled = false;
    void getAppVersion()
      .then((appVersion) => {
        if (cancelled) return;
        setUserProperties({ platform: getNativePlatform(), appVersion });
      })
      .catch(() => {
        // 버전을 못 읽어도 플랫폼만은 남긴다 — 웹/앱 구분이 대부분의 분석에 필요하다.
        if (!cancelled) setUserProperties({ platform: getNativePlatform(), appVersion: "unknown" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn) setUserId(getMyMemberId());
    else resetIdentity();
  }, [isLoggedIn]);

  /**
   * 기간·주차. 화면이 바뀔 때마다 다시 읽는다.
   *
   * 매번 네트워크를 타지는 않는다 — `getSystemState()` 에 30초 캐시가 있어 대부분
   * 캐시 히트다. 그럼에도 다시 읽는 이유는 기간이 세션 도중에 바뀌기 때문이다
   * (수요일 밤 퀴즈 기간에 앱을 켜 둔 채 목요일 매칭 기간으로 넘어가는 경우, 그리고
   * 어드민이 '시간 임시 조정'으로 기간을 옮기는 경우).
   *
   * 비로그인은 건너뛴다 — 이 API 는 인증이 필요해서 401 만 쌓인다.
   */
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    void getSystemState().then((state) => {
      if (cancelled) return;
      setAnalyticsContext(buildAnalyticsContext(state));
    });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, pathname]);

  useScreenTracking(enabled);
}
