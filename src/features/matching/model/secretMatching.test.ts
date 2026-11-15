import { describe, expect, it } from "vitest";

import {
  isSecretCandidate,
  isSecretMatchingCardState,
  toSecretRoundDay,
} from "@/features/matching/model/secretMatching";

describe("toSecretRoundDay", () => {
  it.each([
    ["2026-11-20T20:00:00+09:00", "금요일"],
    ["2026-11-21T20:00:00+09:00", "토요일"],
    // 서버가 공백 구분자로 줘도 읽는다(serverDateTime). 오프셋이 없으면 기기 시간대로 읽히므로 UTC 로 고정해 본다.
    ["2026-11-21T11:00:00Z", "토요일"],
  ])("%s → %s", (nextRoundAt, expected) => {
    expect(toSecretRoundDay(nextRoundAt)).toBe(expected);
  });

  it("KST 요일로 읽는다 — UTC 로는 목요일이어도 KST 금요일이면 금요일", () => {
    // 2026-11-19T20:00Z = KST 11-20(금) 05:00
    expect(toSecretRoundDay("2026-11-19T20:00:00Z")).toBe("금요일");
  });

  it.each([null, undefined, "", "not-a-date", "2026-11-22T20:00:00+09:00"])("금·토가 아니거나 모르면 null (%s)", (value) => {
    expect(toSecretRoundDay(value)).toBeNull();
  });
});

describe("isSecretMatchingCardState", () => {
  it.each(["TARGET", "WAITING", "AUTO_JOINED", "CLOSED"] as const)("%s 는 시크릿 카드가 그린다", (state) => {
    expect(isSecretMatchingCardState(state)).toBe(true);
  });

  it.each(["NONE", "CANDIDATES", "MATCHED"] as const)("%s 는 기존 카드가 그린다", (state) => {
    expect(isSecretMatchingCardState(state)).toBe(false);
  });
});

describe("isSecretCandidate", () => {
  it("시크릿 라운드 출처만 true", () => {
    expect(isSecretCandidate({ candidateOrigin: "SECRET_FIRST" })).toBe(true);
    expect(isSecretCandidate({ candidateOrigin: "SECRET_SECOND" })).toBe(true);
    expect(isSecretCandidate({ candidateOrigin: "REGULAR" })).toBe(false);
    expect(isSecretCandidate({})).toBe(false);
  });
});

describe("buildLateQuizPath", () => {
  it("1:1 종류와 셋 id 를 싣는다", async () => {
    const { buildLateQuizPath } = await import("@/features/matching/model/secretMatching");
    expect(buildLateQuizPath("42")).toBe("/quiz/current?type=ONE_TO_ONE&quizSetId=42");
  });
});
