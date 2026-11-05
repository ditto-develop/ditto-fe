import { describe, expect, it } from "vitest";

import {
  formatGroupSummary,
  formatPairSummary,
  groupGroupAnswers,
  groupPairAnswers,
  toRoomQuizMembers,
} from "@/features/records/lib/roomAnswers";
import type {
  QuizCompareItem,
  QuizCompareResponse,
  QuizDistributionItem,
  QuizDistributionResponse,
} from "@/features/records/model/types";

function compareItem(order: number, same: boolean): QuizCompareItem {
  return {
    quizId: 100 + order,
    order,
    question: `Q${order}`,
    choices: [],
    myChoiceId: 1,
    peerChoiceId: same ? 1 : 2,
    same,
    minority: false,
    hintQuestion: null,
    sent: false,
  };
}

function distributionItem(order: number, unanimous: boolean): QuizDistributionItem {
  return {
    quizId: 200 + order,
    order,
    question: `Q${order}`,
    choices: [],
    myChoiceId: 5,
    unanimous,
    hintQuestion: null,
    sent: false,
  };
}

describe("toRoomQuizMembers", () => {
  it("나를 맨 앞에 두고 상대 목록에 섞인 나는 뺀다", () => {
    expect(
      toRoomQuizMembers(1, [
        { userId: 2, nickname: "사부작" },
        { userId: 1, nickname: "나인데" },
      ]),
    ).toEqual([
      { memberId: 1, nickname: "나", isMe: true },
      { memberId: 2, nickname: "사부작", isMe: false },
    ]);
  });
});

describe("groupPairAnswers", () => {
  it("서버 same 으로 나누고 문항 순서로 둔다", () => {
    const data = {
      items: [compareItem(3, false), compareItem(1, true), compareItem(2, false)],
    } as QuizCompareResponse;
    const groups = groupPairAnswers(data);
    expect(groups.same.map((item) => item.order)).toEqual([1]);
    expect(groups.different.map((item) => item.order)).toEqual([2, 3]);
  });
});

describe("groupGroupAnswers", () => {
  it("반반은 splitQuizIds 순서, 나머지는 만장일치/그 밖으로 문항 순서", () => {
    const data = {
      items: [1, 2, 3, 4, 5].map((order) => distributionItem(order, order <= 2)),
      splitQuizIds: [205, 203],
    } as QuizDistributionResponse;
    const groups = groupGroupAnswers(data);
    expect(groups.split.map((item) => item.order)).toEqual([5, 3]);
    expect(groups.unanimous.map((item) => item.order)).toEqual([1, 2]);
    expect(groups.other.map((item) => item.order)).toEqual([4]);
  });
});

describe("요약 바 문구", () => {
  it("숫자는 서버 값 그대로 — 그룹 반반은 만장일치가 아닌 문항 수", () => {
    expect(formatPairSummary({ sameCount: 7, diffCount: 5 })).toBe("같은 답 7 · 다른 답 5");
    expect(formatGroupSummary({ unanimousCount: 4, splitCount: 8 })).toBe("다 같은 답 4 · 반반 8");
  });
});
