import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const login = vi.fn();
const isNativeApp = vi.fn();

vi.mock("@capacitor/core", () => ({
  registerPlugin: () => ({ login, logout: vi.fn() }),
}));

vi.mock("@/shared/lib/native/platform", () => ({
  isNativeApp: () => isNativeApp(),
}));

/** 모듈이 플러그인 프록시와 플래그를 모듈 스코프에 기억하므로 매번 새로 읽는다. */
async function loadModule() {
  vi.resetModules();
  return import("@/shared/lib/native/kakaoLogin");
}

const originalFlag = process.env.NEXT_PUBLIC_NATIVE_KAKAO_LOGIN_ENABLED;

beforeEach(() => {
  login.mockReset();
  isNativeApp.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  process.env.NEXT_PUBLIC_NATIVE_KAKAO_LOGIN_ENABLED = originalFlag;
  vi.restoreAllMocks();
});

/**
 * 웹의 리다이렉트 로그인은 유일한 웹 경로다. 이 게이트가 웹에서 한 번이라도 열리면
 * 브라우저 사용자가 존재하지 않는 네이티브 플러그인을 호출하게 된다.
 */
describe("isNativeKakaoLoginAvailable", () => {
  it("웹에서는 플래그가 켜져 있어도 false", async () => {
    process.env.NEXT_PUBLIC_NATIVE_KAKAO_LOGIN_ENABLED = "true";
    isNativeApp.mockReturnValue(false);

    const { isNativeKakaoLoginAvailable } = await loadModule();

    expect(isNativeKakaoLoginAvailable()).toBe(false);
  });

  it("앱이어도 플래그가 꺼져 있으면 false", async () => {
    delete process.env.NEXT_PUBLIC_NATIVE_KAKAO_LOGIN_ENABLED;
    isNativeApp.mockReturnValue(true);

    const { isNativeKakaoLoginAvailable } = await loadModule();

    expect(isNativeKakaoLoginAvailable()).toBe(false);
  });

  it("앱이면서 플래그가 켜져 있을 때만 true", async () => {
    process.env.NEXT_PUBLIC_NATIVE_KAKAO_LOGIN_ENABLED = "true";
    isNativeApp.mockReturnValue(true);

    const { isNativeKakaoLoginAvailable } = await loadModule();

    expect(isNativeKakaoLoginAvailable()).toBe(true);
  });
});

describe("loginWithKakaoSdk", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_NATIVE_KAKAO_LOGIN_ENABLED = "true";
    isNativeApp.mockReturnValue(true);
  });

  it("게이트가 닫혀 있으면 플러그인을 부르지 않는다", async () => {
    isNativeApp.mockReturnValue(false);

    const { loginWithKakaoSdk } = await loadModule();

    expect(await loginWithKakaoSdk()).toEqual({ status: "unavailable" });
    expect(login).not.toHaveBeenCalled();
  });

  it("성공하면 카카오 accessToken 을 돌려준다", async () => {
    login.mockResolvedValue({ accessToken: "카카오-토큰" });

    const { loginWithKakaoSdk } = await loadModule();

    expect(await loginWithKakaoSdk()).toEqual({ status: "success", accessToken: "카카오-토큰" });
  });

  it("사용자가 취소하면 cancelled — 리다이렉트 로그인으로 폴백하면 안 되는 유일한 실패다", async () => {
    login.mockRejectedValue(new Error("USER_CANCELLED"));

    const { loginWithKakaoSdk } = await loadModule();

    expect(await loginWithKakaoSdk()).toEqual({ status: "cancelled" });
  });

  it("그 밖의 실패는 failed — 호출부가 리다이렉트 로그인으로 폴백한다", async () => {
    login.mockRejectedValue(new Error("KakaoTalk not installed"));

    const { loginWithKakaoSdk } = await loadModule();

    expect(await loginWithKakaoSdk()).toEqual({
      status: "failed",
      message: "KakaoTalk not installed",
    });
  });

  it("빈 토큰은 성공으로 치지 않는다", async () => {
    login.mockResolvedValue({ accessToken: "" });

    const { loginWithKakaoSdk } = await loadModule();

    expect((await loginWithKakaoSdk()).status).toBe("failed");
  });

  it("어떤 경우에도 예외를 던지지 않는다 (로그인 버튼이 죽으면 안 된다)", async () => {
    login.mockRejectedValue("문자열 형태의 거부");

    const { loginWithKakaoSdk } = await loadModule();

    await expect(loginWithKakaoSdk()).resolves.toMatchObject({ status: "failed" });
  });
});
