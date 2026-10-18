/** 출시 알림을 받을 플랫폼. 지금은 Android 만 받는다. */
export type LaunchNotificationPlatform = "ANDROID";

/** POST /api/v1/launch-notification-requests */
export type CreateLaunchNotificationRequest = {
  /** 이메일 형식, 최대 254자. 서버가 trim·소문자로 정규화한다. */
  email: string;
  platform: LaunchNotificationPlatform;
  /** true 가 아니면 0001. */
  privacyConsent: true;
  /** 신청 화면이 보여 준 동의 문구의 버전. 서버가 동의 증빙으로 저장한다. */
  consentVersion: string;
};
