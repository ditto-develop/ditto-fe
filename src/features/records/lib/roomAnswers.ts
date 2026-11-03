import type {
  RoomQuizAnswers,
  RoomQuizChoice,
  RoomQuizMember,
  RoomQuizQuestion,
} from "@/features/records/model/types";

/*
 * 대화방 "우리의 답변" 분류. 서버는 문항별 선택지와 방 멤버의 선택 수만 주고, 같은 답/다른 답·
 * 반반 같은 묶음은 FE 가 나눈다(1:1·그룹이 같은 응답 모양을 쓰게 하려고).
 */

/** 1:1 방 문항 하나 — 나와 상대가 고른 선택지. */
export type OneOnOneQuestionView = {
  question: RoomQuizQuestion;
  mine: RoomQuizChoice | null;
  partner: RoomQuizChoice | null;
  same: boolean;
};

/**
 * 그룹 방 문항 묶음.
 * - `ALL_SAME`: 모두 같은 답 — "다 같이 고른 답"
 * - `SPLIT`: 두 선택지에 정확히 반씩 — "반반 갈린 질문"(이야기거리 1순위)
 * - `OTHER`: 그 밖 — "나머지 질문"
 */
export type GroupAgreement = "ALL_SAME" | "SPLIT" | "OTHER";

export type GroupQuestionView = {
  question: RoomQuizQuestion;
  agreement: GroupAgreement;
  /** 이 문항에 답한 방 멤버 수(점 개수). 보통 멤버 수와 같다. */
  answered: number;
};

export type RoomAnswersSummary =
  | { kind: "ONE_ON_ONE"; same: number; different: number }
  | { kind: "GROUP"; allSame: number; split: number; other: number };

/** 멤버가 둘이면 1:1 로 본다. 그룹 방에서 둘만 남아도 서버가 memberIds 를 주지 않으면 그룹 표시다. */
export function isOneOnOneAnswers(data: RoomQuizAnswers): boolean {
  return (
    data.members.length === 2 &&
    data.questions.every((q) => q.choices.every((c) => c.memberIds !== null))
  );
}

export function findPartner(members: RoomQuizMember[]): RoomQuizMember | null {
  return members.find((member) => !member.isMe) ?? null;
}

function byOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export function toOneOnOneView(
  question: RoomQuizQuestion,
  partnerId: number | null,
): OneOnOneQuestionView {
  const mine = question.choices.find((c) => c.choiceId === question.myChoiceId) ?? null;
  const partner =
    partnerId === null
      ? null
      : (question.choices.find((c) => c.memberIds?.includes(partnerId)) ?? null);
  return {
    question,
    mine,
    partner,
    same: mine !== null && partner !== null && mine.choiceId === partner.choiceId,
  };
}

export function classifyGroupQuestion(question: RoomQuizQuestion): GroupQuestionView {
  const counts = question.choices.map((c) => c.memberCount).filter((n) => n > 0);
  const answered = counts.reduce((sum, n) => sum + n, 0);

  let agreement: GroupAgreement = "OTHER";
  if (answered > 1 && counts.length === 1) agreement = "ALL_SAME";
  else if (answered > 1 && counts.length === 2 && counts[0] === counts[1]) agreement = "SPLIT";

  return { question, agreement, answered };
}

export function toOneOnOneViews(data: RoomQuizAnswers): OneOnOneQuestionView[] {
  const partnerId = findPartner(data.members)?.memberId ?? null;
  return byOrder(data.questions).map((q) => toOneOnOneView(q, partnerId));
}

export function toGroupViews(data: RoomQuizAnswers): GroupQuestionView[] {
  return byOrder(data.questions).map(classifyGroupQuestion);
}

export function summarizeRoomAnswers(data: RoomQuizAnswers): RoomAnswersSummary {
  if (isOneOnOneAnswers(data)) {
    const views = toOneOnOneViews(data);
    const same = views.filter((v) => v.same).length;
    return { kind: "ONE_ON_ONE", same, different: views.length - same };
  }

  const views = toGroupViews(data);
  const count = (agreement: GroupAgreement) =>
    views.filter((v) => v.agreement === agreement).length;
  return {
    kind: "GROUP",
    allSame: count("ALL_SAME"),
    split: count("SPLIT"),
    other: count("OTHER"),
  };
}
