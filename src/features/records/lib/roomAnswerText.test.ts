import { describe, expect, it } from "vitest";

import {
  avatarLabel,
  formatAnswersSummary,
  objectParticle,
  peopleHonorific,
  toQuizChips,
  topicParticle,
  unanimousChoice,
} from "@/features/records/lib/roomAnswerText";

describe("조사", () => {
  it("받침 유무로 을/를·은/는을 고른다", () => {
    expect(objectParticle("새벽 2시")).toBe("를");
    expect(objectParticle("열린 결말")).toBe("을");
    expect(topicParticle("새벽 2시")).toBe("는");
    expect(topicParticle("맨 앞줄")).toBe("은");
  });

  it("숫자는 읽는 소리로 판정한다", () => {
    expect(objectParticle("오후 3")).toBe("을");
    expect(objectParticle("2")).toBe("를");
  });

  it("영문·빈 문자열은 받침 없음으로 본다", () => {
    expect(objectParticle("Cafe")).toBe("를");
    expect(objectParticle("")).toBe("를");
  });
});

describe("이름·인원", () => {
  it("원 안 이름은 앞 두 글자, 나는 '나'", () => {
    expect(avatarLabel({ memberId: 2, nickname: "사부작사부작", isMe: false })).toBe("사부");
    expect(avatarLabel({ memberId: 1, nickname: "홍길동", isMe: true })).toBe("나");
  });

  it("두 분·네 분", () => {
    expect(peopleHonorific(2)).toBe("두 분");
    expect(peopleHonorific(4)).toBe("네 분");
    expect(peopleHonorific(12)).toBe("12 분");
  });

  it("요약 문구", () => {
    expect(formatAnswersSummary({ kind: "ONE_ON_ONE", same: 7, different: 5 })).toBe(
      "같은 답 7 · 다른 답 5",
    );
    expect(formatAnswersSummary({ kind: "GROUP", allSame: 4, split: 2, other: 6 })).toBe(
      "다 같은 답 4 · 반반 2",
    );
  });
});

describe("문항 카드 칩", () => {
  const nameOf = (id: number) => (id === 2 ? "사부작사부작" : `회원${id}`);

  it("1:1 은 나를 먼저, 이름 · 선택지로 그린다", () => {
    const chips = toQuizChips(
      [
        { choiceId: 10, content: "하늘빛", memberCount: 1, memberIds: [2] },
        { choiceId: 11, content: "노을빛", memberCount: 1, memberIds: [1] },
      ],
      { myUserId: 1, nameOf },
    );
    expect(chips).toEqual([
      { key: "11-1", label: "나 · 노을빛", tone: "mine" },
      { key: "10-2", label: "사부작사부작 · 하늘빛", tone: "other" },
    ]);
  });

  it("그룹은 선택지 · 인원, 내 선택지를 알 때만 나머지를 어둡게", () => {
    const choices = [
      { choiceId: 10, content: "열린 결말", memberCount: 2, memberIds: null },
      { choiceId: 11, content: "닫힌 결말", memberCount: 2, memberIds: null },
      { choiceId: 12, content: "모름", memberCount: 0, memberIds: null },
    ];
    expect(toQuizChips(choices, { myUserId: 1, nameOf }).map((c) => c.tone)).toEqual([
      "mine",
      "mine",
    ]);
    expect(
      toQuizChips(choices, { myUserId: 1, nameOf, myChoiceId: 11 }).map((c) => [c.label, c.tone]),
    ).toEqual([
      ["열린 결말 2명", "other"],
      ["닫힌 결말 2명", "mine"],
    ]);
  });

  it("모두 같은 답이면 그 선택지를 돌려준다", () => {
    expect(
      unanimousChoice([
        { choiceId: 10, content: "끝까지 본다", memberCount: 4, memberIds: null },
        { choiceId: 11, content: "바로 나간다", memberCount: 0, memberIds: null },
      ])?.content,
    ).toBe("끝까지 본다");
    expect(
      unanimousChoice([
        { choiceId: 10, content: "a", memberCount: 3, memberIds: null },
        { choiceId: 11, content: "b", memberCount: 1, memberIds: null },
      ]),
    ).toBeNull();
  });
});
