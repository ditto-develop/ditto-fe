import { beforeEach, describe, expect, it, vi } from "vitest";

const externalApiFetch = vi.fn();

/** 각 테스트가 `mock.calls[0]` 으로 자기 호출을 읽는다. 초기화하지 않으면 앞 테스트의 호출을 본다. */
beforeEach(() => {
  externalApiFetch.mockReset();
});

vi.mock("@/shared/lib/api/externalClient", () => ({
  externalApiFetch: (path: string, options: unknown) => externalApiFetch(path, options),
}));

import {
  loginWithExternalAppleNative,
  loginWithExternalKakaoNative,
} from "@/shared/lib/api/externalApi";

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

/**
 * 계약 정본은 BE 위키 `Frontend-Apple-Login-Guide` §1 이다.
 *
 * FE 가 먼저 배선해 두면서 가정했던 이름 셋이 실제와 달랐다 — `nonce`→`rawNonce`,
 * `fullName`→`name`, 그리고 `authorizationCode` 는 **서버가 쓰지 않는다.**
 * 이름 하나만 어긋나도 서버는 값을 못 읽고 조용히 검증을 건너뛰거나 거절하므로 못박아 둔다.
 */
describe("loginWithExternalAppleNative", () => {
  const PARAMS = {
    identityToken: "애플-토큰",
    rawNonce: "원본-논스",
    name: "홍길동",
  };

  it("위키가 정한 세 필드를 그대로 보낸다", async () => {
    externalApiFetch.mockResolvedValue({ signupRequired: false, sanctioned: false });

    await loginWithExternalAppleNative(PARAMS);

    const [path, options] = externalApiFetch.mock.calls[0];
    expect(path).toBe("/api/v1/users/social-login/apple/native");
    expect(options).toMatchObject({ method: "POST", body: PARAMS });
  });

  /**
   * 서버가 인가 코드 교환을 하지 않는다(위키 §2). 이메일은 identityToken 안에 있고,
   * 클라이언트가 보낸 값은 서버가 믿을 수 없으므로 둘 다 바디에 실으면 안 된다.
   */
  it("authorizationCode·email 은 보내지 않는다", async () => {
    externalApiFetch.mockResolvedValue({ signupRequired: false, sanctioned: false });

    await loginWithExternalAppleNative(PARAMS);

    const body = externalApiFetch.mock.calls[0][1].body;
    expect(body).not.toHaveProperty("authorizationCode");
    expect(body).not.toHaveProperty("email");
  });

  it("이름이 없는 재로그인에서도 필드를 유지한다(null)", async () => {
    externalApiFetch.mockResolvedValue({ signupRequired: false, sanctioned: false });

    await loginWithExternalAppleNative({ ...PARAMS, name: null });

    expect(externalApiFetch.mock.calls[0][1].body).toMatchObject({ name: null });
  });

  it("refreshToken 쿠키를 받으려면 credentials: 'include' 여야 한다", async () => {
    externalApiFetch.mockResolvedValue({ signupRequired: false, sanctioned: false });

    await loginWithExternalAppleNative(PARAMS);

    expect(externalApiFetch.mock.calls[0][1]).toMatchObject({ credentials: "include" });
  });
});
