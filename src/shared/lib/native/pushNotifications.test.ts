import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * 푸시 모듈에서 지켜야 하는 안전 속성 두 가지를 고정한다.
 *
 * 1. 플래그가 꺼져 있거나 웹이면 **네트워크를 치지 않고 권한도 묻지 않는다.**
 *    BE에 디바이스 토큰 등록 API가 아직 없는데 권한 팝업을 띄우면 승인률만 태운다.
 * 2. BE 계약(BE-Request-App §A-1)이 요구하는 대문자 enum으로 플랫폼을 보낸다.
 */

const externalApiFetch = vi.fn();
vi.mock("@/shared/lib/api/externalClient", () => ({
  externalApiFetch: (...args: unknown[]) => externalApiFetch(...args),
}));

const requestPermissions = vi.fn(async () => ({ receive: "granted" }));
const getToken = vi.fn(async () => ({ token: "fcm-token" }));
const deleteToken = vi.fn(async () => {});
const addListener = vi.fn(async () => ({ remove: async () => {} }));
vi.mock("@capacitor-firebase/messaging", () => ({
  FirebaseMessaging: {
    requestPermissions: (...a: unknown[]) => requestPermissions(...(a as [])),
    getToken: (...a: unknown[]) => getToken(...(a as [])),
    deleteToken: (...a: unknown[]) => deleteToken(...(a as [])),
    addListener: (...a: unknown[]) => addListener(...(a as [])),
  },
}));

const isNativePlatform = vi.fn(() => false);
vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
    getPlatform: () => "web",
  },
}));

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.NEXT_PUBLIC_PUSH_ENABLED;
});

describe("toDevicePlatform", () => {
  it.each([
    ["ios", "IOS"],
    ["android", "ANDROID"],
  ] as const)("%s → %s", async (input, expected) => {
    const { toDevicePlatform } = await import("@/shared/lib/native/pushNotifications");
    expect(toDevicePlatform(input)).toBe(expected);
  });

  it("웹은 등록 대상이 아니므로 null", async () => {
    const { toDevicePlatform } = await import("@/shared/lib/native/pushNotifications");
    expect(toDevicePlatform("web")).toBeNull();
  });
});

describe("initPushNotifications 게이팅", () => {
  it("웹에서는 권한을 묻지도, 리스너를 달지도 않는다", async () => {
    isNativePlatform.mockReturnValue(false);
    process.env.NEXT_PUBLIC_PUSH_ENABLED = "true";

    const { initPushNotifications } = await import("@/shared/lib/native/pushNotifications");
    await initPushNotifications({ navigate: () => {} });

    expect(requestPermissions).not.toHaveBeenCalled();
    expect(getToken).not.toHaveBeenCalled();
    expect(addListener).not.toHaveBeenCalled();
  });

  it("네이티브라도 플래그가 꺼져 있으면 권한을 묻지 않는다", async () => {
    isNativePlatform.mockReturnValue(true);
    // NEXT_PUBLIC_PUSH_ENABLED 미설정 = 꺼짐

    const { initPushNotifications } = await import("@/shared/lib/native/pushNotifications");
    await initPushNotifications({ navigate: () => {} });

    expect(requestPermissions).not.toHaveBeenCalled();
    expect(getToken).not.toHaveBeenCalled();
  });
});

describe("unregisterDeviceToken 게이팅", () => {
  it("웹에서는 요청을 보내지 않는다", async () => {
    isNativePlatform.mockReturnValue(false);
    process.env.NEXT_PUBLIC_PUSH_ENABLED = "true";

    const { unregisterDeviceToken } = await import("@/shared/lib/native/pushNotifications");
    await unregisterDeviceToken("tok");

    expect(externalApiFetch).not.toHaveBeenCalled();
  });

  it("토큰이 비어 있으면 요청을 보내지 않는다", async () => {
    isNativePlatform.mockReturnValue(true);
    process.env.NEXT_PUBLIC_PUSH_ENABLED = "true";

    const { unregisterDeviceToken } = await import("@/shared/lib/native/pushNotifications");
    await unregisterDeviceToken("");

    expect(externalApiFetch).not.toHaveBeenCalled();
  });
});

describe("extractDeepLink", () => {
  it("data.deepLink 를 내부 경로로 바꾼다", async () => {
    const { extractDeepLink } = await import("@/shared/lib/native/pushNotifications");
    expect(extractDeepLink({ deepLink: "/chat/one-on-one/12/" })).toBe("/chat/one-on-one/12/");
    expect(extractDeepLink({ deepLink: "https://ditto.pics/profile/8/" })).toBe("/profile/8/");
  });

  it("외부 호스트 · 비정상 payload 는 거부한다", async () => {
    const { extractDeepLink } = await import("@/shared/lib/native/pushNotifications");
    expect(extractDeepLink({ deepLink: "https://evil.example.com/x/" })).toBeNull();
    expect(extractDeepLink({ deepLink: 42 })).toBeNull();
    expect(extractDeepLink({})).toBeNull();
    expect(extractDeepLink(null)).toBeNull();
    expect(extractDeepLink("문자열")).toBeNull();
  });
});
