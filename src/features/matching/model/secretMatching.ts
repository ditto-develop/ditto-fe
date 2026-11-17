import type { CandidateOrigin, MatchCandidateDto } from "@/features/matching/api/matchingApi";
import { parseServerDateTime } from "@/shared/lib/serverDateTime";

/**
 * IMP-2 시크릿 매칭(내부명 패자부활전 — **유저 화면에는 쓰지 않는다**). 금·토 20:00 에 1:1 라운드를 한 번씩 더
 * 돌려, 목~일에 할 일이 없던 신규 가입자·월~수 미참여자·미매칭 유저에게 그 주 안에 기회를 한 번 더 준다.
 * 코드의 Rematch(그룹 재매칭, `REMATCH`)와는 다른 기능이다.
 *
 * 기간 판단은 전부 서버(KST 서버 시각)가 한다. FE 는 기기 시계로 요일·마감을 계산하지 않는다.
 */

/**
 * 홈 상태 API(`GET /api/v1/matching/secret-state`)의 `state`. 값은 서버 enum 그대로다 — 정본은 ditto-server 위키
 * `Frontend-Secret-Matching-Guide` §1 과 서버 `SecretMatchingCard.kt`. 서버는 위에서부터 먼저 맞는 것을 준다.
 *
 * - `NONE`          카드 없음. 플래그 꺼짐·월~수·1:1 또는 그룹 성사·경고 제재·그룹 완주자의 금 00:00 전.
 * - `SECRET_RESULT` 시크릿 후보가 있고 아직 성사 전(일요일까지). 홈은 기존 1:1 후보 카드를 쓴다 → 결과 화면.
 * - `WAITING`       늦게 완주했고 자기 라운드(`nextRoundAt`) 전.
 * - `AUTO_ENTERED`  완주했고 성사가 없어 다음 라운드에 자동으로 들어간다(토 20:00 전).
 * - `ELIGIBLE`      1:1 퀴즈를 아직 안 풀었다(중간에 멈춘 것 포함, 토 20:00 전). 홈 CTA → 1:1 퀴즈.
 * - `ENDED`         토 20:00 라운드까지 끝났다. 이번 주 매칭 종료.
 */
export type SecretMatchingState = "NONE" | "SECRET_RESULT" | "WAITING" | "AUTO_ENTERED" | "ELIGIBLE" | "ENDED";

export const SECRET_MATCHING_STATES: readonly SecretMatchingState[] = [
  "NONE",
  "SECRET_RESULT",
  "WAITING",
  "AUTO_ENTERED",
  "ELIGIBLE",
  "ENDED",
];

export type SecretMatchingStatus = {
  state: SecretMatchingState;
  /** 이번 주 1:1 퀴즈셋. 늦은 응시는 목~일에 `quiz-sets/current-week` 가 비어 있어 이 값으로 연다. */
  quizSetId: string | null;
  /**
   * 다음 라운드 시각(서버 KST, `yyyy-MM-dd HH:mm:ss` — 시간대 표기 없음). `NONE`·`ENDED`, 그리고 토 라운드가 지난
   * `SECRET_RESULT` 는 null.
   */
  nextRoundAt: string | null;
};

/** 시크릿 매칭 홈 카드가 맡는 상태. `NONE`·`SECRET_RESULT` 는 기존 카드가 그린다. */
export type SecretMatchingCardState = Extract<SecretMatchingState, "ELIGIBLE" | "WAITING" | "AUTO_ENTERED" | "ENDED">;

const CARD_STATES: ReadonlySet<SecretMatchingState> = new Set(["ELIGIBLE", "WAITING", "AUTO_ENTERED", "ENDED"]);

export function isSecretMatchingCardState(state: SecretMatchingState): state is SecretMatchingCardState {
  return CARD_STATES.has(state);
}

/** 라운드 요일 문구. 시안: "금요일 저녁 8시" / "토요일 저녁 8시". */
export type SecretRoundDay = "금요일" | "토요일";

/** 서버 벽시계 시각(KST, 시간대 표기 없음). 날짜 부분만으로 요일이 정해진다. */
const SERVER_LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

const KST_WEEKDAY = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", weekday: "short" });

const SHORT_WEEKDAY: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** KST 요일(0=일). 서버 문자열은 KST 벽시계라 **기기 시간대로 읽으면 안 된다**(해외 기기에서 요일이 밀린다). */
function kstWeekday(value: string): number | null {
  const local = SERVER_LOCAL_DATE_TIME.exec(value);
  if (local) {
    const [, year, month, day] = local;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay();
  }
  // 시간대가 붙은 ISO(…Z, …+09:00)는 그 시각을 KST 로 옮겨 읽는다.
  const date = parseServerDateTime(value);
  if (!date) return null;
  return SHORT_WEEKDAY[KST_WEEKDAY.format(date)] ?? null;
}

/**
 * 다음 라운드 시각 → 요일 문구(서버 가이드: `nextRoundAt` 요일로 문구를 고른다).
 * 금·토가 아니거나 시각을 모르면 null — 그때 화면은 "금·토 저녁 8시"처럼 요일 없이 쓴다.
 */
export function toSecretRoundDay(nextRoundAt: string | null | undefined): SecretRoundDay | null {
  if (!nextRoundAt) return null;
  const weekday = kstWeekday(nextRoundAt);
  if (weekday === 5) return "금요일";
  if (weekday === 6) return "토요일";
  return null;
}

const SECRET_ORIGINS: ReadonlySet<CandidateOrigin> = new Set(["SECRET_FIRST", "SECRET_SECOND"]);

/** 시크릿 라운드가 준 후보인가. 출처가 없으면(옛 응답·그룹) 정규로 본다. */
export function isSecretCandidate(candidate: Pick<MatchCandidateDto, "candidateOrigin">): boolean {
  return candidate.candidateOrigin !== undefined && SECRET_ORIGINS.has(candidate.candidateOrigin);
}

/**
 * 늦은 응시로 1:1 퀴즈를 여는 쿼리 키. `/quiz/current` 는 이 값이 있으면 `current-week`(목~일에 빈 목록)
 * 대신 이 셋을 직접 읽고, "새로 풀기"를 숨긴다(늦은 구간의 reset 은 서버가 무시한다, BE #380).
 */
export const LATE_QUIZ_SET_QUERY_KEY = "quizSetId";

/** 홈 [퀴즈 풀어보기] → 바텀시트 없이 1:1 퀴즈. 정적 라우트라 문서를 새로 받지 않는다. */
export function buildLateQuizPath(quizSetId: string): string {
  const params = new URLSearchParams({ type: "ONE_TO_ONE", [LATE_QUIZ_SET_QUERY_KEY]: quizSetId });
  return `/quiz/current?${params.toString()}`;
}
