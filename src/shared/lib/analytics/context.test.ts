import { describe, expect, it } from "vitest";

import { buildAnalyticsContext, toWeekKey } from "@/shared/lib/analytics/context";

/**
 * 기간·주차 컨텍스트.
 *
 * 이 두 축이 없으면 "퀴즈 기간의 퍼널"과 "매칭 기간의 퍼널"을 나눠 볼 수 없다.
 * 기간은 반드시 **서버 판정**이어야 한다 — 기기 요일로 파생하면 어드민
 * '시간 임시 조정'이 걸린 주에 지표가 통째로 어긋난다.
 */

describe("toWeekKey", () => {
  it("월을 0 으로 채워 문자열 정렬이 곧 시간 순서가 되게 한다", () => {
    expect(toWeekKey({ year: 2026, month: 9, week: 2 })).toBe("2026-09-W2");
  });

  it("한 자리 월이 두 자리 월보다 앞에 정렬된다", () => {
    // 패딩이 없으면 "2026-10" 이 "2026-9" 보다 앞에 와서 리포트 축이 뒤집힌다.
    const keys = [
      toWeekKey({ year: 2026, month: 10, week: 1 }),
      toWeekKey({ year: 2026, month: 9, week: 1 }),
    ].sort();

    expect(keys).toEqual(["2026-09-W1", "2026-10-W1"]);
  });
});

describe("buildAnalyticsContext", () => {
  it("서버 상태를 기간과 주차 키로 옮긴다", () => {
    expect(
      buildAnalyticsContext({ year: 2026, month: 9, week: 2, period: "MATCHING_PERIOD" }),
    ).toEqual({ period: "MATCHING_PERIOD", week_key: "2026-09-W2" });
  });

  it("상태를 못 읽었으면 빈 컨텍스트다 — 값을 지어내지 않는다", () => {
    expect(buildAnalyticsContext(null)).toEqual({});
  });

  it("모르는 기간 값은 버리고 주차만 남긴다", () => {
    // 서버가 새 기간을 추가했는데 FE 가 모르면, 그대로 흘려보내는 순간
    // 리포트에 정체불명의 축이 생긴다.
    expect(
      buildAnalyticsContext({ year: 2026, month: 9, week: 2, period: "REST_PERIOD" }),
    ).toEqual({ week_key: "2026-09-W2" });
  });
});
