"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import type { FeatureFlag } from "@/shared/lib/featureFlags";
import {
  featureStage,
  isStageVisible,
  readTesterMode,
  subscribeTesterMode,
} from "@/shared/lib/featureFlags";

/**
 * 이 기기의 테스터 모드. 정적 HTML 을 만들 때와 하이드레이션 첫 렌더에는 저장소를 읽을 수 없어
 * `null`(아직 모름)이고, 하이드레이션 직후 실제 값으로 바뀐다. 클라이언트 이동으로 붙은 화면은
 * 처음부터 실제 값이다.
 */
function useTesterMode(): boolean | null {
  return useSyncExternalStore<boolean | null>(subscribeTesterMode, readTesterMode, () => null);
}

/**
 * 탭·버튼처럼 **들어가는 길**을 그릴지. 아직 모를 때는 `false` 라, 테스터 기기에서도 하이드레이션 직후
 * 한 박자 늦게 나타난다.
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  return isStageVisible(featureStage(flag), useTesterMode() === true);
}

/**
 * 공개 전 **화면(page)** 맨 위에서 부른다. `true` 일 때만 화면을 그리고, 아니면 `null` 을 돌려준다.
 *
 * 정적 export 라 그 화면의 HTML 은 플래그와 상관없이 S3 에 올라간다. 탭만 숨기면 주소·푸시·딥링크로
 * 그대로 열리므로 화면에서도 막는다. 꺼져 있으면 /home 으로 보낸다. 아직 모를 때는 보내지 않고
 * 기다린다 — 그 사이에 보내면 테스터 기기에서도 하이드레이션 직후 쫓겨난다.
 */
export function useFeatureGate(flag: FeatureFlag): boolean {
  const router = useRouter();
  const testerMode = useTesterMode();
  const stage = featureStage(flag);
  const known = stage === "all" || testerMode !== null;
  const enabled = isStageVisible(stage, testerMode === true);

  useEffect(() => {
    if (known && !enabled) router.replace("/home");
  }, [known, enabled, router]);

  return known && enabled;
}
