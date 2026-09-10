/**
 * 계측 공개 API.
 *
 * 호출부는 **여기서만** 가져간다. 안쪽 파일(`gtag.ts` 등)을 직접 import 하지 말 것 —
 * 나중에 GA4 를 걷어내고 다른 도구로 갈아탈 때 갈아엎을 범위를 이 파일 하나로
 * 묶어 두기 위해서다.
 */

export type {
  AnalyticsContext,
  AnalyticsEventMap,
  AnalyticsEventName,
  AnalyticsPeriod,
  CardName,
  ChatRoomType,
  LoginMethod,
  LoginProvider,
  SignupStepName,
} from "@/shared/lib/analytics/events";
export { SIGNUP_STEP_NAMES } from "@/shared/lib/analytics/events";
export { getGtagScriptSrc, trackEvent } from "@/shared/lib/analytics/gtag";
export { rememberLoginAttempt, takeLoginAttempt } from "@/shared/lib/analytics/loginAttempt";
export { trackCardClick, useCardImpression } from "@/shared/lib/analytics/useCardImpression";
export type { LoginAttempt } from "@/shared/lib/analytics/loginAttempt";
export { useAnalytics } from "@/shared/lib/analytics/useAnalytics";
