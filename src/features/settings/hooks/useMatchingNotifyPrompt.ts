"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/context/ToastContext";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "@/features/settings/api/settingsApi";
import { registerDeviceToken } from "@/shared/lib/native/pushNotifications";

type UseMatchingNotifyPromptResult = {
  /** 매칭 알림이 꺼져 있다고 확인됐을 때만 true. 이때만 "알림받기" 안내를 띄운다. */
  needsPrompt: boolean;
  notifying: boolean;
  /** 매칭 알림을 켜고(설정 화면의 토글과 같은 값) 홈으로 돌아간다. */
  enableMatchingNotify: () => Promise<void>;
};

/**
 * 퀴즈 완료 화면의 "알림받기" 안내.
 *
 * 매칭 알림이 이미 켜져 있으면 띄우지 않는다 — 켜 둔 사람에게도 퀴즈를 끝낼 때마다 같은
 * 안내가 떠 팝업처럼 거슬렸다(2026-10-04 QA). 설정을 읽기 전과 읽지 못했을 때도 띄우지
 * 않는다. 켜져 있을지 모르는 사람에게 다시 묻느니 한 번 덜 묻는 편이 낫고, 설정 화면에서
 * 언제든 켤 수 있다.
 */
export function useMatchingNotifyPrompt(): UseMatchingNotifyPromptResult {
  const router = useRouter();
  const { showToast } = useToast();
  const [needsPrompt, setNeedsPrompt] = useState(false);
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    let alive = true;
    getNotificationSettings()
      .then((settings) => {
        if (alive) setNeedsPrompt(!settings.matching);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  /** 앱이면 이 기기의 푸시 토큰도 함께 등록해 둔다 — 웹에서는 아무 일도 하지 않는다. */
  const enableMatchingNotify = useCallback(async () => {
    if (notifying) return;
    setNotifying(true);
    try {
      await updateNotificationSettings({ matching: true });
      void registerDeviceToken();
      showToast("매칭 결과가 나오면 알려드릴게요.", "success");
      router.push("/home");
    } catch {
      showToast("알림 설정에 실패했어요. 잠시 후 다시 시도해 주세요.", "error");
    } finally {
      setNotifying(false);
    }
  }, [notifying, router, showToast]);

  return { needsPrompt, notifying, enableMatchingNotify };
}
