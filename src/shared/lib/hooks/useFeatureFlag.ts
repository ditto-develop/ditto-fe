"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import type { FeatureFlag } from "@/shared/lib/featureFlags";
import {
  getFeatureFlagSnapshot,
  refreshFeatureFlags,
  subscribeFeatureFlags,
} from "@/shared/lib/featureFlags";

/**
 * 서버 기능 플래그 한 키(featureFlags.ts). 정적 HTML 을 만들 때와 하이드레이션 첫 렌더에는 `null`(아직 모름)이고,
 * 그 뒤 저장된 값 → 서버 값으로 바뀐다. 붙을 때와 앱이 다시 보일 때 1분이 지났으면 서버에 다시 묻는다.
 * 같은 순간 붙은 훅들의 키는 한 요청으로 묶인다.
 */
function useFeatureFlagValue(flag: FeatureFlag): boolean | null {
  const value = useSyncExternalStore<boolean | null>(
    subscribeFeatureFlags,
    () => getFeatureFlagSnapshot(flag),
    () => null,
  );

  useEffect(() => {
    void refreshFeatureFlags([flag]);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refreshFeatureFlags([flag]);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [flag]);

  return value;
}

/** 탭·버튼처럼 **들어가는 길**을 그릴지. 아직 모를 때는 `false` 라, 첫 방문 기기에서는 한 박자 늦게 나타난다. */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  return useFeatureFlagValue(flag) === true;
}

/**
 * 공개 전 **화면(page)** 맨 위에서 부른다. `true` 일 때만 화면을 그리고, 아니면 `null` 을 돌려준다.
 *
 * 정적 export 라 그 화면의 HTML 은 플래그와 상관없이 S3 에 올라간다. 탭만 숨기면 주소·푸시·딥링크로
 * 그대로 열리므로 화면에서도 막는다. 꺼져 있으면 /home 으로 보낸다. 아직 모를 때는 보내지 않고
 * 기다린다 — 그 사이에 보내면 켜진 기기에서도 하이드레이션 직후 쫓겨난다.
 */
export function useFeatureGate(flag: FeatureFlag): boolean {
  const router = useRouter();
  const value = useFeatureFlagValue(flag);
  const known = value !== null;
  const enabled = value === true;

  useEffect(() => {
    if (known && !enabled) router.replace("/home");
  }, [known, enabled, router]);

  return known && enabled;
}
