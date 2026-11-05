/**
 * 8.1 퀴즈 기록 · 대화방 답변 비교 — 서버 계약(IMP-1).
 *
 * 정본은 서버 main 의 DTO 다(ditto-server #366, 2026-11-05):
 * - 기록: `api/.../quiz/dto/QuizHistoryResponse.kt` · `QuizHistoryDetailResponse.kt`
 * - 대화방: `api/.../chat/dto/QuizCompareResponse.kt` · `QuizDistributionResponse.kt`
 * 서버 문서는 위키 `IMP-1-Quiz-History-Answer-Compare` 와 서버 `docs/domains/{quiz,chat}.md`.
 * 채팅 메시지 `QUIZ_HINT`·`QUIZ_CARD` 의 content 모양은 `features/chat/model/types.ts` 에 있다.
 *
 * 서버 Jackson 은 null 을 그대로 싣는다(`Include.ALWAYS`). 키 자체가 빠지는 건 `@JsonInclude(NON_NULL)`
 * 이 붙은 필드뿐이고, 여기서는 `?:` 로 적었다.
 */

export type QuizMatchingType = "ONE_TO_ONE" | "GROUP";

/* ────────────────────────── 기록 탭 — GET /api/v1/quiz-history ────────────────────────── */

export type QuizHistorySummary = {
  /** 끝까지 푼 주의 수. */
  participatedWeeks: number;
  /** 끝까지 푼 퀴즈셋들의 답 수 합. */
  answeredQuestions: number;
  /** 결과가 공개된(마감된) 주에서 내 답이 소수 의견이었던 문항 수 합. */
  minorityCount: number;
};

/** 이번 운영 주 퀴즈를 끝까지 풀었을 때만 온다. */
export type QuizHistoryCurrentWeek = {
  quizSetId: number;
  /** 서버 시각 기준 결과 공개 시각이 지났는지. 기기 시계로 판정하지 않는다. */
  resultOpen: boolean;
  /** 결과 공개 시각(응답 마감 뒤 첫 자정, 지금 규칙은 목 00:00). yyyy-MM-dd HH:mm:ss */
  resultOpensAt: string;
};

/** 끝까지 푼 퀴즈셋 하나. 목록은 최신 주가 먼저고 이번 주도 들어 있다. */
export type QuizHistoryWeek = {
  quizSetId: number;
  /** 그 주의 월요일, yyyy-MM-dd. 주차("11월 2주차")도 이 값에서 계산한다(서버 OperationWeek). */
  weekStartedOn: string;
  matchingType: QuizMatchingType;
  title: string;
  /** 결과 공개 전이면 null — 공개 여부도 이 값으로 가른다. */
  minorityCount: number | null;
};

export type QuizHistoryResponse = {
  summary: QuizHistorySummary;
  /** 이번 주 퀴즈를 끝까지 풀지 않았으면 null. */
  currentWeek: QuizHistoryCurrentWeek | null;
  weeks: QuizHistoryWeek[];
};

/* ────────────────────────── 주차 상세 — GET /api/v1/quiz-history/{quizSetId} ────────────────────────── */

export type QuizHistoryPhase = "IN_PROGRESS" | "CLOSED";

export type QuizHistoryChoice = {
  choiceId: number;
  content: string;
  /** CLOSED 일 때만. 마감 스냅샷의 0~100 정수(문항 합 100). IN_PROGRESS 에는 키가 없다. */
  percent?: number;
  /** CLOSED 일 때만. 이 선택지가 소수 의견인지(판정은 서버). IN_PROGRESS 에는 키가 없다. */
  minority?: boolean;
};

export type QuizHistoryAnswer = {
  quizId: number;
  order: number;
  question: string;
  /** 서버가 선택지 순서대로 준다. */
  choices: QuizHistoryChoice[];
  myChoiceId: number | null;
};

