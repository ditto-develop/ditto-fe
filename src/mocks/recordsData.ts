import type { ChatMessage } from "@/features/chat/model/types";
import type {
  ChatQuizCard,
  QuizRecordDetail,
  QuizRecordItem,
  QuizRecordQuestion,
  QuizRecordsResponse,
  RoomQuizAnswers,
  RoomQuizMember,
  RoomQuizQuestion,
} from "@/features/records/model/types";

/*
 * 8.1 퀴즈 기록 목업(MSW). 값은 Figma 8.1 [3240:35265] 시안을 따른다.
 * 운영 BE 에 아직 없는 API 라(위키 BE-Request-Quiz-Records) 화면 확인은 이 목업으로 한다.
 *
 * 목업의 나는 member 1 이다(chat-messages.json 의 senderId 1).
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
  prompt: string;
  topic: string;
};

/** "시간이 멈춘다면" 12문항. 소수 의견(비율 < 25%)은 Q3·Q6 두 개. */
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

const MINORITY_PERCENT = 25;

function quizId(index: number): number {
  return 4200 + index + 1;
}

function choiceId(questionIndex: number, choiceIndex: number): number {
  return quizId(questionIndex) * 10 + choiceIndex + 1;
}

/* ────────────────────────── 기록 탭 ────────────────────────── */

const RECORD_ITEMS: QuizRecordItem[] = [
  {
    quizSetId: 42,
    year: 2026,
    month: 10,
    week: 4,
    weekStartedOn: "2026-10-26",
    matchingType: "ONE_TO_ONE",
    title: "시간이 멈춘다면",
    answeredCount: 12,
    totalCount: 12,
    submittedAt: "2026-10-27 21:14:00",
    statsRevealAt: "2026-10-29 00:00:00",
    revealed: false,
    isCurrentWeek: true,
    minorityCount: null,
  },
  {
    quizSetId: 41,
    year: 2026,
    month: 10,
    week: 3,
    weekStartedOn: "2026-10-19",
    matchingType: "GROUP",
    title: "가을 밤, 같이 볼 영화",
    answeredCount: 12,
    totalCount: 12,
    submittedAt: "2026-10-20 22:03:00",
    statsRevealAt: "2026-10-22 00:00:00",
    revealed: true,
    isCurrentWeek: false,
    minorityCount: 2,
  },
  {
    quizSetId: 40,
    year: 2026,
    month: 10,
    week: 2,
    weekStartedOn: "2026-10-12",
    matchingType: "ONE_TO_ONE",
    title: "비 오는 날의 기억",
    answeredCount: 12,
    totalCount: 12,
    submittedAt: "2026-10-13 08:41:00",
    statsRevealAt: "2026-10-15 00:00:00",
    revealed: true,
    isCurrentWeek: false,
    minorityCount: 3,
  },
];

export const quizRecords: QuizRecordsResponse = {
  summary: { participatedWeeks: 3, answeredQuestions: 36, minorityOpinions: 5 },
  records: RECORD_ITEMS,
};

function recordQuestions(revealed: boolean): QuizRecordQuestion[] {
  return SEED.map((seed, index) => {
    const mine = choiceId(index, seed.mine);
    const minePercent = seed.choices[seed.mine][1];
    return {
      quizId: quizId(index),
      order: index + 1,
      question: seed.question,
      myChoiceId: mine,
      isMinority: revealed ? minePercent < MINORITY_PERCENT : null,
      choices: seed.choices.map(([content, percent], choiceIndex) => ({
        choiceId: choiceId(index, choiceIndex),
        content,
        order: choiceIndex + 1,
        percent: revealed ? percent : null,
      })),
    };
  });
}

/** 목록에 없는 id 면 null(→ 404). */
export function quizRecordDetail(quizSetId: number): QuizRecordDetail | null {
  const item = RECORD_ITEMS.find((record) => record.quizSetId === quizSetId);
  if (!item) return null;
  return {
    ...item,
    minorityCount: item.revealed ? 2 : null,
    participantCount: item.revealed ? 312 : 87,
    similarMemberCount: item.revealed ? 23 : null,
    similarThreshold: 8,
    questions: recordQuestions(item.revealed),
  };
}

/* ────────────────────────── 대화방 "우리의 답변" ────────────────────────── */

const ONE_ON_ONE_MEMBERS: RoomQuizMember[] = [
  { memberId: ME, nickname: "나", isMe: true },
  { memberId: 2, nickname: "사부작사부작", isMe: false },
];

const GROUP_MEMBERS: RoomQuizMember[] = [
  { memberId: ME, nickname: "나", isMe: true },
  { memberId: 2, nickname: "사부작사부작", isMe: false },
  { memberId: 3, nickname: "서준", isMe: false },
  { memberId: 4, nickname: "도윤", isMe: false },
];

