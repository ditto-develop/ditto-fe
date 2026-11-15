"use client";

import { useCallback, useEffect, useState } from "react";

import { getSecretMatchingStatus } from "@/features/matching/api/secretMatchingApi";
import type { SecretMatchingStatus } from "@/features/matching/model/secretMatching";
import { describeError } from "@/shared/lib/api/apiError";

/**
 * 시크릿 매칭 홈 상태. `enabled` 는 `useFeatureFlag("SECRET_MATCHING")` 이다.
 *
 * - `undefined` 묻는 중이다. 홈은 카드 자리를 스켈레톤으로 잡아 기존 카드 → 시크릿 카드로 바뀌는 깜빡임을 막는다.
 * - `null` 꺼져 있거나 실패했다. 홈은 지금 화면 그대로다.
 *
 * 기간 조회와 나란히 묻는다 — 기간을 먼저 기다리면 목~일 홈이 왕복 한 번만큼 늦게 뜬다.
 */
export function useSecretMatchingStatus(enabled: boolean): {
  status: SecretMatchingStatus | null | undefined;
  reload: () => Promise<void>;
} {
  const [status, setStatus] = useState<SecretMatchingStatus | null | undefined>(enabled ? undefined : null);

  const fetchStatus = useCallback(async (): Promise<SecretMatchingStatus | null> => {
    try {
      return await getSecretMatchingStatus();
    } catch (err: unknown) {
      console.error("[secretMatching] 홈 상태 조회 실패, 기존 화면으로:", describeError(err));
      return null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStatus(null);
      return;
    }
    let alive = true;
    setStatus(undefined);
    void fetchStatus().then((next) => {
      if (alive) setStatus(next);
    });
    return () => {
      alive = false;
    };
  }, [enabled, fetchStatus]);

  /** 당겨서 새로고침·앱 복귀. 다시 읽는 동안에는 지금 값을 그대로 둔다(스켈레톤으로 돌아가지 않는다). */
  const reload = useCallback(async () => {
    if (!enabled) return;
    setStatus(await fetchStatus());
  }, [enabled, fetchStatus]);

  return { status, reload };
}
