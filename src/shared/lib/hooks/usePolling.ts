"use client";

import { useEffect, useRef } from "react";
import type { PluginListenerHandle } from "@capacitor/core";

import { isNativeApp } from "@/shared/lib/native/platform";

type UsePollingOptions = {
  enabled?: boolean;
};

/**
 * 화면이 보이는 동안 `fn`을 `intervalMs`마다 재호출한다.
 *
 * `src/app/home/MainSection.tsx`에서 쓰던 폴링 가드(중복 호출 방지, 백그라운드 탭 스킵,
 * 복귀 시 즉시 재조회, 네이티브 앱 상태 복귀 대응)를 공용 훅으로 뺀 것이다.
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

    let isMounted = true;
    let isFetching = false;
    let nativeListener: PluginListenerHandle | undefined;

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

    const onVisibilityChange = () => {
      if (!document.hidden) void tick();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    if (isNativeApp()) {
      void (async () => {
        try {
          const { App } = await import("@capacitor/app");
          const handle = await App.addListener("appStateChange", ({ isActive }) => {
            if (isActive) void tick();
          });
          if (isMounted) nativeListener = handle;
          else void handle.remove();
        } catch {
          // 네이티브 리스너 등록 실패는 무시한다 — setInterval 폴백으로 충분하다.
        }
      })();
    }

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void nativeListener?.remove();
    };
  }, [enabled, intervalMs]);
}
