import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const login = vi.fn();
const isNativeApp = vi.fn();
const getNativePlatform = vi.fn();

vi.mock("@capacitor/core", () => ({
  registerPlugin: () => ({ login }),
}));

vi.mock("@/shared/lib/native/platform", () => ({
  isNativeApp: () => isNativeApp(),
  getNativePlatform: () => getNativePlatform(),
}));

/** 모듈이 플러그인 프록시와 플래그를 모듈 스코프에 기억하므로 매번 새로 읽는다. */
async function loadModule() {
  vi.resetModules();
  return import("@/shared/lib/native/appleLogin");
}

const originalFlag = process.env.NEXT_PUBLIC_APPLE_LOGIN_ENABLED;

const APPLE_RESPONSE = {
  identityToken: "애플-토큰",
  rawNonce: "원본-논스",
  name: "홍길동",
  // 서버로 보내지 않는 값. 플러그인은 계속 돌려준다(폐기 정책이 생길 때를 위해).
  authorizationCode: "인가-코드",
};

beforeEach(() => {
  login.mockReset();
  isNativeApp.mockReset();
  getNativePlatform.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  process.env.NEXT_PUBLIC_APPLE_LOGIN_ENABLED = originalFlag;
  vi.restoreAllMocks();
});

/**
 * 이 게이트가 잘못 열리면 존재하지 않는 네이티브 플러그인을 부르게 된다.
 * 웹은 카카오 리다이렉트가 유일한 경로이고, 안드로이드에는 Sign in with Apple 이 없다.
 */
describe("isNativeAppleLoginAvailable — 네이티브 SDK 경로는 iOS 앱뿐이다", () => {
  it("웹에서는 플래그가 켜져 있어도 false", async () => {
    process.env.NEXT_PUBLIC_APPLE_LOGIN_ENABLED = "true";
    isNativeApp.mockReturnValue(false);
    getNativePlatform.mockReturnValue("web");

    const { isNativeAppleLoginAvailable } = await loadModule();

    expect(isNativeAppleLoginAvailable()).toBe(false);
  });

  it("안드로이드 앱에서는 false — 리다이렉트 경로를 타야 한다", async () => {
    process.env.NEXT_PUBLIC_APPLE_LOGIN_ENABLED = "true";
    isNativeApp.mockReturnValue(true);
    getNativePlatform.mockReturnValue("android");

    const { isNativeAppleLoginAvailable } = await loadModule();

    expect(isNativeAppleLoginAvailable()).toBe(false);
  });

  it("iOS 앱이어도 플래그가 꺼져 있으면 false", async () => {
    delete process.env.NEXT_PUBLIC_APPLE_LOGIN_ENABLED;
    isNativeApp.mockReturnValue(true);
    getNativePlatform.mockReturnValue("ios");

    const { isNativeAppleLoginAvailable } = await loadModule();

    expect(isNativeAppleLoginAvailable()).toBe(false);
  });

  it("iOS 앱이면서 플래그가 켜져 있을 때만 true", async () => {
    process.env.NEXT_PUBLIC_APPLE_LOGIN_ENABLED = "true";
    isNativeApp.mockReturnValue(true);
    getNativePlatform.mockReturnValue("ios");

    const { isNativeAppleLoginAvailable } = await loadModule();

    expect(isNativeAppleLoginAvailable()).toBe(true);
  });
});

describe("loginWithAppleSdk", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APPLE_LOGIN_ENABLED = "true";
    isNativeApp.mockReturnValue(true);
    getNativePlatform.mockReturnValue("ios");
  });

  it("게이트가 닫혀 있으면 플러그인을 부르지 않는다", async () => {
    getNativePlatform.mockReturnValue("android");

    const { loginWithAppleSdk } = await loadModule();

    expect(await loginWithAppleSdk()).toEqual({ status: "unavailable" });
    expect(login).not.toHaveBeenCalled();
  });

  it("성공하면 서버가 검증할 재료를 그대로 돌려준다", async () => {
    login.mockResolvedValue(APPLE_RESPONSE);

    const { loginWithAppleSdk } = await loadModule();

    expect(await loginWithAppleSdk()).toEqual({
      status: "success",
      identityToken: "애플-토큰",
      rawNonce: "원본-논스",
      name: "홍길동",
    });
  });

  /**
   * 재로그인에서는 이름이 오지 않는다(최초 1회뿐). undefined 를 그대로 흘리면
   * 요청 바디에서 필드가 사라져 BE 계약과 어긋난다.
   */
  it("이름이 없으면 null 로 정규화한다 — 재로그인의 정상 경로다", async () => {
    login.mockResolvedValue({ identityToken: "애플-토큰", rawNonce: "원본-논스" });

    const { loginWithAppleSdk } = await loadModule();

    expect(await loginWithAppleSdk()).toEqual({
      status: "success",
      identityToken: "애플-토큰",
      rawNonce: "원본-논스",
      name: null,
    });
  });

  it("사용자가 취소하면 cancelled — 다른 로그인 창을 띄우면 안 된다", async () => {
    login.mockRejectedValue(new Error("USER_CANCELLED"));

    const { loginWithAppleSdk } = await loadModule();

    expect(await loginWithAppleSdk()).toEqual({ status: "cancelled" });
  });

  it("그 밖의 실패는 failed", async () => {
    login.mockRejectedValue(new Error("Sign in with Apple not configured"));

    const { loginWithAppleSdk } = await loadModule();

    expect(await loginWithAppleSdk()).toEqual({
      status: "failed",
      message: "Sign in with Apple not configured",
    });
  });

  it("빈 identityToken 은 성공으로 치지 않는다", async () => {
    login.mockResolvedValue({ ...APPLE_RESPONSE, identityToken: "" });

    const { loginWithAppleSdk } = await loadModule();

    expect((await loginWithAppleSdk()).status).toBe("failed");
  });

  it("어떤 경우에도 예외를 던지지 않는다 (로그인 버튼이 죽으면 안 된다)", async () => {
    login.mockRejectedValue("문자열 형태의 거부");

    const { loginWithAppleSdk } = await loadModule();

    await expect(loginWithAppleSdk()).resolves.toMatchObject({ status: "failed" });
  });
});
