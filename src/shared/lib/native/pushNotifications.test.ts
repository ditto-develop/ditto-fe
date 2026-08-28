import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * 푸시 모듈이 BE 위키 `Frontend-Push-Guide` 계약을 지키는지 고정한다.
 *
 * 1. 플래그가 꺼져 있거나 웹이면 **네트워크를 치지 않고 권한도 묻지 않는다.**
 *    킬 스위치가 진짜 스위치여야 하고, 웹 방문자에게 권한 팝업이 뜨면 안 된다.
 * 2. 등록은 대문자 enum(`IOS`/`ANDROID`)으로 나간다(§1).
 * 3. 알림 탭은 `deepLink` 이동 + `notificationId` 읽음 처리, 포그라운드 수신은
 *    읽음 처리 없이 재조회만 한다(§3 · §앱 구현 노트).
 */

// 실제 클라이언트는 항상 Promise 다. 등록 응답 형태는 BE 위키 §1(`registered`).
const externalApiFetch = vi.fn(async () => ({ registered: true }));
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
const getPlatform = vi.fn(() => "web");
vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
    getPlatform: () => getPlatform(),
  },
}));

const markNotificationRead = vi.fn(async () => undefined);
vi.mock("@/features/notification/api/notificationApi", () => ({
  markNotificationRead: (...a: unknown[]) => markNotificationRead(...(a as [])),
}));

/**
 * 이 스위트는 node 환경에서 돈다(vitest.config.ts — DOM 이 필요 없는 순수 로직 전용).
 * 푸시 모듈이 `window` 를 쓰는 곳은 두 군데뿐이다: 네이티브 판정(platform.ts 의
 * `typeof window`)과 포그라운드 수신 이벤트 발행. EventTarget 하나면 둘 다 충족되므로
 * jsdom 을 devDependency 로 끌어오지 않는다.
 */
beforeAll(() => {
  Object.assign(globalThis, { window: new EventTarget() });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, "window");
});

afterEach(() => {
  vi.clearAllMocks();
  getPlatform.mockReturnValue("web");
  delete process.env.NEXT_PUBLIC_PUSH_ENABLED;
});

/** 네이티브 + 플래그 ON 상태에서 초기화하고, 등록된 리스너를 이름으로 꺼내 준다. */
async function initOnNative(navigate = vi.fn()) {
  isNativePlatform.mockReturnValue(true);
  getPlatform.mockReturnValue("ios");
  process.env.NEXT_PUBLIC_PUSH_ENABLED = "true";

  const push = await import("@/shared/lib/native/pushNotifications");
  const dispose = await push.initPushNotifications({ navigate });

  const listenerFor = (event: string) => {
    const call = addListener.mock.calls.find(([name]) => name === event);
    if (!call) throw new Error(`리스너 미등록: ${event}`);
    return call[1] as (payload: unknown) => void;
  };

  return { dispose, listenerFor, navigate };
}

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

describe("extractNotificationId", () => {
  it("FCM data 는 전부 문자열이므로 숫자로 되돌린다", async () => {
    const { extractNotificationId } = await import("@/shared/lib/native/pushNotifications");
    expect(extractNotificationId({ notificationId: "8821" })).toBe(8821);
  });

  it("없거나 숫자가 아니면 null — 읽음 처리만 건너뛰고 이동은 막지 않는다", async () => {
    const { extractNotificationId } = await import("@/shared/lib/native/pushNotifications");
    expect(extractNotificationId({ notificationId: "abc" })).toBeNull();
    expect(extractNotificationId({ notificationId: "0" })).toBeNull();
    expect(extractNotificationId({})).toBeNull();
    expect(extractNotificationId(null)).toBeNull();
  });
});

describe("네이티브 초기화 이후 동작", () => {
  it("최초 토큰을 BE 계약대로 등록한다(대문자 platform)", async () => {
    await initOnNative();

    expect(requestPermissions).toHaveBeenCalled();
    expect(externalApiFetch).toHaveBeenCalledWith("/api/v1/notifications/devices", {
      method: "POST",
      body: { token: "fcm-token", platform: "IOS" },
    });
  });

  it("tokenReceived 로 토큰이 갱신되면 다시 등록한다", async () => {
    const { listenerFor } = await initOnNative();
    externalApiFetch.mockClear();

    listenerFor("tokenReceived")({ token: "rotated-token" });

    expect(externalApiFetch).toHaveBeenCalledWith("/api/v1/notifications/devices", {
      method: "POST",
      body: { token: "rotated-token", platform: "IOS" },
    });
  });

  it("알림 탭: deepLink 로 이동하고 notificationId 를 읽음 처리한다", async () => {
    const { listenerFor, navigate } = await initOnNative();

    listenerFor("notificationActionPerformed")({
      notification: {
        data: { notificationId: "8821", type: "CHAT_MESSAGE", deepLink: "/chat/one-on-one/305/" },
      },
    });

    expect(navigate).toHaveBeenCalledWith("/chat/one-on-one/305/");
    expect(markNotificationRead).toHaveBeenCalledWith(8821);
  });

  it("알림 탭: deepLink 키가 없으면 이동 없이 읽음 처리만 한다", async () => {
    const { listenerFor, navigate } = await initOnNative();

    listenerFor("notificationActionPerformed")({
      notification: { data: { notificationId: "8821", type: "SYSTEM_NOTICE" } },
    });

    expect(navigate).not.toHaveBeenCalled();
    expect(markNotificationRead).toHaveBeenCalledWith(8821);
  });

  it("포그라운드 수신은 읽음 처리 없이 재조회 이벤트만 쏜다", async () => {
    const { listenerFor } = await initOnNative();
    const onPush = vi.fn();
    const { PUSH_RECEIVED_EVENT } = await import("@/shared/lib/native/pushNotifications");
    window.addEventListener(PUSH_RECEIVED_EVENT, onPush);

    listenerFor("notificationReceived")({ notification: { data: { notificationId: "1" } } });

    expect(onPush).toHaveBeenCalled();
    expect(markNotificationRead).not.toHaveBeenCalled();
    window.removeEventListener(PUSH_RECEIVED_EVENT, onPush);
  });
});
