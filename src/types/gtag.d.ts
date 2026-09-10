/**
 * GA4(gtag.js) 전역 선언.
 *
 * 스크립트는 `ClientLayout`이 `next/script`로 늦게 붙이므로 이 값들은 **없을 수
 * 있다**. 광고 차단기가 막거나 측정 ID 가 비어 있으면 영영 안 붙는다. 그래서
 * optional 로 선언한다 — 호출부(`shared/lib/analytics/gtag.ts`)가 매번 존재를
 * 확인하고 없으면 조용히 no-op 하도록 타입으로 강제하기 위해서다.
 */

declare global {
  /**
   * gtag.js 가 큐로 쓰는 배열.
   *
   * 공식 스니펫은 `arguments` 객체를 밀어 넣지만 태그는 배열 유사 객체면 되므로
   * 진짜 배열을 넣어도 동작한다. 배열을 쓰면 `arguments` 를 피할 수 있어 타입이 깔끔하다.
   */
  type GtagDataLayer = unknown[][];

  /**
   * gtag 호출 시그니처. 실제로는 가변 인자지만 우리가 쓰는 형태만 좁혀 둔다.
   * 좁혀 두면 오타(`'even'`)나 인자 순서 실수가 컴파일에서 걸린다.
   */
  interface Gtag {
    (command: "js", config: Date): void;
    (command: "config", measurementId: string, params?: Record<string, unknown>): void;
    (command: "set", params: Record<string, unknown>): void;
    (command: "set", key: "user_properties", params: Record<string, unknown>): void;
    (command: "event", eventName: string, params?: Record<string, unknown>): void;
  }

  interface Window {
    dataLayer?: GtagDataLayer;
    gtag?: Gtag;
  }
}

export {};
