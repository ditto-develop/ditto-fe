import { beforeEach, describe, expect, it, vi } from "vitest";

const externalApiFetch = vi.fn();

beforeEach(() => {
  externalApiFetch.mockReset();
});

vi.mock("@/shared/lib/api/externalClient", () => ({
  externalApiFetch: (path: string, options: unknown) => externalApiFetch(path, options),
}));

import { loginWithExternalReviewAccount } from "@/shared/lib/api/externalApi";

/**
 * App Store 심사용 데모 로그인. 심사 중에 이 요청이 어긋나면 리뷰어가 로그인하지 못해
 * 리젝되므로 계약을 못박아 둔다(BE ADR 0041).
 */
describe("loginWithExternalReviewAccount", () => {
  it("loginId·password 를 review-login 으로 보낸다", async () => {
    externalApiFetch.mockResolvedValue({ signupRequired: false, sanctioned: false });

    await loginWithExternalReviewAccount({ loginId: "appreview", password: "비밀번호" });

    const [path, options] = externalApiFetch.mock.calls[0];
    expect(path).toBe("/api/v1/users/review-login");
    expect(options).toMatchObject({
      method: "POST",
      body: { loginId: "appreview", password: "비밀번호" },
    });
  });

  it("refreshToken 쿠키를 받으려면 credentials: 'include' 여야 한다", async () => {
    externalApiFetch.mockResolvedValue({ signupRequired: false, sanctioned: false });

    await loginWithExternalReviewAccount({ loginId: "appreview", password: "비밀번호" });

    expect(externalApiFetch.mock.calls[0][1]).toMatchObject({ credentials: "include" });
  });
});
