import type {
  QuizCompareItem,
  QuizCompareResponse,
  QuizDistributionItem,
  QuizDistributionResponse,
  RoomQuizMember,
} from "@/features/records/model/types";

/*
 * 대화방 "우리의 답변" 묶음. 같은 답·만장일치·반반 판정은 서버가 해서 내려준다(IMP-1 BE-3·BE-6) —
 * FE 는 서버 값으로 나누기만 한다.
 */

/** 머리 카드 원에 그릴 멤버 — 나를 맨 앞에. 서버 답변 API 에 멤버가 없어 방 멤버 API 로 만든다. */
export function toRoomQuizMembers(
  myUserId: number | null,
  counterparts: Array<{ userId: number; nickname: string }>,
): RoomQuizMember[] {
  const me: RoomQuizMember[] =
    myUserId === null ? [] : [{ memberId: myUserId, nickname: "나", isMe: true }];
  return [
    ...me,
    ...counterparts
      .filter((member) => member.userId !== myUserId)
      .map((member) => ({ memberId: member.userId, nickname: member.nickname, isMe: false })),
  ];
}

function byOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export type PairAnswerGroups = {
  same: QuizCompareItem[];
  different: QuizCompareItem[];
};

export function groupPairAnswers(data: QuizCompareResponse): PairAnswerGroups {
  const ordered = byOrder(data.items);
  return {
    same: ordered.filter((item) => item.same),
    different: ordered.filter((item) => !item.same),
  };
}

export type GroupAnswerGroups = {
  /** "반반 갈린 질문" — 서버 `splitQuizIds` 순서(인원 차가 작은 순, 최대 3개). */
  split: QuizDistributionItem[];
  /** "다 같이 고른 답" */
  unanimous: QuizDistributionItem[];
  /** "나머지 질문" */
  other: QuizDistributionItem[];
};

export function groupGroupAnswers(data: QuizDistributionResponse): GroupAnswerGroups {
  const byId = new Map(data.items.map((item) => [item.quizId, item]));
  const splitIds = new Set(data.splitQuizIds);
  const split = data.splitQuizIds
    .map((quizId) => byId.get(quizId))
    .filter((item): item is QuizDistributionItem => item !== undefined);
  const ordered = byOrder(data.items);
  return {
    split,
    unanimous: ordered.filter((item) => item.unanimous && !splitIds.has(item.quizId)),
    other: ordered.filter((item) => !item.unanimous && !splitIds.has(item.quizId)),
  };
}

/** 요약 바 — 1:1 "같은 답 7 · 다른 답 5"(Figma 3256:51203). 숫자는 서버 값 그대로. */
export function formatPairSummary(data: Pick<QuizCompareResponse, "sameCount" | "diffCount">): string {
  return `같은 답 ${data.sameCount} · 다른 답 ${data.diffCount}`;
}

/**
 * 요약 바 — 그룹 "다 같은 답 4 · 반반 8"(Figma 3270:34677). 서버 정의로 "반반" = 만장일치가 아닌 문항
 * 수(`splitCount`)라 상세의 "반반 갈린 질문"(최대 3개)과 숫자가 다르다(IMP-1 §0-7).
 */
export function formatGroupSummary(
  data: Pick<QuizDistributionResponse, "unanimousCount" | "splitCount">,
): string {
  return `다 같은 답 ${data.unanimousCount} · 반반 ${data.splitCount}`;
}
