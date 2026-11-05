import type {
  ChatMessage,
  PairQuizCardContent,
  QuizHintContent,
} from "@/features/chat/model/types";
import type {
  QuizCompareResponse,
  QuizDistributionResponse,
  QuizHistoryAnswer,
  QuizHistoryDetail,
  QuizHistoryResponse,
  QuizHistoryWeek,
} from "@/features/records/model/types";

/*
 * 8.1 퀴즈 기록 · 대화방 답변 비교 목업(MSW). 모양은 서버 IMP-1 계약(ditto-server #366), 값은 Figma 8.1
 * [3240:35265] 시안을 따른다.
 *
 * 목업의 나는 member 1 이다(chat-messages.json 의 senderId 1). 질문 카드 전송은 STOMP 라 MSW 로
 * 흉내 낼 수 없다 — 대신 첫 대화 힌트와 상대가 올린 카드 한 장을 메시지 목록에 미리 넣어 둔다.
 */

const ME = 1;

type SeedQuestion = {
  question: string;
  /** [선택지, 전체 비율] — 비율은 문항 합 100. */
  choices: Array<[string, number]>;
  /** 내가 고른 선택지 index. */
  mine: number;
  /** 1:1 방 상대(member 2)가 고른 선택지 index. */
  partner: number;
  /** 그룹 방(나 + 2·3·4) 멤버별 선택 index — [나, 2, 3, 4]. */
  group: [number, number, number, number];
  /** 문항별 대화 힌트 질문(서버 `quiz.hint_question`). */
  prompt: string;
  topic: string;
};

/** "시간이 멈춘다면" 12문항. 소수 의견(비율 ≤ 20%, 서버 `선택 수 × 5 ≤ 참여자`)은 Q3·Q6 두 개. */
const SEED: SeedQuestion[] = [
  { question: "커튼을 열면 보이는 색은?", choices: [["하늘빛", 58], ["노을빛", 42]], mine: 1, partner: 0, group: [0, 0, 1, 1], prompt: "그 색을 보면 어떤 장면이 떠올라요?", topic: "커튼을 열면" },
  { question: "반려견 이름을 짓는다면?", choices: [["후추", 47], ["소금", 53]], mine: 0, partner: 0, group: [0, 0, 0, 0], prompt: "그 이름엔 어떤 사연이 있어요?", topic: "반려견 이름을 짓는다면" },
  { question: "시간이 멈춘다면 그 시각은?", choices: [["오후 3시", 82], ["새벽 2시", 18]], mine: 1, partner: 1, group: [1, 1, 1, 0], prompt: "그 시간엔 주로 뭘 하세요?", topic: "시간이 멈춘다면" },
  { question: "편의점에서 하나만 고른다면?", choices: [["제로콜라", 51], ["홈런볼", 49]], mine: 1, partner: 0, group: [1, 0, 0, 1], prompt: "편의점에 가면 꼭 들르는 칸이 있어요?", topic: "편의점에서 하나만 고른다면" },
  { question: "비 오는 날 귀갓길은?", choices: [["지하철", 66], ["버스", 34]], mine: 1, partner: 1, group: [1, 1, 1, 0], prompt: "비 오는 날 창밖 보는 거 좋아해요?", topic: "비 오는 날 귀갓길은" },
  { question: "여름 끝에 남기고 싶은 맛?", choices: [["메로나", 81], ["비비빅", 19]], mine: 1, partner: 1, group: [1, 0, 1, 1], prompt: "올여름 제일 맛있었던 건 뭐였어요?", topic: "여름 끝에 남기고 싶은 맛으로" },
  { question: "냄새로 기억된다면?", choices: [["섬유유연제", 55], ["애착이불", 45]], mine: 1, partner: 0, group: [1, 0, 1, 1], prompt: "좋아하는 냄새가 있어요?", topic: "냄새로 기억된다면" },
  { question: "고민이 생기면?", choices: [["친구에게 털어놓기", 60], ["혼자 정리하기", 40]], mine: 1, partner: 1, group: [1, 1, 1, 1], prompt: "요즘 정리하고 싶은 고민이 있어요?", topic: "고민이 생기면" },
  { question: "하루 끝에 듣고 싶은 말?", choices: [["잘 자", 44], ["수고했어", 56]], mine: 1, partner: 1, group: [1, 0, 0, 1], prompt: "오늘 하루는 어땠어요?", topic: "하루 끝에" },
  { question: "오래 남는 건?", choices: [["함께 간 장소", 38], ["나눈 대화", 62]], mine: 1, partner: 1, group: [1, 1, 1, 1], prompt: "오래 기억에 남는 대화가 있어요?", topic: "오래 남는 건" },
  { question: "주말 아침 첫 일과는?", choices: [["늦잠", 64], ["산책", 36]], mine: 0, partner: 1, group: [0, 0, 1, 1], prompt: "주말 아침엔 주로 뭐 해요?", topic: "주말 아침엔" },
  { question: "여행 가방에 꼭 넣는 건?", choices: [["책", 41], ["카메라", 59]], mine: 1, partner: 0, group: [1, 1, 1, 1], prompt: "최근에 다녀온 여행지는 어디예요?", topic: "여행 가방에" },
];

