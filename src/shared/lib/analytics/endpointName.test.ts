import { describe, expect, it } from "vitest";

import { normalizeEndpoint } from "@/shared/lib/analytics/endpointName";

/**
 * API 경로 정규화.
 *
 * 경로를 그대로 실으면 방 번호·회원 번호가 붙은 경로가 사람 수만큼 생겨
 * 리포트가 뭉개지고 식별자가 GA4 로 새어 나간다.
 */

describe("normalizeEndpoint", () => {
  it("숫자 세그먼트를 가린다", () => {
    expect(normalizeEndpoint("/api/v1/chat/rooms/8421/messages")).toBe(
      "/api/v1/chat/rooms/[id]/messages",
    );
  });

  it("UUID 세그먼트를 가린다", () => {
    expect(normalizeEndpoint("/api/v1/quiz-sets/2f1c9a3e-4b5d-6e7f-8a9b-0c1d2e3f4a5b")).toBe(
      "/api/v1/quiz-sets/[id]",
    );
  });

  it("쿼리스트링을 떼어 낸다", () => {
    // 쿼리에는 검색어처럼 무엇이 들어올지 모르는 값이 실린다.
    expect(normalizeEndpoint("/api/v1/users/me/profile?include=notes")).toBe(
      "/api/v1/users/me/profile",
    );
  });

  it("식별자가 아닌 경로는 그대로 둔다", () => {
    // 과하게 가리면 엔드포인트를 구분할 수 없게 된다.
    expect(normalizeEndpoint("/api/v1/system/state")).toBe("/api/v1/system/state");
    expect(normalizeEndpoint("/api/v1/users/me/profile")).toBe("/api/v1/users/me/profile");
  });

  it("버전 세그먼트(v1)를 식별자로 오인하지 않는다", () => {
    expect(normalizeEndpoint("/api/v1/matches")).toContain("/v1/");
  });
});
