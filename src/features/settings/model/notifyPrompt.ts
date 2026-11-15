import type { NotifyPromptAction } from "@/shared/lib/analytics/events";
import type { PushPermission } from "@/shared/lib/native/pushNotifications";

/**
 * 퀴즈 완료 화면의 "알림받기" 안내를 띄울지, 띄우면 버튼이 무엇을 할지.
 *
 * 알림이 실제로 오려면 **둘 다** 켜져 있어야 한다: 서버의 매칭 알림 설정(설정 화면 토글)과 기기의 OS 알림 권한.
 * 예전 안내는 서버 설정만 봐서, OS 에서 거절한 사람은 안내가 아예 안 뜨거나(서버는 켜짐) 버튼을 눌러도
 * 서버만 켜지고 푸시는 여전히 오지 않았다.
 *
 * OS 가 거절 상태면 시스템 창은 다시 뜨지 않는다(iOS 설치당 1회). 그래서 버튼이 설정 앱을 연다.
 * 퀴즈는 주 1회라 이 안내도 자연히 매주 한 번 뜬다.
 */

/** 옛 앱 바이너리(설정 열기 플러그인 없음)에서 버튼 대신 보여 줄 안내. */
export const NOTIFY_SETTINGS_GUIDE = "설정 > 디토 > 알림에서 알림을 켜 주세요";

export type NotifyPrompt =
  | { show: false }
  | {
      show: true;
      action: NotifyPromptAction;
      buttonLabel: string;
      /** `null` 이면 화면의 기본 안내 문구를 쓴다. */
      caption: string | null;
    };

export type NotifyPromptInput = {
  /** 서버 매칭 알림 설정. `null` = 아직 모르거나 읽지 못했다. */
  serverMatching: boolean | null;
  /** OS 알림 권한. `null` = 아직 읽는 중이다. 웹은 `unsupported` 다. */
  osPermission: PushPermission | null;
  /** 이 앱 바이너리가 설정 앱을 열 수 있는지(`canOpenNotificationSettings`). */
  canOpenSettings: boolean;
};

const HIDDEN: NotifyPrompt = { show: false };

export function resolveNotifyPrompt({
  serverMatching,
  osPermission,
  canOpenSettings,
}: NotifyPromptInput): NotifyPrompt {
  // OS 권한을 읽기 전에는 판단하지 않는다 — 서버 설정만 보고 먼저 띄웠다가 문구가 바뀌면 깜빡인다.
  if (osPermission === null) return HIDDEN;

  if (osPermission === "denied") {
    return canOpenSettings
      ? {
          show: true,
          action: "settings",
          buttonLabel: "설정에서 알림 켜기",
          caption: "기기 알림이 꺼져 있어요. 켜 두면 결과를 바로 알려드릴게요",
        }
      : { show: true, action: "guide", buttonLabel: "알림받기", caption: NOTIFY_SETTINGS_GUIDE };
  }

  if (osPermission === "prompt") {
    return { show: true, action: "request", buttonLabel: "알림받기", caption: null };
  }

  /*
   * OS 허용 또는 웹: 서버 설정만 남는다. 꺼진 게 확인됐을 때만 띄운다 — 켜 둔 사람에게 매번 띄우면
   * 팝업처럼 거슬렸고(2026-10-04 QA), 못 읽은 경우는 다시 묻느니 한 번 덜 묻는 편이 낫다.
   */
  if (serverMatching === false) {
    return { show: true, action: "enable", buttonLabel: "알림받기", caption: null };
  }
  return HIDDEN;
}
