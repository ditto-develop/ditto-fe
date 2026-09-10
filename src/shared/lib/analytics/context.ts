import type { AnalyticsContext, AnalyticsPeriod } from "@/shared/lib/analytics/events";

/**
 * 서버 시스템 상태 → 모든 이벤트에 붙일 컨텍스트.
 *
 * DOM 도 네트워크도 모르는 **순수 변환**이다. 실제 조회는 `useAnalytics` 가
 * `getSystemState()` 로 하고(이미 30초 캐시가 있어 추가 왕복이 없다), 여기서는
 * 모양만 만든다.
 */

/** `getSystemState()` 응답 중 우리가 쓰는 부분. 생성된 DTO 에 결합하지 않기 위해 좁혀 둔다. */
export interface SystemStateLike {
  year: number;
  month: number;
  week: number;
  period: string;
}

const KNOWN_PERIODS: readonly string[] = [
  "QUIZ_PERIOD",
  "MATCHING_PERIOD",
  "CHATTING_PERIOD",
];

/**
 * 주차 코호트 키. `2026-09-W2` 형태.
 *
 * 월을 0 으로 채우는 이유는 문자열 정렬이 곧 시간 순서가 되게 하기 위해서다 —
 * GA4 리포트와 BigQuery 양쪽에서 이 값을 그대로 정렬해 쓴다. `9` 로 두면
 * `2026-10` 이 `2026-9` 보다 앞에 온다.
 */
export function toWeekKey(state: Pick<SystemStateLike, "year" | "month" | "week">): string {
  const month = String(state.month).padStart(2, "0");
  return `${state.year}-${month}-W${state.week}`;
}

/**
 * 컨텍스트를 만든다. 상태를 못 읽었으면(`null`) 빈 객체다.
 *
 * **값을 지어내지 않는다.** 기간을 모를 때 기기 요일로 추측하면 어드민
 * '시간 임시 조정'이 걸린 주에 지표가 통째로 어긋난다(`systemStateApi.ts` 참고).
 * 모르면 모르는 채로 두고, 리포트에서 `(not set)` 으로 보이게 한다.
 */
export function buildAnalyticsContext(state: SystemStateLike | null): AnalyticsContext {
  if (!state) return {};

  const context: AnalyticsContext = { week_key: toWeekKey(state) };
  // 서버가 새 기간을 추가했는데 FE 가 모르는 경우를 대비해 화이트리스트로 좁힌다.
  // 모르는 값을 그대로 넣으면 리포트에 정체불명의 축이 생긴다.
  if (KNOWN_PERIODS.includes(state.period)) {
    context.period = state.period as AnalyticsPeriod;
  }
  return context;
}
