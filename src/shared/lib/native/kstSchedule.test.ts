import { describe, expect, it } from "vitest";

import { KST_WEEKDAY, nextKstWeekly, upcomingKstWeekly } from "@/shared/lib/native/kstSchedule";

/**
 * 이 계산이 틀리면 알림이 **엉뚱한 시각에 울린다** — 사용자가 가장 빠르게 앱을 지우는 종류의
 * 버그다. 특히 KST가 아닌 기기에서 깨지기 쉬워, 개발 중에는 드러나지 않는다.
 * 그래서 여기서는 전부 UTC ISO 문자열로 단언한다(테스트 실행 타임존과 무관하게 고정된다).
 */

/** KST 목요일 09:00 = UTC 목요일 00:00 */
describe("nextKstWeekly", () => {
  it("다음 목요일 09:00 KST를 절대 시각으로 돌려준다", () => {
    // 2026-08-26 수요일 12:00 KST = 2026-08-26T03:00:00Z
    const from = new Date("2026-08-26T03:00:00Z");
    const target = nextKstWeekly(KST_WEEKDAY.THURSDAY, 9, from);
    // 다음날 목요일 09:00 KST = 2026-08-27T00:00:00Z
    expect(target.toISOString()).toBe("2026-08-27T00:00:00.000Z");
  });

  it("같은 요일이라도 시각이 지났으면 다음 주로 넘긴다", () => {
    // 2026-08-27 목요일 10:00 KST = 2026-08-27T01:00:00Z (09:00 지남)
    const from = new Date("2026-08-27T01:00:00Z");
    const target = nextKstWeekly(KST_WEEKDAY.THURSDAY, 9, from);
    expect(target.toISOString()).toBe("2026-09-03T00:00:00.000Z");
  });

  it("같은 요일이고 시각이 아직 안 지났으면 그날로 잡는다", () => {
    // 2026-08-27 목요일 08:00 KST = 2026-08-26T23:00:00Z
    const from = new Date("2026-08-26T23:00:00Z");
    const target = nextKstWeekly(KST_WEEKDAY.THURSDAY, 9, from);
    expect(target.toISOString()).toBe("2026-08-27T00:00:00.000Z");
  });

  it("일요일 20:00 KST — 채팅 마감(23:59) 전 마지막 알림", () => {
    const from = new Date("2026-08-26T03:00:00Z"); // 수요일
    const target = nextKstWeekly(KST_WEEKDAY.SUNDAY, 20, from);
    // 2026-08-30 일요일 20:00 KST = 2026-08-30T11:00:00Z
    expect(target.toISOString()).toBe("2026-08-30T11:00:00.000Z");
  });

  it("KST 자정 직전에도 날짜 경계를 정확히 넘는다", () => {
    // 2026-08-26 수요일 23:30 KST = 2026-08-26T14:30:00Z
    const from = new Date("2026-08-26T14:30:00Z");
    const target = nextKstWeekly(KST_WEEKDAY.THURSDAY, 9, from);
    expect(target.toISOString()).toBe("2026-08-27T00:00:00.000Z");
  });

  it("월 경계를 넘어가도 정확하다", () => {
    // 2026-08-31 월요일 12:00 KST = 2026-08-31T03:00:00Z
    const from = new Date("2026-08-31T03:00:00Z");
    const target = nextKstWeekly(KST_WEEKDAY.THURSDAY, 9, from);
    // 2026-09-03 목요일 09:00 KST
    expect(target.toISOString()).toBe("2026-09-03T00:00:00.000Z");
  });

  it("반환값은 항상 미래다", () => {
    const from = new Date("2026-08-26T03:00:00Z");
    for (let weekday = 0; weekday < 7; weekday++) {
      for (const hour of [0, 9, 20, 23]) {
        expect(nextKstWeekly(weekday, hour, from).getTime()).toBeGreaterThan(from.getTime());
      }
    }
  });
});

describe("upcomingKstWeekly", () => {
  it("정확히 7일 간격으로 count개를 만든다", () => {
    const from = new Date("2026-08-26T03:00:00Z");
    const dates = upcomingKstWeekly(KST_WEEKDAY.THURSDAY, 9, 4, from);

    expect(dates).toHaveLength(4);
    expect(dates.map((d) => d.toISOString())).toEqual([
      "2026-08-27T00:00:00.000Z",
      "2026-09-03T00:00:00.000Z",
      "2026-09-10T00:00:00.000Z",
      "2026-09-17T00:00:00.000Z",
    ]);
  });
});
