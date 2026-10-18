/**
 * Android 출시 알림 신청의 동의 문구. 개인정보 수집·이용 동의에 꼭 알려야 하는 네 가지
 * (항목·목적·보유 기간·거부할 권리)를 담는다. 개인정보처리방침 v1.2 의 같은 항목과 맞춰야 한다.
 *
 * **문구를 바꾸면 `LAUNCH_NOTIFICATION_CONSENT_VERSION` 도 올린다.** 서버가 신청마다 이 버전을
 * 저장해, 누가 어떤 문구에 동의했는지를 나중에 가린다.
 */
export const LAUNCH_NOTIFICATION_CONSENT_VERSION = "2026-10-19";

export const LAUNCH_NOTIFICATION_CONSENT = {
  items: "이메일 주소",
  purpose: "Android 앱 출시 안내 메일 발송",
  retention: "신청일로부터 3개월 (기간이 지나면 지체 없이 파기)",
  refusal: "동의하지 않을 수 있으며, 동의하지 않으면 출시 알림을 받을 수 없어요.",
} as const;

/** BE 이메일 최대 길이(RFC 5321). */
export const LAUNCH_NOTIFICATION_EMAIL_MAX_LENGTH = 254;

/** 형식만 대강 본다 — 최종 판정은 서버(0001)가 한다. */
export function isValidEmail(value: string): boolean {
  const email = value.trim();
  return (
    email.length > 0 &&
    email.length <= LAUNCH_NOTIFICATION_EMAIL_MAX_LENGTH &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}
