import type {
  AnalyticsContext,
  AnalyticsEventMap,
  AnalyticsEventName,
} from "@/shared/lib/analytics/events";

/**
 * GA4 어댑터.
 *
 * **이 파일만 GA4 를 안다.** 호출부는 전부 `@/shared/lib/analytics` 의 공개 API 만
 * 쓴다. 나중에 GTM 이나 다른 분석 도구로 갈아탈 때 갈아엎을 파일이 여기 하나로
 * 끝나도록 하기 위해서다.
 *
 * 계측은 **절대 앱을 깨뜨리면 안 된다.** 아래 모든 함수는 스크립트가 없으면
 * 조용히 아무 일도 하지 않는다. 실제로 안 붙는 경우가 흔하다:
 *   - 측정 ID 가 비어 있다(로컬 dev, Cypress, Storybook)
 *   - 광고 차단기가 gtag.js 요청을 막았다(웹 방문자 일부)
 *   - 아직 `strategy="afterInteractive"` 로드가 끝나지 않았다
 */

/**
 * 측정 ID.
 *
 * ⚠️ `output: 'export'` 라 `process.env.NEXT_PUBLIC_*` 는 **빌드 시점에 문자열로
 * 정적 치환**된다. 즉 배포 워크플로의 Build 스텝에 이 값을 안 넘기면 빌드는 그냥
 * 성공하고 **프로덕션에서만 계측이 조용히 꺼진다**. deploy-prod.yml 의 deploy 잡을
 * 볼 것 — verify 잡에는 일부러 넣지 않는다(E2E 트래픽이 프로덕션 속성에 섞이면 안 된다).
 *
 * 치환은 `process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID` 라는 **정확한 형태**에만
 * 걸린다. 구조 분해로 꺼내면 치환되지 않아 런타임에 undefined 가 된다.
 */
function getMeasurementId(): string {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
}

/** 측정 ID 가 있는지. `ClientLayout`이 스크립트를 붙일지 결정할 때도 쓴다. */
export function isAnalyticsEnabled(): boolean {
  return getMeasurementId() !== "";
}

/**
 * `next/script` 로 붙일 gtag.js 주소. 계측이 꺼져 있으면 null 이다.
 *
 * 측정 ID 를 ClientLayout 이 직접 읽지 않게 하려고 여기서 만들어 준다 —
 * `process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID` 를 참조하는 곳을 이 파일 하나로 묶어 둔다.
 */
export function getGtagScriptSrc(): string | null {
  if (!isAnalyticsEnabled()) return null;
  return `https://www.googletagmanager.com/gtag/js?id=${getMeasurementId()}`;
}

/** gtag 가 실제로 붙어 있으면 돌려준다. 아니면 undefined — 호출부는 그냥 빠져나간다. */
function getGtag(): Window["gtag"] {
  if (typeof window === "undefined") return undefined;
  return window.gtag;
}

/**
 * gtag.js 스니펫이 기대하는 큐를 미리 만들어 둔다.
 *
 * 스크립트가 로드되기 **전에** 발생한 이벤트도 이 큐에 쌓였다가 로드 직후 전송된다.
 * 이게 없으면 콜드 스타트 직후의 첫 화면 진입(=가장 중요한 이벤트)이 통째로 유실된다.
 */
export function initGtagQueue(): void {
  if (typeof window === "undefined" || !isAnalyticsEnabled()) return;
  if (window.gtag) return;

  window.dataLayer = window.dataLayer ?? [];
  const dataLayer = window.dataLayer;
  // 공식 스니펫의 `function gtag(){dataLayer.push(arguments)}` 와 같은 일을 한다.
  // 태그는 배열 유사 객체를 읽으므로 진짜 배열이어도 동일하게 처리된다.
  const gtag: Gtag = (...args: unknown[]) => {
    dataLayer.push(args);
  };
  window.gtag = gtag;

  window.gtag("js", new Date());
  window.gtag("config", getMeasurementId(), {
    /**
     * 자동 페이지뷰를 끈다. `useScreenTracking` 이 수동으로 보낸다.
     * 켜 두면 `ClientLayout` 의 리다이렉트마다 유령 조회가 쌓인다.
     */
    send_page_view: false,
  });
}

/** 이벤트 전송. 스크립트가 없으면 no-op. */
export function trackEvent<K extends AnalyticsEventName>(
  name: K,
  params: AnalyticsEventMap[K],
): void {
  getGtag()?.("event", name, params);
}

/**
 * 이후 모든 이벤트에 따라붙을 파라미터를 세팅한다(기간·주차).
 *
 * 이벤트마다 넘기지 않는 이유는 빠뜨리기 때문이다 — 한 군데라도 빠지면 그 이벤트만
 * 기간 축에서 사라져 퍼널이 조용히 어긋난다.
 */
export function setAnalyticsContext(context: AnalyticsContext): void {
  getGtag()?.("set", { ...context });
}

/**
 * 로그인 사용자를 식별한다.
 *
 * `memberId` 는 BE 내부 정수 ID 다. **이메일·닉네임·전화번호는 절대 넘기지 않는다** —
 * GA4 정책 위반이고 적발되면 속성이 삭제된다.
 *
 * user_id 는 크로스 디바이스 결합 키다. 이 앱은 원격 URL 로드라 웹과 앱 웹뷰가
 * 같은 번들을 돌리는데, 이 값이 없으면 한 사람이 기기마다 다른 사람으로 잡힌다.
 */
export function setUserId(memberId: number | null): void {
  getGtag()?.("set", { user_id: memberId === null ? null : String(memberId) });
}

/**
 * 사용자 범위 속성. 로그인 여부와 무관하게 세팅한다 —
 * 비로그인 방문자의 웹/앱 구성도 알아야 하기 때문이다.
 */
export function setUserProperties(params: { platform: string; appVersion: string }): void {
  getGtag()?.("set", "user_properties", {
    platform: params.platform,
    app_version: params.appVersion,
  });
}

/** 로그아웃. user_id 를 떼어 다음 세션이 남의 것으로 붙지 않게 한다. */
export function resetIdentity(): void {
  setUserId(null);
}
