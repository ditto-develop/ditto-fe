import { describe, expect, it } from "vitest";

import { jitteredDelay } from "@/features/chat/lib/chatSocket";

describe("jitteredDelay", () => {
  it("stays within [0, exponential] for the given random draw", () => {
    // full jitter: 같은 시도라도 0 ~ 지수 상한 사이에서 고르게 흩어져야
    // 단일 인스턴스 서버로 재접속이 몰리지 않는다.
    expect(jitteredDelay(0, 0)).toBe(0);
    expect(jitteredDelay(0, 1)).toBe(2000);
    expect(jitteredDelay(1, 1)).toBe(4000);
    expect(jitteredDelay(2, 1)).toBe(8000);
  });

  it("grows exponentially but is capped at 30s", () => {
    expect(jitteredDelay(10, 1)).toBe(30000);
    expect(jitteredDelay(50, 1)).toBe(30000);
  });

  it("scales the cap by the random draw as well", () => {
    expect(jitteredDelay(10, 0.5)).toBe(15000);
  });
});
