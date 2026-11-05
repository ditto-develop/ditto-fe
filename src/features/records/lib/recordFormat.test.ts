import { describe, expect, it } from "vitest";

import {
  formatCountdown,
  formatRecordMeta,
  formatRevealMoment,
  formatWeekLabel,
  formatWeekOf,
  isWeekRevealed,
  matchingTypeLabel,
  pastRecordLabel,
  weekOfMonth,
} from "@/features/records/lib/recordFormat";

const record = { matchingType: "ONE_TO_ONE" as const, weekStartedOn: "2026-11-02" };

describe("recordFormat", () => {
  it("매칭 타입 라벨", () => {
    expect(matchingTypeLabel("ONE_TO_ONE")).toBe("1:1");
    expect(matchingTypeLabel("GROUP")).toBe("그룹");
  });

  it("주 시작일 → 'N월 N일 주'", () => {
    expect(formatWeekOf("2026-10-26")).toBe("10월 26일 주");
    expect(formatWeekOf("")).toBe("");
  });

  it("주차는 서버 OperationWeek(WeekFields MONDAY, 1)와 같다 — 1일이 든 월~일 주가 1주차", () => {
    // 2026-11-01 은 일요일이라 10/26~11/01 주가 11월 1주차, 11/02 주가 2주차다.
    expect(weekOfMonth("2026-11-02")).toBe(2);
    expect(weekOfMonth("2026-11-30")).toBe(6);
    // 2026-10-01 은 목요일 — 10/26 주는 5주차.
    expect(weekOfMonth("2026-10-26")).toBe(5);
    // 2026-06-01 은 월요일 — 그날이 1주차.
    expect(weekOfMonth("2026-06-01")).toBe(1);
    // 월 경계 주(7/27~8/2)는 시작일의 달(7월) 기준 5주차.
    expect(weekOfMonth("2026-07-27")).toBe(5);
    expect(weekOfMonth("")).toBeNull();
    expect(formatWeekLabel("2026-11-02")).toBe("2주차");
    expect(formatWeekLabel("bad")).toBe("");
  });

  it("메타 줄 — 카드·상세·결과", () => {
    expect(formatRecordMeta(record, { withWeek: true })).toBe("2주차 · 1:1 · 11월 2일 주");
    expect(formatRecordMeta(record)).toBe("1:1 · 11월 2일 주");
    expect(formatRecordMeta({ ...record, matchingType: "GROUP" }, { participantCount: 1312 })).toBe(
      "그룹 · 11월 2일 주 · 1,312명 참여",
    );
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

  it("공개 여부와 지난 퀴즈 아랫줄은 minorityCount(공개 전 null)로 가른다", () => {
    expect(isWeekRevealed({ minorityCount: 0 })).toBe(true);
    expect(isWeekRevealed({ minorityCount: null })).toBe(false);
    expect(pastRecordLabel({ minorityCount: 2 })).toEqual({
      text: "결과 보기 · 소수 의견 2개",
      tone: "positive",
    });
    expect(pastRecordLabel({ minorityCount: 0 })).toEqual({
      text: "결과 보기",
      tone: "positive",
    });
    expect(pastRecordLabel({ minorityCount: null }).tone).toBe("neutral");
  });
});
