import { afterEach, describe, expect, it } from "vitest";

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

  it.each([null, undefined, "", "not-a-date", "2026-11-22T20:00:00+09:00", "2026-11-22 20:00:00"])(
    "금·토가 아니거나 모르면 null (%s)",
    (value) => {
      expect(toSecretRoundDay(value)).toBeNull();
    },
  );

  describe("서버 형식(yyyy-MM-dd HH:mm:ss, 시간대 표기 없는 KST)", () => {
    const originalTz = process.env.TZ;
    afterEach(() => {
      process.env.TZ = originalTz;
    });

    it.each([
      ["2026-11-20 20:00:00", "금요일"],
      ["2026-11-21 20:00:00", "토요일"],
    ])("%s → %s", (nextRoundAt, expected) => {
      expect(toSecretRoundDay(nextRoundAt)).toBe(expected);
    });

    it("해외 시간대 기기에서도 KST 날짜의 요일로 읽는다", () => {
      // 기기 시간대로 읽으면 KST 금 20:00 = 하와이 금 01:00 이지만, 시각을 옮겨 KST 로 되읽으면 토 01:00 이 된다.
      process.env.TZ = "Pacific/Honolulu";
      expect(toSecretRoundDay("2026-11-20 20:00:00")).toBe("금요일");
      process.env.TZ = "Asia/Tokyo";
      expect(toSecretRoundDay("2026-11-21 20:00:00")).toBe("토요일");
    });
  });
});

describe("isSecretMatchingCardState", () => {
  it.each(["ELIGIBLE", "WAITING", "AUTO_ENTERED", "ENDED"] as const)("%s 는 시크릿 카드가 그린다", (state) => {
    expect(isSecretMatchingCardState(state)).toBe(true);
  });

  it.each(["NONE", "SECRET_RESULT"] as const)("%s 는 기존 카드가 그린다", (state) => {
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
