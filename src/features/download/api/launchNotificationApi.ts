import { LAUNCH_NOTIFICATION_CONSENT_VERSION } from "@/features/download/model/launchNotification";
import type {
  CreateLaunchNotificationRequest,
  LaunchNotificationPlatform,
} from "@/features/download/model/types";
import { externalApiFetch } from "@/shared/lib/api/externalClient";

/**
 * 출시 알림 신청. 로그인하지 않은 웹 방문자가 부른다 — `X-API-Key` 만 싣고 토큰은 없다.
 * 계약은 FE 가 BE 에 요청한 명세다(docs/be-request-launch-notifications.md).
 *
 * 같은 이메일로 다시 신청해도 서버는 성공으로 답한다. "이미 신청됨"을 알려 주면 그 이메일이
 * 등록돼 있다는 사실이 드러나기 때문이다. 그래서 응답 본문은 쓰지 않는다.
 */
export async function requestLaunchNotification(
  email: string,
  platform: LaunchNotificationPlatform = "ANDROID",
): Promise<void> {
  const body: CreateLaunchNotificationRequest = {
    email: email.trim(),
    platform,
    privacyConsent: true,
    consentVersion: LAUNCH_NOTIFICATION_CONSENT_VERSION,
  };
  await externalApiFetch<null>("/api/v1/launch-notification-requests", {
    method: "POST",
    body,
  });
}
