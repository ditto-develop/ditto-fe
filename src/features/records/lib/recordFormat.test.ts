import { describe, expect, it } from "vitest";

import {
  formatCountdown,
  formatRecordMeta,
  formatRevealMoment,
  formatSubmittedAt,
  formatWeekOf,
  matchingTypeLabel,
  pastRecordLabel,
} from "@/features/records/lib/recordFormat";

const record = { week: 4, matchingType: "ONE_TO_ONE" as const, weekStartedOn: "2026-10-26" };

describe("recordFormat", () => {
  it("매칭 타입 라벨", () => {
    expect(matchingTypeLabel("ONE_TO_ONE")).toBe("1:1");
    expect(matchingTypeLabel("GROUP")).toBe("그룹");
  });

  it("주 시작일 → 'N월 N일 주'", () => {
    expect(formatWeekOf("2026-10-26")).toBe("10월 26일 주");
    expect(formatWeekOf("")).toBe("");
  });

  it("메타 줄 — 카드·상세·결과", () => {
    expect(formatRecordMeta(record, { withWeek: true })).toBe("4주차 · 1:1 · 10월 26일 주");
    expect(formatRecordMeta(record)).toBe("1:1 · 10월 26일 주");
    expect(formatRecordMeta({ ...record, matchingType: "GROUP" }, { participantCount: 1312 })).toBe(
      "그룹 · 10월 26일 주 · 1,312명 참여",
    );
  });

  it("제출 시각", () => {
    expect(formatSubmittedAt("2026-10-27 21:14:00")).toBe("10월 27일 21:14 제출");
    expect(formatSubmittedAt("2026-10-27T08:05:00")).toBe("10월 27일 08:05 제출");
    expect(formatSubmittedAt(null)).toBeNull();
  });

  it("통계 공개 시점", () => {
    expect(formatRevealMoment("2026-10-29 00:00:00")).toBe("목요일 0시");
    expect(formatRevealMoment("2026-10-29 09:30:00")).toBe("목요일 9시 30분");
    expect(formatRevealMoment("")).toBeNull();
  });

  it("카운트다운", () => {
    expect(formatCountdown((10 * 3600 + 49 * 60 + 25) * 1000)).toBe("10:49:25");
    expect(formatCountdown((34 * 3600 + 5) * 1000)).toBe("1일 10:00:05");
    expect(formatCountdown(-1000)).toBe("00:00:00");
  });

  it("지난 퀴즈 아랫줄", () => {
    expect(pastRecordLabel({ revealed: true, minorityCount: 2 })).toEqual({
      text: "결과 보기 · 소수 의견 2개",
      tone: "positive",
    });
    expect(pastRecordLabel({ revealed: true, minorityCount: 0 })).toEqual({
      text: "결과 보기",
      tone: "positive",
    });
    expect(pastRecordLabel({ revealed: false, minorityCount: null }).tone).toBe("neutral");
  });
});
