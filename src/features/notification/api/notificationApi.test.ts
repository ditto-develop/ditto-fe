import { afterEach, describe, expect, it, vi } from "vitest";

import type { NotificationItem } from "@/features/notification/model/types";

const externalApiFetch = vi.fn<(path: string, init?: unknown) => Promise<unknown>>(
  async () => null,
);
vi.mock("@/shared/lib/api/externalClient", () => ({
  externalApiFetch: (path: string, init?: unknown) => externalApiFetch(path, init),
}));

afterEach(() => {
  vi.clearAllMocks();
});

function item(overrides: Partial<NotificationItem>): NotificationItem {
  return {
    id: 1,
    type: "CHAT_MESSAGE",
    category: "CHAT",
    title: "새 메시지",
    body: null,
    targetId: 305,
    deepLink: "/chat/one-on-one/305/",
    readAt: null,
    createdAt: "2026-10-07 12:00:00",
    ...overrides,
  };
}

describe("markChatRoomNotificationsRead", () => {
  it("그 방의 안 읽은 채팅 알림만 읽음으로 넘긴다", async () => {
    externalApiFetch.mockResolvedValueOnce({
      notifications: [
        item({ id: 1 }),
        item({ id: 2, type: "CHAT_ENDING_SOON" }),
        item({ id: 3, targetId: 306 }),
        item({ id: 4, readAt: "2026-10-07 12:01:00" }),
        // 평가 요청은 방에 들어가도 할 일이 남아 있다.
        item({ id: 5, type: "REVIEW_REQUEST" }),
      ],
      nextCursor: null,
    });
    const { markChatRoomNotificationsRead } = await import(
      "@/features/notification/api/notificationApi"
    );

    await expect(markChatRoomNotificationsRead(305)).resolves.toBe(2);

    expect(externalApiFetch).toHaveBeenNthCalledWith(
      1,
      "/api/v1/notifications?category=CHAT&size=100",
      undefined,
    );
    const readPaths = externalApiFetch.mock.calls.slice(1).map(([path]) => path);
    expect(readPaths).toEqual(["/api/v1/notifications/1/read", "/api/v1/notifications/2/read"]);
  });

  it("넘길 것이 없으면 읽음 요청을 보내지 않는다", async () => {
    externalApiFetch.mockResolvedValueOnce({ notifications: [], nextCursor: null });
    const { markChatRoomNotificationsRead } = await import(
      "@/features/notification/api/notificationApi"
    );

    await expect(markChatRoomNotificationsRead(305)).resolves.toBe(0);
    expect(externalApiFetch).toHaveBeenCalledTimes(1);
  });
});
