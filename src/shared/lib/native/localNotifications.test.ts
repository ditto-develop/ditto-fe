import { afterEach, describe, expect, it, vi } from "vitest";

const schedule = vi.fn(async () => ({}));
const getPending = vi.fn(
  async (): Promise<{ notifications: Array<{ id: number }> }> => ({ notifications: [] }),
);
const cancel = vi.fn(async () => {});
const addListener = vi.fn(async () => ({ remove: async () => {} }));

vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    schedule: (...a: unknown[]) => schedule(...(a as [])),
    getPending: () => getPending(),
    cancel: (...a: unknown[]) => cancel(...(a as [])),
    addListener: (...a: unknown[]) => addListener(...(a as [])),
  },
}));

const isNativeApp = vi.fn(() => false);
vi.mock("@/shared/lib/native/platform", () => ({
  isNativeApp: () => isNativeApp(),
}));

afterEach(() => vi.clearAllMocks());

describe("initLocalNotifications 게이팅", () => {
  it("웹에서는 탭 리스너를 연결하거나 알림을 예약하지 않는다", async () => {
    isNativeApp.mockReturnValue(false);

    const { initLocalNotifications } = await import("@/shared/lib/native/localNotifications");
    await initLocalNotifications({ navigate: () => {} });

    expect(addListener).not.toHaveBeenCalled();
    expect(schedule).not.toHaveBeenCalled();
  });

  it("네이티브에서도 프론트 자체 알림은 예약하지 않는다", async () => {
    isNativeApp.mockReturnValue(true);

    const { initLocalNotifications } = await import("@/shared/lib/native/localNotifications");
    await initLocalNotifications({ navigate: () => {} });

    expect(addListener).toHaveBeenCalledWith(
      "localNotificationActionPerformed",
      expect.any(Function),
    );
    expect(schedule).not.toHaveBeenCalled();
  });
});

describe("clearLegacyScheduledNotifications", () => {
  it("웹에서는 아무것도 하지 않는다", async () => {
    isNativeApp.mockReturnValue(false);

    const { clearLegacyScheduledNotifications } = await import(
      "@/shared/lib/native/localNotifications"
    );
    await clearLegacyScheduledNotifications();

    expect(getPending).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
  });

  it("이전 버전의 주간 예약만 취소한다", async () => {
    isNativeApp.mockReturnValue(true);
    getPending.mockResolvedValueOnce({
      notifications: [{ id: 1000 }, { id: 1007 }, { id: 2000 }, { id: 2007 }, { id: 3000 }],
    });

    const { clearLegacyScheduledNotifications } = await import(
      "@/shared/lib/native/localNotifications"
    );
    await clearLegacyScheduledNotifications();

    expect(cancel).toHaveBeenCalledWith({
      notifications: [{ id: 1000 }, { id: 1007 }, { id: 2000 }, { id: 2007 }],
    });
  });
});
