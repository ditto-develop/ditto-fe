import { describe, expect, it } from "vitest";

import {
  avatarLabel,
  DEFAULT_HINT_QUESTION,
  describeHint,
  formatSendOpensAt,
  groupChips,
  objectParticle,
  pairCardChips,
  pairChips,
  topicParticle,
  unanimousGroupChoice,
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

describe("이름", () => {
  it("원 안 이름은 앞 두 글자, 나는 '나'", () => {
    expect(avatarLabel({ memberId: 2, nickname: "사부작사부작", isMe: false })).toBe("사부");
    expect(avatarLabel({ memberId: 1, nickname: "홍길동", isMe: true })).toBe("나");
  });
});

describe("첫 대화 힌트 문장", () => {
  const base = { quizId: 1, question: "시간이 멈춘다면 그 시각은?", hintQuestion: "그 시간엔 주로 뭘 하세요?" };

  it("같은 답·만장일치는 함께 고른 답을 굵게 넣는다", () => {
    expect(describeHint({ ...base, kind: "SAME", answer: "새벽 2시" })).toEqual({
      lead: "두 분 모두 ",
      answer: "새벽 2시",
      tail: "를 골랐어요.",
      follow: "그 시간엔 주로 뭘 하세요?",
    });
    expect(describeHint({ ...base, kind: "UNANIMOUS", answer: "열린 결말" })).toMatchObject({
      lead: "다 같이 ",
      answer: "열린 결말",
      tail: "을 골랐어요.",
    });
  });

  it("갈린 답·반반은 답 없이, 힌트 질문이 없으면 공통 문구", () => {
    expect(describeHint({ ...base, kind: "DIFFERENT", answer: null, hintQuestion: null })).toEqual({
      lead: "두 분의 답이 갈렸어요.",
      answer: null,
      tail: "",
      follow: DEFAULT_HINT_QUESTION,
    });
    expect(describeHint({ ...base, kind: "SPLIT", answer: null }).lead).toBe("의견이 반반 갈렸어요.");
  });
});

describe("질문 카드 칩", () => {
  const choices = [
    { choiceId: 1, content: "하늘빛" },
    { choiceId: 2, content: "노을빛" },
  ];

  it("1:1 은 나를 먼저, 같은 답이면 '둘 다' 하나", () => {
    expect(pairChips({ choices, myChoiceId: 2, peerChoiceId: 1 }, "사부작")).toEqual([
      { key: "me-2", label: "나 · 노을빛", tone: "mine" },
      { key: "peer-1", label: "사부작 · 하늘빛", tone: "other" },
    ]);
    expect(pairChips({ choices, myChoiceId: 2, peerChoiceId: 2 }, "사부작")).toEqual([
      { key: "both-2", label: "둘 다 노을빛", tone: "mine" },
    ]);
  });

  it("1:1 카드는 보낸 사람 기준이라 받은 쪽은 두 선택을 맞바꾼다", () => {
    const card = { quizId: 1, question: "Q", choices, senderChoiceId: 1, peerChoiceId: 2, hintQuestion: null };
    expect(pairCardChips(card, true, "상대").map((chip) => chip.label)).toEqual([
      "나 · 하늘빛",
      "상대 · 노을빛",
    ]);
    expect(pairCardChips(card, false, "상대").map((chip) => chip.label)).toEqual([
      "나 · 노을빛",
      "상대 · 하늘빛",
    ]);
  });

  it("그룹은 선택지 · 인원, 내 선택지를 알 때만 나머지를 어둡게", () => {
    const counted = [
      { choiceId: 5, content: "열린 결말", count: 2 },
      { choiceId: 6, content: "닫힌 결말", count: 2 },
      { choiceId: 7, content: "안 봄", count: 0 },
    ];
    expect(groupChips(counted).map((chip) => [chip.label, chip.tone])).toEqual([
      ["열린 결말 2명", "mine"],
      ["닫힌 결말 2명", "mine"],
    ]);
    expect(groupChips(counted, 6).map((chip) => chip.tone)).toEqual(["other", "mine"]);
  });

  it("모두 같은 답이면 그 선택지와 인원", () => {
    expect(
      unanimousGroupChoice([
        { choiceId: 5, content: "끝까지 본다", count: 4 },
        { choiceId: 6, content: "중간에 끈다", count: 0 },
      ]),
    ).toEqual({ content: "끝까지 본다", count: 4 });
    expect(
      unanimousGroupChoice([
        { choiceId: 5, content: "a", count: 2 },
        { choiceId: 6, content: "b", count: 1 },
      ]),
    ).toBeNull();
  });
});

describe("보내기 버튼 개방 시각", () => {
  it("이번 주면 요일만, 그 뒤 주면 날짜까지", () => {
    const thursday = new Date("2026-11-05T13:00:00");
    expect(formatSendOpensAt("2026-11-06 00:00:00", thursday)).toBe("금요일 0시부터 보낼 수 있어요");
    expect(formatSendOpensAt("2026-11-13 00:00:00", thursday)).toBe(
      "11월 13일(금) 0시부터 보낼 수 있어요",
    );
    expect(formatSendOpensAt("", thursday)).toBe("채팅이 열리면 보낼 수 있어요");
  });
});
