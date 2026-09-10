/**
 * 계측 이벤트 사전(辭典).
 *
 * 이름과 파라미터를 여기 한 곳에 모아 유니온 타입으로 묶는다. 호출부는
 * `trackEvent("screen_view", { ... })` 처럼 부르고, 이름을 틀리거나 파라미터를
 * 빠뜨리면 **컴파일에서** 걸린다. 계측 버그는 배포된 뒤 며칠이 지나서야
 * "데이터가 왜 안 들어오지"로 발견되기 때문에, 잡을 수 있는 건 최대한 앞에서 잡는다.
 *
 * 규칙:
 *   - 이름은 snake_case `object_action`. GA4 예약어(`session_start`, `first_visit`,
 *     `page_view` 등)와 겹치지 않게 짓는다.
 *   - 파라미터에 **개인정보를 넣지 않는다** — 이메일·닉네임·전화번호는 GA4 정책
 *     위반이라 적발 시 속성이 삭제된다. 식별이 필요하면 `user_id`(내부 정수 ID)만 쓴다.
 *   - roomId/memberId 같은 고유 식별자를 파라미터로 넣지 않는다. GA4 에서 쓸모가
 *     없고(카디널리티) 준식별자 유출만 된다. 그런 분석은 BigQuery 쪽에서 한다.
 */

/** 서버가 판정한 현재 기간. 기기 요일로 파생하지 않는다 — `AnalyticsContext` 참고. */
export type AnalyticsPeriod = "QUIZ_PERIOD" | "MATCHING_PERIOD" | "CHATTING_PERIOD";

/**
 * 모든 이벤트에 자동으로 붙는 파라미터.
 *
 * 호출부는 이 값을 넘기지 않는다. `setAnalyticsContext()`가 gtag 전역에 한 번
 * 세팅해 두면 이후 모든 이벤트에 따라붙는다.
 */
export interface AnalyticsContext {
  /**
   * 현재 기간. 기간별로 퍼널을 쪼개 보기 위한 축이다.
   * 아직 못 읽었거나 조회에 실패하면 없다(= '모름'), 값을 지어내지 않는다.
   */
  period?: AnalyticsPeriod;
  /**
   * 주차 코호트 키. `GET /api/v1/system/state`의 year/month/week 를 조립한 값으로
   * `"2026-09-W2"` 형태다. 주 단위로 도는 서비스라 "이번 주 퍼널이 지난주보다
   * 나아졌나"가 기본 질문인데, GA4 의 날짜 축만으로는 주차 경계가 맞지 않는다.
   */
  week_key?: string;
}

/** 이벤트별 파라미터. 키가 곧 이벤트 이름이다. */
export interface AnalyticsEventMap {
  /**
   * 화면 진입. GA4 기본 `page_view` 는 **끄고**(send_page_view: false) 이걸 쓴다.
   * `ClientLayout`이 리다이렉트(`router.replace`)를 자주 쏘는데, 자동 수집은 그
   * 리다이렉트마다 유령 조회를 만들어 이탈률을 통째로 부풀린다.
   */
  screen_view: {
    screen_name: string;
    screen_path: string;
  };
  /**
   * 화면 이탈 시 체류 시간.
   *
   * `duration_ms` 는 진입~이탈 벽시계, `engaged_ms` 는 그중 **화면이 실제로 보이던**
   * 시간만 누적한 값이다. 둘을 나눠 두지 않으면 앱을 켜 둔 채 방치한 시간이 전부
   * 체류로 잡혀 지표가 무의미해진다.
   */
  screen_engagement: {
    screen_name: string;
    screen_path: string;
    duration_ms: number;
    engaged_ms: number;
  };
}

export type AnalyticsEventName = keyof AnalyticsEventMap;
