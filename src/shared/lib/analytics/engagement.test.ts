import { describe, expect, it } from "vitest";

import { createEngagementTracker } from "@/shared/lib/analytics/engagement";

/**
 * 체류 시간 누적.
 *
 * 핵심은 **가려진 동안은 세지 않는다**는 것이다. 이걸 안 지키면 앱을 켜 둔 채
 * 방치한 시간이 전부 체류로 잡혀 "이 화면에 오래 머문다"가 "이 화면을 켜 놓고
 * 딴짓한다"와 구분되지 않는다.
 */

/** 테스트용 가짜 시계. 실제 시간을 기다리지 않고 구간을 만든다. */
function fakeClock(start = 1_000) {
  let current = start;
  return {
    now: () => current,
    advance(ms: number) {
      current += ms;
    },
  };
}

describe("createEngagementTracker", () => {
  it("보이는 동안만 engagedMs 를 누적하고 durationMs 는 벽시계 그대로다", () => {
    const clock = fakeClock();
    const tracker = createEngagementTracker(clock.now);

    clock.advance(1_000);
    tracker.pause();
    clock.advance(10_000); // 백그라운드 10초 — 여기는 세지 않는다
    tracker.resume();
    clock.advance(2_000);

    expect(tracker.snapshot()).toEqual({ durationMs: 13_000, engagedMs: 3_000 });
  });

  it("생성 시점에 이미 가려져 있으면 그 구간을 세지 않는다", () => {
    // 백그라운드에서 복귀하며 화면이 바뀌는 경우가 있어 기본값(true)에 기댈 수 없다.
    const clock = fakeClock();
    const tracker = createEngagementTracker(clock.now, false);

    clock.advance(5_000);

    expect(tracker.snapshot()).toEqual({ durationMs: 5_000, engagedMs: 0 });
  });

  it("pause 와 resume 은 멱등이다", () => {
    // visibilitychange 와 Capacitor appStateChange 가 같은 전환에 둘 다 올 수 있다.
    // 중복 호출이 시간을 두 배로 세면 지표가 조용히 부풀어 오른다.
    const clock = fakeClock();
    const tracker = createEngagementTracker(clock.now);

    clock.advance(1_000);
    tracker.pause();
    tracker.pause();
    clock.advance(1_000);
    tracker.resume();
    tracker.resume();
    clock.advance(1_000);

    expect(tracker.snapshot()).toEqual({ durationMs: 3_000, engagedMs: 2_000 });
  });

  it("snapshot 은 여러 번 불러도 상태를 바꾸지 않는다", () => {
    const clock = fakeClock();
    const tracker = createEngagementTracker(clock.now);

    clock.advance(1_000);

    expect(tracker.snapshot()).toEqual(tracker.snapshot());
  });

  it("engagedMs 는 절대 durationMs 를 넘지 않는다", () => {
    const clock = fakeClock();
    const tracker = createEngagementTracker(clock.now);

    clock.advance(7_000);
    const { durationMs, engagedMs } = tracker.snapshot();

    expect(engagedMs).toBeLessThanOrEqual(durationMs);
  });
});
