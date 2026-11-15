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
 * 홈 상태 API 의 `state`. 정본은 ditto-fe 위키 `BE-Request-Secret-Matching` 이다.
 *
 * - `NONE`        대상 아님(플래그 꺼짐·정규 흐름 중). 홈은 지금 화면 그대로다.
 * - `TARGET`      1:1 퀴즈를 풀면 참여할 수 있다(목~토 신규 가입·월~수 미참여·그룹 미성사). 홈 CTA → 1:1 퀴즈.
 * - `WAITING`     늦게 풀어 제출했고 다음 라운드를 기다린다.
 * - `AUTO_JOINED` 1:1 미매칭(후보 0명·수락 없음). 다음 라운드에 자동으로 들어간다.
 * - `CANDIDATES`  시크릿 라운드가 후보를 줬고 아직 성사 전이다. 홈은 기존 후보 카드를 쓴다.
 * - `MATCHED`     성사됐다. 대화방이 열린다 — 홈은 기존 대화 카드다.
 * - `CLOSED`      토 20:00 라운드까지 끝났다. 이번 주 매칭 종료.
 */
export type SecretMatchingState =
  | "NONE"
  | "TARGET"
  | "WAITING"
  | "AUTO_JOINED"
  | "CANDIDATES"
  | "MATCHED"
  | "CLOSED";

export type SecretMatchingStatus = {
  state: SecretMatchingState;
  /** 이번 주 1:1 퀴즈셋. 늦은 응시는 목~일에 `quiz-sets/current-week` 가 비어 있어 이 값으로 연다. */
  quizSetId: string | null;
  /** 다음 라운드 시각(서버 KST). 마지막 라운드가 지났으면 null. */
  nextRoundAt: string | null;
};

/** 시크릿 매칭 홈 카드가 맡는 상태. 나머지(NONE·CANDIDATES·MATCHED)는 기존 카드가 그린다. */
export type SecretMatchingCardState = Extract<SecretMatchingState, "TARGET" | "WAITING" | "AUTO_JOINED" | "CLOSED">;

const CARD_STATES: ReadonlySet<SecretMatchingState> = new Set(["TARGET", "WAITING", "AUTO_JOINED", "CLOSED"]);

export function isSecretMatchingCardState(state: SecretMatchingState): state is SecretMatchingCardState {
  return CARD_STATES.has(state);
}

/** 라운드 요일 문구. 시안: "금요일 저녁 8시" / "토요일 저녁 8시". */
export type SecretRoundDay = "금요일" | "토요일";

const KST_WEEKDAY = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", weekday: "short" });

/**
 * 다음 라운드 시각 → 요일 문구. 서버 시각을 KST 요일로만 읽는다(기기 시간대와 무관).
 * 금·토가 아니거나 시각을 모르면 null — 그때 화면은 "금·토 저녁 8시"처럼 요일 없이 쓴다.
 */
export function toSecretRoundDay(nextRoundAt: string | null | undefined): SecretRoundDay | null {
  const date = parseServerDateTime(nextRoundAt ?? null);
  if (!date) return null;
  const weekday = KST_WEEKDAY.format(date);
  if (weekday === "Fri") return "금요일";
  if (weekday === "Sat") return "토요일";
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
