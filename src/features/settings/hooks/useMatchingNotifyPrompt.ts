"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/context/ToastContext";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "@/features/settings/api/settingsApi";
import type { NotifyPrompt } from "@/features/settings/model/notifyPrompt";
import { NOTIFY_SETTINGS_GUIDE, resolveNotifyPrompt } from "@/features/settings/model/notifyPrompt";
import { trackEvent } from "@/shared/lib/analytics";
import { useOnAppResume } from "@/shared/lib/hooks/useOnAppResume";
import { canOpenNotificationSettings } from "@/shared/lib/native/appSettings";
import type { PushPermission } from "@/shared/lib/native/pushNotifications";
import {
  getPushPermission,
  registerDeviceToken,
  requestPushPermission,
} from "@/shared/lib/native/pushNotifications";

type UseMatchingNotifyPromptResult = {
  /** 안내를 띄울지, 띄우면 버튼 문구와 하는 일(`resolveNotifyPrompt`). */
  prompt: NotifyPrompt;
  notifying: boolean;
  /** 버튼. 서버 매칭 알림이 꺼져 있으면 켜고, OS 권한이 없으면 시스템 창 또는 설정 앱으로 보낸다. */
  enableNotify: () => Promise<void>;
};

const ENABLED_MESSAGE = "매칭 결과가 나오면 알려드릴게요.";

/**
 * 퀴즈 완료 화면의 "알림받기" 안내.
 *
 * 서버 매칭 알림 설정과 OS 알림 권한을 **둘 다** 본다(`resolveNotifyPrompt` 주석). OS 에서 거절한 사람은
 * 시스템 창이 다시 뜨지 않으므로 버튼이 설정 앱을 연다. 설정에서 켜고 돌아오면 권한을 다시 읽어 안내를
 * 걷고, 토큰은 `initPushNotifications` 의 앱 복귀 리스너가 다시 등록한다.
 */
export function useMatchingNotifyPrompt(): UseMatchingNotifyPromptResult {
  const router = useRouter();
  const { showToast } = useToast();
  const [serverMatching, setServerMatching] = useState<boolean | null>(null);
  const [osPermission, setOsPermission] = useState<PushPermission | null>(null);
  const [notifying, setNotifying] = useState(false);
  /** 설정 앱을 열어 보냈다. 돌아왔을 때 켜졌으면 한 번 알려 준다. */
  const awaitingSettingsReturn = useRef(false);

  useEffect(() => {
    let alive = true;
    getNotificationSettings()
      .then((settings) => {
        if (alive) setServerMatching(settings.matching);
      })
      .catch(() => undefined);
    void getPushPermission().then((permission) => {
      if (alive) setOsPermission(permission);
    });
    return () => {
      alive = false;
    };
  }, []);

  useOnAppResume(() => {
    void getPushPermission().then((permission) => {
      setOsPermission(permission);
      if (!awaitingSettingsReturn.current || permission !== "granted") return;
      awaitingSettingsReturn.current = false;
      trackEvent("notify_prompt_result", { action: "settings", outcome: "granted_after_settings" });
      showToast(ENABLED_MESSAGE, "success");
    });
  });

  const prompt = resolveNotifyPrompt({
    serverMatching,
    osPermission,
    // 웹·하이드레이션 전에는 false 다. osPermission 을 읽기 전까지 안내가 숨어 있어 첫 렌더가 어긋나지 않는다.
    canOpenSettings: osPermission !== null && canOpenNotificationSettings(),
  });
  const promptAction = prompt.show ? prompt.action : null;

  // 안내가 무엇을 하려는지 바뀔 때마다 노출을 한 번 센다(거절 → 설정 안내로 바뀌는 경우 포함).
  useEffect(() => {
    if (promptAction) trackEvent("notify_prompt_view", { action: promptAction });
  }, [promptAction]);

  const enableNotify = useCallback(async () => {
    if (notifying || !promptAction) return;
    const action = promptAction;
    setNotifying(true);
    trackEvent("notify_prompt_click", { action });
    try {
      if (serverMatching === false) {
        try {
          await updateNotificationSettings({ matching: true });
          setServerMatching(true);
        } catch {
          showToast("알림 설정에 실패했어요. 잠시 후 다시 시도해 주세요.", "error");
          return;
        }
      }

      if (action === "enable") {
        // 앱이면 이 기기의 푸시 토큰도 함께 등록해 둔다 — 웹에서는 아무 일도 하지 않는다.
        void registerDeviceToken();
        trackEvent("notify_prompt_result", { action, outcome: "enabled" });
        showToast(ENABLED_MESSAGE, "success");
        router.push("/home");
        return;
      }

      if (action === "guide") {
        trackEvent("notify_prompt_result", { action, outcome: "settings_unavailable" });
        showToast(NOTIFY_SETTINGS_GUIDE, "info");
        return;
      }

      const outcome = await requestPushPermission();
      trackEvent("notify_prompt_result", { action, outcome });
      switch (outcome) {
        case "granted":
          showToast(ENABLED_MESSAGE, "success");
          router.push("/home");
          return;
        case "opened_settings":
          // 결과는 돌아와서 안다(useOnAppResume). 화면에 그대로 둔다.
          awaitingSettingsReturn.current = true;
          return;
        case "settings_unavailable":
          showToast(NOTIFY_SETTINGS_GUIDE, "info");
          return;
        case "denied":
          // 방금 시스템 창에서 거절했다. 안내가 "설정에서 알림 켜기"로 바뀐다.
          setOsPermission("denied");
          showToast("알림이 꺼져 있으면 결과를 알려드릴 수 없어요. 설정에서 언제든 켤 수 있어요.", "info");
          return;
        case "unsupported":
          return;
      }
    } finally {
      setNotifying(false);
    }
  }, [notifying, promptAction, serverMatching, router, showToast]);

  return { prompt, notifying, enableNotify };
}
