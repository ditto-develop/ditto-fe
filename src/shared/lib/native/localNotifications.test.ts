import { afterEach, describe, expect, it, vi } from "vitest";

const schedule = vi.fn(async () => ({}));
const getPending = vi.fn(
  async (): Promise<{ notifications: Array<{ id: number }> }> => ({ notifications: [] }),
);
const cancel = vi.fn(async () => {});
const addListener = vi.fn(async () => ({ remove: async () => {} }));
const getDeliveredNotifications = vi.fn(
  async (): Promise<{ notifications: Array<{ id: number; extra?: unknown }> }> => ({
    notifications: [],
  }),
);
const removeDeliveredNotificationsById = vi.fn(async () => {});

vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    schedule: (...a: unknown[]) => schedule(...(a as [])),
    getPending: () => getPending(),
    cancel: (...a: unknown[]) => cancel(...(a as [])),
    addListener: (...a: unknown[]) => addListener(...(a as [])),
    getDeliveredNotifications: () => getDeliveredNotifications(),
    removeDeliveredNotificationsById: (...a: unknown[]) =>
      removeDeliveredNotificationsById(...(a as [])),
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
    await initLocalNotifications({ onOpen: () => {} });

    expect(addListener).not.toHaveBeenCalled();
    expect(schedule).not.toHaveBeenCalled();
  });

  it("네이티브에서도 프론트 자체 알림은 예약하지 않는다", async () => {
    isNativeApp.mockReturnValue(true);

    const { initLocalNotifications } = await import("@/shared/lib/native/localNotifications");
    await initLocalNotifications({ onOpen: () => {} });

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

describe("clearForegroundNotifications", () => {
  const isRoom305 = (deepLink: string) => deepLink.startsWith("/chat/one-on-one/305");

  it("웹에서는 아무것도 하지 않는다", async () => {
    isNativeApp.mockReturnValue(false);

    const { clearForegroundNotifications } = await import(
      "@/shared/lib/native/localNotifications"
    );
    await clearForegroundNotifications(isRoom305);

    expect(getDeliveredNotifications).not.toHaveBeenCalled();
    expect(removeDeliveredNotificationsById).not.toHaveBeenCalled();
  });

  it("이번 실행에서 띄운 같은 방 배너만 지운다 — Android 는 delivered 에 extra 가 없다", async () => {
    isNativeApp.mockReturnValue(true);
    const { clearForegroundNotifications, showForegroundNotification } = await import(
      "@/shared/lib/native/localNotifications"
    );
    const show = (deepLink: string | null) =>
      showForegroundNotification({ title: "t", body: "b", deepLink, notificationId: null });

    await show("/chat/one-on-one/305/");
    await show("/chat/one-on-one/306/");
    await show("/chat/one-on-one/305/");
    await show(null);
    const ids = schedule.mock.calls.map(
      (call) => (call as unknown as [{ notifications: Array<{ id: number }> }])[0].notifications[0].id,
    );

    await clearForegroundNotifications(isRoom305);

    expect(removeDeliveredNotificationsById).toHaveBeenCalledWith({ ids: [ids[0], ids[2]] });

    // 한 번 지운 배너는 다시 고르지 않는다.
    removeDeliveredNotificationsById.mockClear();
    await clearForegroundNotifications(isRoom305);
    expect(removeDeliveredNotificationsById).not.toHaveBeenCalled();
  });

  it("iOS 는 delivered 의 extra.deepLink 로 지난 실행의 배너도 찾는다", async () => {
    isNativeApp.mockReturnValue(true);
    getDeliveredNotifications.mockResolvedValueOnce({
      notifications: [
        { id: 3050, extra: { deepLink: "/chat/one-on-one/305/" } },
        { id: 3051, extra: { deepLink: "/chat/one-on-one/306/" } },
        { id: 3052 },
      ],
    });

    const { clearForegroundNotifications } = await import(
      "@/shared/lib/native/localNotifications"
    );
    await clearForegroundNotifications(isRoom305);

    expect(removeDeliveredNotificationsById).toHaveBeenCalledWith({ ids: [3050] });
  });
});
