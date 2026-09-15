import { describe, expect, it } from "vitest";

import { isCurrentWeek } from "@/features/matching/api/matchingApi";

/**
 * 예전 홈은 "퀴즈셋 ID가 큰 쪽이 이번 주"로 추측했다. 한쪽 트랙이 404 면 견줄 대상이 없어
 * 지난 주 카드가 이번 주 결과로 그려졌다. BE PR #176 이 후보 응답에 `weekStartedOn` 을
 * 실어 주면서 추측이 한 줄 비교로 바뀌었다.
 */
describe("isCurrentWeek", () => {
  it("같은 주면 true", () => {
    expect(isCurrentWeek("2026-06-01", "2026-06-01")).toBe(true);
  });

  it("지난 주 후보는 false — 캐시된 응답이 이번 주 카드로 그려지지 않는다", () => {
    expect(isCurrentWeek("2026-05-25", "2026-06-01")).toBe(false);
  });

  it("후보 응답이 주차를 안 실어 주면(옛 서버) true — 모른다고 카드를 감추지 않는다", () => {
    expect(isCurrentWeek(null, "2026-06-01")).toBe(true);
    expect(isCurrentWeek(undefined, "2026-06-01")).toBe(true);
  });

  it("system/state 가 주차를 모르면 true — 기준이 없으면 막지 않고 서버 검사(5008)에 맡긴다", () => {
    expect(isCurrentWeek("2026-05-25", null)).toBe(true);
    expect(isCurrentWeek("2026-05-25", undefined)).toBe(true);
  });
});
