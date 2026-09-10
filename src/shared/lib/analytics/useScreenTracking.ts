"use client";

import type { PluginListenerHandle } from "@capacitor/core";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";

import { createEngagementTracker, type EngagementTracker } from "@/shared/lib/analytics/engagement";
import { trackEvent } from "@/shared/lib/analytics/gtag";
import { resolveScreen } from "@/shared/lib/analytics/screenName";
import { isNativeApp } from "@/shared/lib/native/platform";

/**
 * 화면 진입(`screen_view`)과 체류 시간(`screen_engagement`)을 보낸다.
 * `ClientLayout` 에서 **한 번만** 마운트한다.
 */

/**
 * 화면이 이만큼 유지돼야 진입으로 친다.
 *
 * `ClientLayout` 은 가드 리다이렉트(`router.replace`)를 자주 쏜다. 그 순간 스쳐 가는
 * 경로까지 진입으로 세면 유령 화면뷰가 쌓여 이탈률이 실제보다 크게 나온다.
 * 사람이 화면을 봤다고 할 수 없는 길이라 버리는 편이 맞다.
 */
const SCREEN_VIEW_DEBOUNCE_MS = 300;

/** 이보다 짧은 체류는 보내지 않는다. 노이즈만 늘고 분석에 쓸 수 없다. */
const MIN_ENGAGEMENT_MS = 100;

function isDocumentVisible(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible";
}

/**
 * @param enabled 추적을 켤지. `ClientLayout` 이 **스플래시가 걷힌 뒤** true 로 준다.
 *
 * 스플래시 중에 세지 않는 이유: 로그인 상태로 앱을 켜면 루트("/")가 최대 6초까지
 * 스플래시에 덮인 채 마운트돼 있다가 `/home` 으로 replace 된다. 이걸 그대로 세면
 * 콜드 스타트마다 `landing` 화면에 수 초짜리 체류가 찍혀, 하필 가입 퍼널의
 * 입구인 그 화면의 지표가 통째로 망가진다.
 */
export function useScreenTracking(enabled: boolean): void {
  const pathname = usePathname();
  const screen = useMemo(() => resolveScreen(pathname), [pathname]);

  // 경로 문자열이 아니라 **화면 이름**이 바뀔 때만 다시 돈다. `/chat/group/1` →
  // `/chat/group/2` 처럼 같은 화면 안에서 파라미터만 바뀌는 이동을 새 진입으로
  // 세지 않기 위해서다.
  const screenName = screen?.screenName ?? null;
  const screenPath = screen?.screenPath ?? null;

  useEffect(() => {
    if (!enabled || screenName === null || screenPath === null) return;

    let disposed = false;
    let tracker: EngagementTracker | null = null;
    let nativeListener: PluginListenerHandle | null = null;

    const flush = () => {
      if (!tracker) return;
      const { durationMs, engagedMs } = tracker.snapshot();
      tracker = null;
      if (durationMs < MIN_ENGAGEMENT_MS) return;
      trackEvent("screen_engagement", {
        screen_name: screenName,
        screen_path: screenPath,
        duration_ms: Math.round(durationMs),
        engaged_ms: Math.round(engagedMs),
      });
    };

    const startTimer = window.setTimeout(() => {
      if (disposed) return;
      trackEvent("screen_view", { screen_name: screenName, screen_path: screenPath });
      tracker = createEngagementTracker(Date.now, isDocumentVisible());
    }, SCREEN_VIEW_DEBOUNCE_MS);

    /**
     * 화면을 떠나지 않은 채 앱/탭이 가려졌다.
     *
     * 가려진 구간은 아예 보고하지 않고, 돌아오면 **새 누적기**로 다시 센다.
     * 하나로 이어서 세면 백그라운드에 10분 있었던 시간이 `duration_ms` 에 그대로
     * 들어가 "이 화면에 10분 머물렀다"로 읽힌다. 돌아올 때 `screen_view` 를 다시
     * 보내지는 않는다 — 같은 화면이라 진입이 아니다.
     */
    const handleHidden = () => {
      tracker?.pause();
      flush();
    };

    const handleVisible = () => {
      if (disposed || tracker) return;
      tracker = createEngagementTracker(Date.now, true);
    };

    const onVisibilityChange = () => {
      if (isDocumentVisible()) handleVisible();
      else handleHidden();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    // 웹에서 탭을 닫거나 다른 페이지로 하드 이동하는 마지막 기회.
    // `beforeunload` 가 아니라 `pagehide` 인 이유는 iOS Safari 와 앱 웹뷰에서
    // `beforeunload` 가 아예 오지 않기 때문이다.
    window.addEventListener("pagehide", handleHidden);

    /**
     * 앱 웹뷰에서는 `visibilitychange` 를 믿을 수 없다(특히 안드로이드 웹뷰).
     * Capacitor 의 앱 상태 이벤트가 정본이다.
     *
     * 정적 import 하지 않는다 — 같은 번들이 웹에서도 돌기 때문에, 쓸 일이 없는
     * 브라우저 방문자 전원이 플러그인 비용을 내게 된다(pushNotifications.ts 와 같은 이유).
     */
    if (isNativeApp()) {
      void (async () => {
        try {
          const { App } = await import("@capacitor/app");
          const handle = await App.addListener("appStateChange", ({ isActive }) => {
            if (isActive) handleVisible();
            else handleHidden();
          });
          // 리스너 등록이 끝나기 전에 화면이 바뀌었으면 즉시 되돌린다.
          if (disposed) void handle.remove();
          else nativeListener = handle;
        } catch (err: unknown) {
          console.error("[analytics] 앱 상태 리스너 등록 실패:", err);
        }
      })();
    }

    return () => {
      disposed = true;
      window.clearTimeout(startTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", handleHidden);
      void nativeListener?.remove();
      flush();
    };
  }, [enabled, screenName, screenPath]);
}
