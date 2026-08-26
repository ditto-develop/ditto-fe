import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * 웹에서는 권한을 묻지도, 알림을 예약하지도 않아야 한다.
 *
 * 같은 번들이 웹에서도 돌기 때문에, 이 게이팅이 깨지면 **브라우저 사용자에게
 * 알림 권한 팝업이 뜬다.** 조용히 이탈을 만드는 종류의 회귀라 테스트로 고정한다.
 */

const requestPermissions = vi.fn(async () => ({ display: "granted" }));
const schedule = vi.fn(async () => ({}));
const getPending = vi.fn(async () => ({ notifications: [] }));
const cancel = vi.fn(async () => {});
const addListener = vi.fn(async () => ({ remove: async () => {} }));

vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    requestPermissions: () => requestPermissions(),
    schedule: (...a: unknown[]) => schedule(...(a as [])),
    getPending: () => getPending(),
    cancel: (...a: unknown[]) => cancel(...(a as [])),
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

afterEach(() => vi.clearAllMocks());

describe("initLocalNotifications 게이팅", () => {
  it("웹에서는 권한을 묻지 않고 예약도 하지 않는다", async () => {
    isNativePlatform.mockReturnValue(false);

    const { initLocalNotifications } = await import("@/shared/lib/native/localNotifications");
    await initLocalNotifications({ navigate: () => {} });

    expect(requestPermissions).not.toHaveBeenCalled();
    expect(schedule).not.toHaveBeenCalled();
    expect(addListener).not.toHaveBeenCalled();
  });
});

describe("clearScheduledNotifications 게이팅", () => {
  it("웹에서는 아무것도 하지 않는다", async () => {
    isNativePlatform.mockReturnValue(false);

    const { clearScheduledNotifications } = await import(
      "@/shared/lib/native/localNotifications"
    );
    await clearScheduledNotifications();

    expect(getPending).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
  });
});