export type QuizHistoryResult = {
  /** "나와 {overlapThreshold}개 이상 답이 겹친 사람" — ceil(문항 수 × 2/3). */
  overlapThreshold: number;
  overlapCount: number;
  minorityCount: number;
};

export type QuizHistoryDetail = {
  quizSetId: number;
  title: string;
  matchingType: QuizMatchingType;
  weekStartedOn: string;
  phase: QuizHistoryPhase;
  resultOpensAt: string;
  /** IN_PROGRESS: 홈과 같은 지금까지 완주자 수. CLOSED: 스냅샷의 최종 참여자 수. */
  participantCount: number;
  answers: QuizHistoryAnswer[];
  /** CLOSED 일 때만. IN_PROGRESS 에는 키가 없다. */
  result?: QuizHistoryResult;
};

/* ────────────────────────── 대화방 답변 보기 ────────────────────────── */

/**
 * 머리 카드 원에 그릴 방 멤버. 서버 답변 API 에는 멤버가 없어 방 멤버 API 에서 만든다.
 * 나를 포함하고, 방을 나간 사람은 뺀다.
 */
export type RoomQuizMember = {
  memberId: number;
  nickname: string;
  isMe: boolean;
};

export type QuizComparePercentChoice = {
  choiceId: number;
  content: string;
  /** 그 주 전체 완주자 기준(마감 스냅샷). */
  percent: number;
};

export type QuizCompareItem = {
  quizId: number;
  order: number;
  question: string;
  choices: QuizComparePercentChoice[];
  myChoiceId: number | null;
  peerChoiceId: number | null;
  same: boolean;
  /** 내 선택 기준 소수 의견. */
  minority: boolean;
  /** 문항별 대화 힌트 질문. 없으면 null → FE 공통 문구. */
  hintQuestion: string | null;
  /** 이 방에 이미 카드로 올린 문항. */
  sent: boolean;
};

/** GET /api/v1/chat/rooms/{roomId}/quiz-compare — 1:1·재매칭 방. */
export type QuizCompareResponse = {
  quizSetId: number;
  totalCount: number;
  sameCount: number;
  diffCount: number;
  /** 같은 답 중 소수 의견이고 내 선택 비율이 가장 낮은 문항. 없으면 null. */
  highlightQuizId: number | null;
  /** 방이 ACTIVE 이고 서버 QUIZ_CHAT 플래그가 켜져 있을 때만 true. */
  canSendCard: boolean;
  /** 방 개방 시각. 열리기 전 딤드 버튼 문구에 쓴다. yyyy-MM-dd HH:mm:ss */
  chatOpensAt: string;
  items: QuizCompareItem[];
};

export type QuizDistributionChoice = {
  choiceId: number;
  content: string;
  /** 방에 남아 있는 멤버 중 고른 사람 수. 누가 골랐는지는 오지 않는다. */
  count: number;
};

export type QuizDistributionItem = {
  quizId: number;
  order: number;
  question: string;
  choices: QuizDistributionChoice[];
  myChoiceId: number | null;
  unanimous: boolean;
  hintQuestion: string | null;
  sent: boolean;
};

/** GET /api/v1/chat/rooms/{roomId}/quiz-distribution — 그룹 방. */
export type QuizDistributionResponse = {
  quizSetId: number;
  /** 방에 남아 있는 멤버 수. */
  memberCount: number;
  totalCount: number;
  /** 배너 "다 같은 답 N". */
  unanimousCount: number;
  /** 배너 "반반 M" = totalCount − unanimousCount. 아래 `splitQuizIds` 와 다른 숫자다. */
  splitCount: number;
  /** 상세 "반반 갈린 질문" — 만장일치 제외, 인원 차가 작은 순, 최대 3개. */
  splitQuizIds: number[];
  canSendCard: boolean;
  chatOpensAt: string;
  items: QuizDistributionItem[];
};

/** 질문 카드로 담을 수 있는 문항 — 1:1·그룹 공통으로 쓰는 부분. */
export type RoomQuizItem = QuizCompareItem | QuizDistributionItem;
