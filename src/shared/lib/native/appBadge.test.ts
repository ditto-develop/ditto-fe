import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * 앱 아이콘 배지 동기화가 지켜야 하는 것.
 *
 * 1. iOS + 배지 플러그인이 있는 빌드에서만 돈다 — 원격 URL 로드라 플러그인이 없는 옛 앱
 *    빌드와 웹에서도 같은 코드가 실행된다.
 * 2. 알림 권한이 허용되기 전에는 숫자를 바꾸지 않는다 — 플러그인 `set()` 이 배지 전용 권한
 *    창을 먼저 띄워 FCM 알림 권한을 영영 못 묻게 만든다.
 * 3. 겹쳐 불리면 마지막 호출의 숫자만 쓴다.
 */

const getUnreadNotificationCount = vi.fn(async (): Promise<number> => 0);
vi.mock("@/features/notification/api/notificationApi", () => ({
  getUnreadNotificationCount: () => getUnreadNotificationCount(),
}));

const checkPermissions = vi.fn(async (): Promise<{ display: string }> => ({ display: "granted" }));
const set = vi.fn<(options: { count: number }) => Promise<void>>(async () => {});
const clear = vi.fn(async () => {});
vi.mock("@capawesome/capacitor-badge", () => ({
  // Capacitor 플러그인은 모든 프로퍼티 접근을 가상 메서드로 만드는 Proxy다.
  Badge: new Proxy(
    {
      checkPermissions: () => checkPermissions(),
      set: (options: { count: number }) => set(options),
      clear: () => clear(),
    },
    {
      get(target, property, receiver) {
        if (property === "then") throw new Error("Capacitor plugin must not be awaited directly");
        return Reflect.get(target, property, receiver);
      },
    },
  ),
}));

const getPlatform = vi.fn(() => "ios");
const isPluginAvailable = vi.fn(() => true);
vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => getPlatform() !== "web",
    getPlatform: () => getPlatform(),
    isPluginAvailable: () => isPluginAvailable(),
  },
}));

// node 환경이다. platform.ts 는 `typeof window` 만 본다.
beforeAll(() => {
  Object.assign(globalThis, { window: {} });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, "window");
});

afterEach(() => {
  vi.clearAllMocks();
  getPlatform.mockReturnValue("ios");
  isPluginAvailable.mockReturnValue(true);
  checkPermissions.mockResolvedValue({ display: "granted" });
  getUnreadNotificationCount.mockResolvedValue(0);
});

describe("syncAppBadge", () => {
  it("iOS 에서 아이콘 배지를 서버 미읽음 수로 맞춘다", async () => {
    getUnreadNotificationCount.mockResolvedValueOnce(3);
    const { syncAppBadge } = await import("@/shared/lib/native/appBadge");

    await syncAppBadge();

    expect(set).toHaveBeenCalledWith({ count: 3 });
  });

  it.each([
    ["웹", "web", true],
    ["안드로이드", "android", true],
    ["배지 플러그인이 없는 옛 iOS 빌드", "ios", false],
  ])("%s에서는 조회도 하지 않는다", async (_label, platform, pluginAvailable) => {
    getPlatform.mockReturnValue(platform);
    isPluginAvailable.mockReturnValue(pluginAvailable);
    const { syncAppBadge, clearAppBadge } = await import("@/shared/lib/native/appBadge");

    await syncAppBadge();
    await clearAppBadge();

    expect(getUnreadNotificationCount).not.toHaveBeenCalled();
    expect(checkPermissions).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
  });

  it.each(["prompt", "denied"])("알림 권한이 %s 이면 숫자를 바꾸지 않는다", async (display) => {
    checkPermissions.mockResolvedValueOnce({ display });
    const { syncAppBadge } = await import("@/shared/lib/native/appBadge");

    await syncAppBadge();

    expect(set).not.toHaveBeenCalled();
  });

  it("겹쳐 불리면 마지막 호출의 숫자만 쓴다", async () => {
    let resolveFirst: (count: number) => void = () => {};
    getUnreadNotificationCount
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce(0);
    const { syncAppBadge } = await import("@/shared/lib/native/appBadge");

    const first = syncAppBadge();
    await vi.waitFor(() => expect(getUnreadNotificationCount).toHaveBeenCalledTimes(1));
    await syncAppBadge();
    resolveFirst(5);
    await first;

    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith({ count: 0 });
  });

  it("조회가 실패해도 던지지 않는다", async () => {
    getUnreadNotificationCount.mockRejectedValueOnce(new Error("network"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { syncAppBadge } = await import("@/shared/lib/native/appBadge");

    await expect(syncAppBadge()).resolves.toBeUndefined();
    expect(set).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("clearAppBadge", () => {
  it("배지를 지우고, 진행 중이던 동기화가 이전 계정의 숫자를 다시 박지 못하게 한다", async () => {
    let resolveCount: (count: number) => void = () => {};
    getUnreadNotificationCount.mockImplementationOnce(
      () => new Promise((resolve) => { resolveCount = resolve; }),
    );
    const { syncAppBadge, clearAppBadge } = await import("@/shared/lib/native/appBadge");

    const pending = syncAppBadge();
    await vi.waitFor(() => expect(getUnreadNotificationCount).toHaveBeenCalled());
    await clearAppBadge();
    resolveCount(4);
    await pending;

    expect(clear).toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
  });
});
