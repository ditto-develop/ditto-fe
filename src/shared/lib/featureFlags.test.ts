import { describe, expect, it } from "vitest";

import {
  INITIAL_TAP_STATE,
  SECRET_TAP_COUNT,
  SECRET_TAP_GAP_MS,
  isStageVisible,
  nextTapState,
} from "@/shared/lib/featureFlags";

describe("isStageVisible", () => {
  it("공개(all) 기능은 테스터 모드와 상관없이 보인다", () => {
    expect(isStageVisible("all", false)).toBe(true);
    expect(isStageVisible("all", true)).toBe(true);
  });

  it("공개 전(tester) 기능은 테스터 모드에서만 보인다", () => {
    expect(isStageVisible("tester", false)).toBe(false);
    expect(isStageVisible("tester", true)).toBe(true);
  });
});

describe("nextTapState", () => {
  it("간격 안에서 연달아 누르면 센다", () => {
    let state = INITIAL_TAP_STATE;
    for (let index = 0; index < SECRET_TAP_COUNT; index += 1) {
      state = nextTapState(state, 10_000 + index * 200);
    }
    expect(state.count).toBe(SECRET_TAP_COUNT);
  });

  it("같은 시각에 누른 것도 연달아 누른 것으로 센다(Cypress 가 Date 를 멈춘 경우)", () => {
    const state = nextTapState(nextTapState(INITIAL_TAP_STATE, 5_000), 5_000);
    expect(state.count).toBe(2);
  });

  it("간격을 넘기면 1부터 다시 센다", () => {
    const first = nextTapState(nextTapState(INITIAL_TAP_STATE, 1_000), 1_200);
    expect(first.count).toBe(2);
    expect(nextTapState(first, 1_200 + SECRET_TAP_GAP_MS + 1).count).toBe(1);
  });
});
