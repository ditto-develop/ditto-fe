/**
 * 8.1 퀴즈 기록 — BE 계약(요청서: ditto-fe 위키 BE-Request-Quiz-Records, 2026-11-03).
 *
 * 2026-11-03 기준 **운영 BE 에 아직 없는 API** 다. 화면은 테스터 모드(`records` 플래그) 뒤에 있고,
 * 목업은 MSW(`src/mocks/handlers.ts`)에 있다. BE 회신으로 모양이 바뀌면 여기부터 고친다.
 */

export type QuizMatchingType = "ONE_TO_ONE" | "GROUP";

/* ────────────────────────── 기록 탭 ────────────────────────── */

/** GET /api/v1/quiz-records 의 상단 요약 3칸. */
export type QuizRecordSummary = {
  /** 퀴즈를 끝까지 푼 주의 수. */
  participatedWeeks: number;
  /** 끝까지 푼 퀴즈셋들의 답 수 합. */
  answeredQuestions: number;
  /** 통계가 공개된 퀴즈셋에서 내 답이 소수 의견이었던 문항 수 합. */
  minorityOpinions: number;
};

/** 내가 끝까지 푼 퀴즈셋 하나. 목록은 최신 주가 먼저다. */
export type QuizRecordItem = {
  quizSetId: number;
  /** 운영 주차 — `/system/state` 와 같은 키. "4주차" 의 4 가 `week` 다. */
  year: number;
  month: number;
  week: number;
  /** 그 주의 월요일, yyyy-MM-dd. "10월 26일 주". */
  weekStartedOn: string;
  matchingType: QuizMatchingType;
  title: string;
  answeredCount: number;
  totalCount: number;
  /** 마지막 답을 내 퀴즈를 끝낸 시각(yyyy-MM-dd HH:mm:ss). */
  submittedAt: string | null;
  /** 선택 비율 통계가 공개되는 시각(목요일 00:00). */
  statsRevealAt: string;
  /** 서버 시각 기준 `statsRevealAt` 이 지났는지. 클라이언트 시계로 판정하지 않는다. */
  revealed: boolean;
  /** 지금 운영 주의 퀴즈셋인지. 기록 탭 맨 위 "이번 주" 카드가 된다. */
  isCurrentWeek: boolean;
  /** `revealed` 일 때만. 이 퀴즈셋에서 내 답이 소수 의견이었던 문항 수. */
  minorityCount: number | null;
};

export type QuizRecordsResponse = {
  summary: QuizRecordSummary;
  records: QuizRecordItem[];
};

export type QuizRecordChoice = {
  choiceId: number;
  content: string;
  order: number;
  /** `revealed` 일 때만. 완주자 중 이 선택지를 고른 비율, 0~100 정수(문항 합 100). */
  percent: number | null;
};

export type QuizRecordQuestion = {
  quizId: number;
  order: number;
  question: string;
  myChoiceId: number | null;
  /** `revealed` 일 때만. 내 답이 소수 의견인지(판정 기준은 서버). */
  isMinority: boolean | null;
  choices: QuizRecordChoice[];
};

/** GET /api/v1/quiz-records/{quizSetId} — "내 답변 보기"(공개 전) · "퀴즈 결과"(공개 후). */
export type QuizRecordDetail = QuizRecordItem & {
  /** 이 퀴즈셋을 끝까지 푼 사람 수. 공개 전에는 "지금까지" 값이다. */
  participantCount: number;
  /** `revealed` 일 때만. 나와 `similarThreshold`개 이상 같은 답을 고른 사람 수. */
  similarMemberCount: number | null;
  /** "나와 8개 이상 답이 겹친 사람" 의 8. */
  similarThreshold: number;
  questions: QuizRecordQuestion[];
};

/* ────────────────────────── 대화방 "우리의 답변" ────────────────────────── */

/** 방 멤버. 나를 포함하고, 방을 나간 사람은 빠진다. */
export type RoomQuizMember = {
  memberId: number;
  nickname: string;
  isMe: boolean;
};

export type RoomQuizChoice = {
  choiceId: number;
  content: string;
  order: number;
  /** 이 방 멤버 중 이 선택지를 고른 사람 수. */
  memberCount: number;
  /**
   * 고른 멤버 id. **1:1 방에서만** 값이 있다. 그룹은 "누가 어떤 답을 골랐는지는 보이지 않아요"
   * 라 서버가 null 을 준다.
   */
  memberIds: number[] | null;
  /** 통계 공개 후에만. 전체 완주자 중 이 선택지를 고른 비율(0~100). */
  percent: number | null;
};

export type RoomQuizQuestion = {
  quizId: number;
  order: number;
  question: string;
  /** 어드민이 문항마다 적어 두는 대화 힌트 질문("그 시간엔 주로 뭘 하세요?"). 없으면 null. */
  prompt: string | null;
  myChoiceId: number | null;
  choices: RoomQuizChoice[];
  /** 이 방에 이 문항을 올린 적이 있으면 그 시각. 1:1 은 이 값이 있으면 "말 걸기" 를 막는다. */
  sharedAt: string | null;
};

/** 첫 대화 힌트 — 모두 같은 답을 고른 문항 중 전체에서 가장 적게 고른 답. */
export type RoomQuizHint = {
  quizId: number;
  /** 문장 속에 들어갈 짧은 주제("시간이 멈춘다면"). */
  topic: string;
  /** 모두가 고른 답("새벽 2시"). */
  choiceContent: string;
  /** 이어서 던질 질문("그 시간엔 주로 뭘 하세요?"). */
  prompt: string;
  /** 통계 공개 후에만. 전체 중 이 답을 고른 비율. */
  percent: number | null;
};

/** GET /api/v1/chat/rooms/{roomId}/quiz-answers */
export type RoomQuizAnswers = {
  roomId: number;
  quizSetId: number;
  title: string;
  members: RoomQuizMember[];
  questions: RoomQuizQuestion[];
  firstHint: RoomQuizHint | null;
};

/** POST /api/v1/chat/rooms/{roomId}/quiz-shares */
export type ShareQuizRequest = {
  quizId: number;
  /** 덧붙인 한마디. 비워도 보낼 수 있다(Figma: "텍스트 없어도 전송 버튼 활성"). */
  content?: string;
};

/**
 * 채팅 메시지 `messageType: "QUIZ"` 에 실리는 문항 카드. 보낸 순간의 스냅샷이라
 * 나중에 방 멤버가 바뀌어도 카드는 그대로다.
 */
export type ChatQuizCard = {
  quizId: number;
  order: number;
  question: string;
  /**
   * 문항의 대화 힌트 질문(`RoomQuizQuestion.prompt`). 그룹 카드는 "질문 + 답 + 힌트 질문 한 줄"이라
   * (Figma 3273:38071·3273:38072) 방 답변을 못 읽는 일반 회원에게도 보이려면 스냅샷에 있어야 한다.
   */
  prompt: string | null;
  choices: Array<Pick<RoomQuizChoice, "choiceId" | "content" | "memberCount" | "memberIds">>;
};
