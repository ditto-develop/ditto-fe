import { describe, expect, it, vi } from "vitest";

const externalApiFetch = vi.fn();

vi.mock("@/shared/lib/api/externalClient", () => ({
  externalApiFetch: (path: string, options: unknown) => externalApiFetch(path, options),
}));

import { loginWithExternalKakaoNative } from "@/shared/lib/api/externalApi";

/**
 * 이 요청의 계약은 두 번 어긋난 적이 있다. 회귀하면 앱 로그인이 통째로 죽으므로 못박아 둔다.
 *
 * 1. 필드명: 리포의 요청서(docs/be-request-app-push-auth.md §D)는 `kakaoAccessToken` 으로
 *    요청했지만 BE 는 `accessToken` 으로 구현했다. 라이브 스펙이 정본이다.
 * 2. credentials: 'include' 가 없으면 refreshToken 쿠키가 저장되지 않아
 *    며칠 뒤 원인 모를 로그아웃이 난다. externalApiFetch 의 기본값이 아니다.
 */
describe("loginWithExternalKakaoNative", () => {
  it("바디 필드명은 kakaoAccessToken 이 아니라 accessToken 이다", async () => {
    externalApiFetch.mockResolvedValue({ signupRequired: false, sanctioned: false });

    await loginWithExternalKakaoNative("카카오-토큰");

    const [path, options] = externalApiFetch.mock.calls[0];
    expect(path).toBe("/api/v1/users/social-login/kakao/native");
    expect(options).toMatchObject({
      method: "POST",
      body: { accessToken: "카카오-토큰" },
    });
    expect(options.body).not.toHaveProperty("kakaoAccessToken");
  });

  it("refreshToken 쿠키를 받으려면 credentials: 'include' 여야 한다", async () => {
    externalApiFetch.mockResolvedValue({ signupRequired: false, sanctioned: false });

    await loginWithExternalKakaoNative("카카오-토큰");

    expect(externalApiFetch.mock.calls[0][1]).toMatchObject({ credentials: "include" });
  });
});