/** roomId → (quizId → 올린 시각). 1:1 방은 Q2 를 이미 올린 상태로 시작한다(Figma 3257:52969). */
const sharedAtByRoom = new Map<number, Map<number, string>>([
  [1, new Map([[quizId(1), "2026-06-05 16:40:00"]])],
]);

function roomQuestions(roomId: number, group: boolean): RoomQuizQuestion[] {
  const shared = sharedAtByRoom.get(roomId);
  return SEED.map((seed, index) => {
    const pickers = (choiceIndex: number): number[] =>
      group
        ? GROUP_MEMBERS.filter((_, memberIndex) => seed.group[memberIndex] === choiceIndex).map(
            (member) => member.memberId,
          )
        : [
            ...(seed.mine === choiceIndex ? [ME] : []),
            ...(seed.partner === choiceIndex ? [2] : []),
          ];

    return {
      quizId: quizId(index),
      order: index + 1,
      question: seed.question,
      prompt: seed.prompt,
      myChoiceId: choiceId(index, group ? seed.group[0] : seed.mine),
      sharedAt: shared?.get(quizId(index)) ?? null,
      choices: seed.choices.map(([content, percent], choiceIndex) => {
        const memberIds = pickers(choiceIndex);
        return {
          choiceId: choiceId(index, choiceIndex),
          content,
          order: choiceIndex + 1,
          memberCount: memberIds.length,
          // 그룹은 누가 골랐는지 숨긴다(서버 계약).
          memberIds: group ? null : memberIds,
          percent,
        };
      }),
    };
  });
}

/** 퀴즈로 만든 방이 아니면 null(→ 404). 목업 방: 1(1:1), 3(그룹). */
export function roomQuizAnswers(roomId: number): RoomQuizAnswers | null {
  if (roomId !== 1 && roomId !== 3) return null;
  const group = roomId === 3;

  if (group) {
    return {
      roomId,
      quizSetId: 41,
      title: "가을 밤, 같이 볼 영화",
      members: GROUP_MEMBERS,
      questions: roomQuestions(roomId, true),
      firstHint: {
        quizId: quizId(7),
        topic: "고민이 생기면",
        choiceContent: "혼자 정리하기",
        prompt: "요즘 정리하고 싶은 고민이 있어요?",
        percent: 40,
      },
    };
  }

  return {
    roomId,
    quizSetId: 42,
    title: "시간이 멈춘다면",
    members: ONE_ON_ONE_MEMBERS,
    questions: roomQuestions(roomId, false),
    firstHint: {
      quizId: quizId(2),
      topic: "시간이 멈춘다면",
      choiceContent: "새벽 2시",
      prompt: "그 시간엔 주로 뭘 하세요?",
      percent: 18,
    },
  };
}

/* ────────────────────────── 질문 보내기 ────────────────────────── */

export type MockQuizMessage = ChatMessage & { quiz: ChatQuizCard };

const quizMessagesByRoom = new Map<number, MockQuizMessage[]>();
let nextQuizMessageId = 9000;

function nowServerString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

/** 방에 문항을 올린다. 없는 문항이면 null(→ 404). */
export function shareQuiz(roomId: number, targetQuizId: number, content: string): MockQuizMessage | null {
  const answers = roomQuizAnswers(roomId);
  const question = answers?.questions.find((q) => q.quizId === targetQuizId);
  if (!answers || !question) return null;

  const createdAt = nowServerString();
  const shared = sharedAtByRoom.get(roomId) ?? new Map<number, string>();
  shared.set(targetQuizId, createdAt);
  sharedAtByRoom.set(roomId, shared);

  const message: MockQuizMessage = {
    id: nextQuizMessageId++,
    roomId,
    senderId: ME,
    messageType: "QUIZ",
    content,
    imageUrl: null,
    unreadCount: answers.members.length - 1,
    createdAt,
    quiz: {
      quizId: question.quizId,
      order: question.order,
      question: question.question,
      prompt: question.prompt,
      choices: question.choices.map(({ choiceId: id, content: label, memberCount, memberIds }) => ({
        choiceId: id,
        content: label,
        memberCount,
        memberIds,
      })),
    },
  };

  const list = quizMessagesByRoom.get(roomId) ?? [];
  quizMessagesByRoom.set(roomId, [message, ...list]);
  return message;
}

/** 메시지 목록 핸들러가 최신순 앞에 붙인다. */
export function listQuizMessages(roomId: number): MockQuizMessage[] {
  return quizMessagesByRoom.get(roomId) ?? [];
}
