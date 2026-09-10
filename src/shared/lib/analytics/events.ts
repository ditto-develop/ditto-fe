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

/** 소셜 로그인 제공자. */
export type LoginProvider = "kakao" | "apple";

/**
 * 로그인 경로.
 *
 * `native` 는 앱의 SDK 시트, `redirect` 는 BE 를 거치는 웹 리다이렉트다. 같은
 * 제공자라도 성공률이 크게 다를 수 있어(네이티브 설정이 어긋나면 폴백을 탄다)
 * 반드시 나눠 본다.
 */
export type LoginMethod = "native" | "redirect";

/**
 * 가입 단계.
 *
 * ⚠️ 이 단계들은 **전부 URL `/` 하나 안에서** `Tutorial.tsx` 의 `step` 상태로
 * 돌아간다. 즉 화면 추적만으로는 어느 단계에서 이탈했는지 원리적으로 알 수 없고,
 * 아래 이벤트가 유일한 관측 수단이다.
 */
export const SIGNUP_STEP_NAMES = ["login", "profile", "intro_note"] as const;
export type SignupStepName = (typeof SIGNUP_STEP_NAMES)[number];

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

  /** 로그인 버튼을 눌렀다. 이후 성공/취소/실패 중 하나가 따라온다. */
  login_start: { provider: LoginProvider; method: LoginMethod };
  /**
   * 로그인이 끝났다. `is_new_user` 가 true 면 곧바로 가입 퍼널로 이어진다 —
   * "로그인은 되는데 가입에서 빠진다"를 보려면 이 구분이 있어야 한다.
   */
  login_success: { provider: LoginProvider; method: LoginMethod; is_new_user: boolean };
  /** 사용자가 제공자 화면에서 스스로 취소했다. 실패와 구분해야 한다 — 원인이 전혀 다르다. */
  login_cancel: { provider: LoginProvider; method: LoginMethod };
  /** 로그인이 실패했다. `reason` 은 사람이 읽을 짧은 분류값이며 원문 에러가 아니다. */
  login_fail: { provider: LoginProvider; method: LoginMethod; reason: string };

  /** 가입 단계 진입. 퍼널의 분모다. */
  signup_step_view: { step_index: number; step_name: SignupStepName };
  /** 그 단계의 검증을 통과해 다음으로 넘어갔다. 퍼널의 분자다. */
  signup_step_complete: { step_index: number; step_name: SignupStepName };
  /** 가입 완료(회원 생성 성공). 전환 이벤트로 표시할 값이다. */
  signup_complete: Record<string, never>;
  /** 가입 요청이 거절됐다. `reason` 은 짧은 분류값이다 — 입력값은 절대 싣지 않는다. */
  signup_fail: { step_index: number; step_name: SignupStepName; reason: string };
  /** 사용자가 가입을 포기하고 로그인 화면으로 나갔다. 이탈 지점을 직접 가리킨다. */
  signup_abandon: { step_index: number; step_name: SignupStepName };

  /**
   * 홈 카드가 보였다. **클릭률의 분모다.**
   *
   * 이 이벤트 없이 클릭만 세면 "몇 명이 눌렀나"는 알아도 "본 사람 중 몇 %가 눌렀나"는
   * 알 수 없다. 기간마다 뜨는 카드가 다르므로(퀴즈 기간엔 퀴즈 카드, 매칭 기간엔 매칭
   * 카드) `period` 전역 파라미터와 함께 보면 기간별 클릭률이 그대로 나온다.
   */
  card_impression: { card_name: CardName; card_state: string };
  /** 홈 카드의 CTA 를 눌렀다. 클릭률의 분자다. */
  card_click: { card_name: CardName; card_state: string; action: string };

  /** 퀴즈 화면에 들어와 문항을 받았다. 퀴즈 퍼널의 분모다. */
  quiz_start: { quiz_set_id: string; question_count: number; resumed: boolean };
  /** 문항 하나에 답했다. `step_index` 로 몇 번째 문항에서 그만두는지 볼 수 있다. */
  quiz_answer: { step_index: number; question_count: number };
  /** 마지막 문항까지 답했다. 퀴즈 퍼널의 분자다. */
  quiz_complete: { quiz_set_id: string; question_count: number };
  /** "새로 풀기" — 이번 주 답변을 지우고 처음부터. */
  quiz_restart: Record<string, never>;

  /** 매칭 결과 화면에 들어왔다. 매칭 퍼널의 분모다. */
  matching_result_view: { candidate_count: number };
  /** 후보 카드를 눌러 소개 노트를 열었다. `state` 는 그 상대와의 현재 관계다. */
  matching_profile_open: { state: string };
  /** 대화 신청/수락/거절. `ok` 가 false 면 서버가 거절한 것이다. */
  match_request_send: { ok: boolean };
  match_request_accept: { ok: boolean };
  match_request_reject: { ok: boolean };
  /** 그룹 매칭 참여/거절. */
  group_match_join: { ok: boolean };
  group_match_decline: Record<string, never>;

  /**
   * API 가 실패했다.
   *
   * "이 화면에서 왜 이탈하는가"의 답이 대개 여기 있다. 체류 시간과 퍼널만 보면
   * "사용자가 흥미를 잃었다"로 읽히는 이탈이, 실은 버튼을 눌렀는데 500 이 떨어진
   * 것이었던 경우가 많다.
   */
  api_error: { endpoint: string; status: number; code: string };

  /** 메시지를 보냈다. 대화가 실제로 일어났는지 보는 핵심 참여 지표다. */
  chat_message_send: { room_type: ChatRoomType; message_type: "TEXT" | "IMAGE" };

  /** 그룹 투표. 만남 성사로 이어지는 마지막 단계라 따로 본다. */
  vote_create: { option_count: number };
  vote_submit: Record<string, never>;
  vote_close: Record<string, never>;

  /** 대화 상대 평가 제출. */
  rating_submit: { room_type: ChatRoomType };

  /**
   * OS 알림 권한 요청의 결과.
   *
   * 거절률이 높으면 재방문이 통째로 막힌다 — 이 서비스는 주 단위로 도는 이벤트를
   * 푸시로 알리기 때문에, 권한이 없으면 사용자가 돌아올 계기 자체가 사라진다.
   */
  push_permission_result: { granted: boolean };
  /** 알림을 눌러 앱으로 들어왔다. 딥링크 유무로 어디로 보냈는지 구분한다. */
  notification_open: { has_deep_link: boolean };

  /** 탈퇴 사유 선택 화면까지 갔다. 실제 탈퇴보다 훨씬 많아야 정상이다. */
  withdraw_start: Record<string, never>;
  /** 탈퇴 완료. `reason` 은 정해진 선택지 값이며, 자유 입력(reasonDetail)은 싣지 않는다. */
  withdraw_complete: { reason: string };
}

/** 채팅방 종류. 1:1 과 그룹은 참여 양상이 전혀 달라 반드시 나눠 본다. */
export type ChatRoomType = "one_on_one" | "group";

/** 홈에서 기간마다 하나씩 뜨는 카드. */
export type CardName = "quiz" | "matching";

export type AnalyticsEventName = keyof AnalyticsEventMap;
