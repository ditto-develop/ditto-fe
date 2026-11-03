import { describe, expect, it } from "vitest";

import {
  classifyGroupQuestion,
  isOneOnOneAnswers,
  summarizeRoomAnswers,
  toOneOnOneViews,
} from "@/features/records/lib/roomAnswers";
import type { RoomQuizAnswers, RoomQuizQuestion } from "@/features/records/model/types";

function question(
  order: number,
  counts: Array<{ memberCount: number; memberIds: number[] | null }>,
  myChoiceIndex = 0,
): RoomQuizQuestion {
  return {
    quizId: order,
    order,
    question: `Q${order}`,
    prompt: null,
    myChoiceId: order * 10 + myChoiceIndex,
    sharedAt: null,
    choices: counts.map((count, index) => ({
      choiceId: order * 10 + index,
      content: `선택지 ${index}`,
      order: index + 1,
      percent: null,
      ...count,
    })),
  };
}

const ME = { memberId: 1, nickname: "나", isMe: true };
const PARTNER = { memberId: 2, nickname: "사부작사부작", isMe: false };

describe("1:1 방", () => {
  const data: RoomQuizAnswers = {
    roomId: 1,
    quizSetId: 42,
    title: "시간이 멈춘다면",
    members: [ME, PARTNER],
    firstHint: null,
    // 순서를 섞어 둔다 — 화면은 order 순이다.
    questions: [
      question(2, [
        { memberCount: 1, memberIds: [1] },
        { memberCount: 1, memberIds: [2] },
      ]),
      question(1, [
        { memberCount: 2, memberIds: [1, 2] },
        { memberCount: 0, memberIds: [] },
      ]),
    ],
  };

  it("memberIds 가 있고 멤버가 둘이면 1:1 이다", () => {
    expect(isOneOnOneAnswers(data)).toBe(true);
  });

  it("상대가 고른 선택지를 찾아 같은 답/다른 답을 나눈다", () => {
    const views = toOneOnOneViews(data);
    expect(views.map((v) => v.question.order)).toEqual([1, 2]);
    expect(views[0]).toMatchObject({ same: true, mine: { choiceId: 10 }, partner: { choiceId: 10 } });
    expect(views[1]).toMatchObject({ same: false, mine: { choiceId: 20 }, partner: { choiceId: 21 } });
  });

  it("요약은 같은 답·다른 답 개수다", () => {
    expect(summarizeRoomAnswers(data)).toEqual({ kind: "ONE_ON_ONE", same: 1, different: 1 });
  });
});

describe("그룹 방", () => {
  const anonymous = (memberCount: number) => ({ memberCount, memberIds: null });

  it("한 선택지에 모두 몰리면 ALL_SAME", () => {
    expect(classifyGroupQuestion(question(1, [anonymous(4), anonymous(0)])).agreement).toBe(
      "ALL_SAME",
    );
  });

  it("두 선택지에 정확히 반씩이면 SPLIT", () => {
    expect(classifyGroupQuestion(question(1, [anonymous(2), anonymous(2)])).agreement).toBe(
      "SPLIT",
    );
  });

  it("3:1 이나 세 갈래는 OTHER", () => {
    expect(classifyGroupQuestion(question(1, [anonymous(3), anonymous(1)])).agreement).toBe("OTHER");
    expect(
      classifyGroupQuestion(question(1, [anonymous(2), anonymous(1), anonymous(1)])).agreement,
    ).toBe("OTHER");
  });

  it("memberIds 가 null 이면 둘만 남아도 그룹으로 요약한다", () => {
    const data: RoomQuizAnswers = {
      roomId: 3,
      quizSetId: 41,
      title: "가을 밤, 같이 볼 영화",
      members: [ME, PARTNER],
      firstHint: null,
      questions: [
        question(1, [anonymous(2), anonymous(0)]),
        question(2, [anonymous(1), anonymous(1)]),
      ],
    };
    expect(isOneOnOneAnswers(data)).toBe(false);
    expect(summarizeRoomAnswers(data)).toEqual({ kind: "GROUP", allSame: 1, split: 1, other: 0 });
  });
});