/** 서버 규칙(`선택 수 × 5 ≤ 참여자 수`)을 비율로 옮긴 값. 목업 참여자는 20명이 넘는다. */
const MINORITY_MAX_PERCENT = 20;

function quizId(index: number): number {
  return 4200 + index + 1;
}

function choiceId(questionIndex: number, choiceIndex: number): number {
  return quizId(questionIndex) * 10 + choiceIndex + 1;
}

/* ────────────────────────── 기록 탭 ────────────────────────── */

const WEEKS: QuizHistoryWeek[] = [
  { quizSetId: 42, weekStartedOn: "2026-10-26", matchingType: "ONE_TO_ONE", title: "시간이 멈춘다면", minorityCount: null },
  { quizSetId: 41, weekStartedOn: "2026-10-19", matchingType: "GROUP", title: "가을 밤, 같이 볼 영화", minorityCount: 2 },
  { quizSetId: 40, weekStartedOn: "2026-10-12", matchingType: "ONE_TO_ONE", title: "비 오는 날의 기억", minorityCount: 3 },
];

export const quizHistory: QuizHistoryResponse = {
  summary: { participatedWeeks: 3, answeredQuestions: 36, minorityCount: 5 },
  currentWeek: { quizSetId: 42, resultOpen: false, resultOpensAt: "2026-10-29 00:00:00" },
  weeks: WEEKS,
};

function historyAnswers(closed: boolean): QuizHistoryAnswer[] {
  return SEED.map((seed, index) => ({
    quizId: quizId(index),
    order: index + 1,
    question: seed.question,
    // 마감 전에는 비율·소수 의견 키 자체가 없다(서버 계약).
    choices: seed.choices.map(([content, percent], choiceIndex) =>
      closed
        ? { choiceId: choiceId(index, choiceIndex), content, percent, minority: percent <= MINORITY_MAX_PERCENT }
        : { choiceId: choiceId(index, choiceIndex), content },
    ),
    myChoiceId: choiceId(index, seed.mine),
  }));
}

/** 목록에 없는 id 면 null(→ 404 · 4006). */
export function quizHistoryDetail(quizSetId: number): QuizHistoryDetail | null {
  const week = WEEKS.find((item) => item.quizSetId === quizSetId);
  if (!week) return null;
  const closed = week.minorityCount !== null;
  const base: QuizHistoryDetail = {
    quizSetId: week.quizSetId,
    title: week.title,
    matchingType: week.matchingType,
    weekStartedOn: week.weekStartedOn,
    phase: closed ? "CLOSED" : "IN_PROGRESS",
    resultOpensAt: "2026-10-29 00:00:00",
    participantCount: closed ? 312 : 87,
    answers: historyAnswers(closed),
  };
  return closed ? { ...base, result: { overlapThreshold: 8, overlapCount: 23, minorityCount: 2 } } : base;
}

/* ────────────────────────── 대화방 답변 보기 ────────────────────────── */

/** 그룹 방 멤버 순서 — SEED.group 의 [나, 2, 3, 4]. */
const GROUP_MEMBER_IDS = [ME, 2, 3, 4] as const;

/** roomId → 이미 카드로 올린 문항. 1:1 방은 Q2 를 상대가 올린 상태로 시작한다(Figma 3257:52969). */
const sentByRoom = new Map<number, Set<number>>([[1, new Set([quizId(1)])]]);

function isSent(roomId: number, targetQuizId: number): boolean {
  return sentByRoom.get(roomId)?.has(targetQuizId) ?? false;
}

/** 1:1 방(1)만. 그 밖은 null(→ 404). */
export function roomQuizCompare(roomId: number): QuizCompareResponse | null {
  if (roomId !== 1) return null;
  const items = SEED.map((seed, index) => {
    const minePercent = seed.choices[seed.mine][1];
    return {
      quizId: quizId(index),
      order: index + 1,
      question: seed.question,
      choices: seed.choices.map(([content, percent], choiceIndex) => ({
        choiceId: choiceId(index, choiceIndex),
        content,
        percent,
      })),
      myChoiceId: choiceId(index, seed.mine),
      peerChoiceId: choiceId(index, seed.partner),
      same: seed.mine === seed.partner,
      minority: minePercent <= MINORITY_MAX_PERCENT,
      hintQuestion: seed.prompt,
      sent: isSent(roomId, quizId(index)),
    };
  });
  const sameCount = items.filter((item) => item.same).length;
  // 같은 답 중 소수 의견이고 내 선택 비율이 가장 낮은 문항(서버 규칙).
  const highlight = items
    .filter((item) => item.same && item.minority)
    .sort((a, b) => {
      const percentOf = (item: (typeof items)[number]) =>
        item.choices.find((choice) => choice.choiceId === item.myChoiceId)?.percent ?? 100;
      return percentOf(a) - percentOf(b) || a.order - b.order;
    })[0];
  return {
    quizSetId: 42,
    totalCount: items.length,
    sameCount,
    diffCount: items.length - sameCount,
    highlightQuizId: highlight?.quizId ?? null,
    canSendCard: true,
    chatOpensAt: "2026-06-05 00:00:00",
    items,
  };
}

