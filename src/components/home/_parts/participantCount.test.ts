import { describe, expect, it } from "vitest";

import { formatParticipantCount } from "@/components/home/_parts/participantCount";

describe("formatParticipantCount", () => {
  it("100명 이하는 모두 50명+로 보인다", () => {
    expect(formatParticipantCount(0)).toBe("50명+");
    expect(formatParticipantCount(12)).toBe("50명+");
    expect(formatParticipantCount(100)).toBe("50명+");
  });

  it("1,000명까지는 50명 단위이고 경계는 아래 구간에 넣는다", () => {
    expect(formatParticipantCount(101)).toBe("100명+");
    expect(formatParticipantCount(150)).toBe("100명+");
    expect(formatParticipantCount(151)).toBe("150명+");
    expect(formatParticipantCount(200)).toBe("150명+");
    expect(formatParticipantCount(1000)).toBe("950명+");
  });

  it("1,000명을 넘으면 100명 단위로 보인다", () => {
    expect(formatParticipantCount(1001)).toBe("1,000명+");
    expect(formatParticipantCount(1100)).toBe("1,000명+");
    expect(formatParticipantCount(1101)).toBe("1,100명+");
  });
});