/** 그룹 방(3)만. 그 밖은 null(→ 404). */
export function roomQuizDistribution(roomId: number): QuizDistributionResponse | null {
  if (roomId !== 3) return null;
  const items = SEED.map((seed, index) => {
    const counts = seed.choices.map(
      (_, choiceIndex) => seed.group.filter((picked) => picked === choiceIndex).length,
    );
    return {
      quizId: quizId(index),
      order: index + 1,
      question: seed.question,
      choices: seed.choices.map(([content], choiceIndex) => ({
        choiceId: choiceId(index, choiceIndex),
        content,
        count: counts[choiceIndex],
      })),
      myChoiceId: choiceId(index, seed.group[0]),
      unanimous: counts.some((count) => count === GROUP_MEMBER_IDS.length),
      hintQuestion: seed.prompt,
      sent: isSent(roomId, quizId(index)),
    };
  });
  // 인원 차(가장 많이 고른 선택지 − 가장 적게 고른 선택지)가 작은 순, 동률은 문항 순서(서버 규칙).
  const gapOf = (item: (typeof items)[number]) => {
    const counts = item.choices.map((choice) => choice.count);
    return Math.max(...counts) - Math.min(...counts);
  };
  const unanimousCount = items.filter((item) => item.unanimous).length;
  const splitQuizIds = items
    .filter((item) => !item.unanimous)
    .sort((a, b) => gapOf(a) - gapOf(b) || a.order - b.order)
    .slice(0, 3)
    .map((item) => item.quizId);
  return {
    quizSetId: 41,
    memberCount: GROUP_MEMBER_IDS.length,
    totalCount: items.length,
    unanimousCount,
    splitCount: items.length - unanimousCount,
    splitQuizIds,
    canSendCard: true,
    chatOpensAt: "2026-06-05 00:00:00",
    items,
  };
}

/* ────────────────────────── 퀴즈 메시지(QUIZ_HINT · QUIZ_CARD) ────────────────────────── */

function hintMessage(id: number, roomId: number, hint: QuizHintContent): ChatMessage {
  return {
    id,
    roomId,
    senderId: null,
    messageType: "QUIZ_HINT",
    content: JSON.stringify(hint),
    imageUrl: null,
    unreadCount: 0,
    createdAt: "2026-06-05 00:00:00",
  };
}

const q2 = SEED[1];
const PAIR_CARD: PairQuizCardContent = {
  quizId: quizId(1),
  question: q2.question,
  choices: q2.choices.map(([content], choiceIndex) => ({ choiceId: choiceId(1, choiceIndex), content })),
  // 상대(member 2)가 보냈다 — 보낸 사람 기준으로 싣는다.
  senderChoiceId: choiceId(1, q2.partner),
  peerChoiceId: choiceId(1, q2.mine),
  hintQuestion: q2.prompt,
};

/** 방이 열릴 때 서버가 남긴 첫 대화 힌트 + (1:1) 상대가 올린 카드. 메시지 목록 핸들러가 섞는다. */
const QUIZ_MESSAGES: Record<number, ChatMessage[]> = {
  1: [
    hintMessage(25, 1, {
      quizId: quizId(2),
      kind: "SAME",
      question: SEED[2].question,
      answer: "새벽 2시",
      hintQuestion: SEED[2].prompt,
    }),
    {
      id: 26,
      roomId: 1,
      senderId: 2,
      messageType: "QUIZ_CARD",
      content: JSON.stringify(PAIR_CARD),
      imageUrl: null,
      unreadCount: 0,
      createdAt: "2026-06-05 16:40:00",
    },
  ],
  3: [
    hintMessage(39, 3, {
      quizId: quizId(7),
      kind: "UNANIMOUS",
      question: SEED[7].question,
      answer: "혼자 정리하기",
      hintQuestion: SEED[7].prompt,
    }),
  ],
};

export function listQuizMessages(roomId: number): ChatMessage[] {
  return QUIZ_MESSAGES[roomId] ?? [];
}
