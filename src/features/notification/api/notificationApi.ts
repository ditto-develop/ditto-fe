import type {
  NotificationCategory,
  NotificationPage,
} from "@/features/notification/model/types";
import { externalApiFetch } from "@/shared/lib/api/externalClient";

/** 서버가 허용하는 최대 페이지 크기. */
const MAX_PAGE_SIZE = 100;

type GetNotificationsParams = {
  /** 생략하면 '전체' 탭. */
  category?: NotificationCategory;
  /** 이전 응답의 nextCursor. 생략하면 첫 페이지. */
  cursor?: string;
  size?: number;
};

/**
 * 알림 목록(최근 30일, 최신순).
 * 응답은 배열이 아니라 `{ notifications, nextCursor }` 래퍼다.
 */
export function getNotifications(
  params: GetNotificationsParams = {},
): Promise<NotificationPage> {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.cursor) query.set("cursor", params.cursor);
  query.set("size", String(params.size ?? MAX_PAGE_SIZE));

  return externalApiFetch<NotificationPage>(`/api/v1/notifications?${query.toString()}`);
}

/** 알림 하나 읽음. 멱등이며 내 알림이 아니면 404다. */
export function markNotificationRead(id: number): Promise<unknown> {
  return externalApiFetch<unknown>(`/api/v1/notifications/${id}/read`, { method: "PUT" });
}

/** 안 읽은 알림 전체 읽음. */
export function markAllNotificationsRead(): Promise<{ readCount: number }> {
  return externalApiFetch<{ readCount: number }>("/api/v1/notifications/read-all", {
    method: "PUT",
  });
}

/** 방에 들어가면 이미 본 것으로 치는 알림. 평가 요청(REVIEW_*)은 할 일이 남아 있어 빠진다. */
const CHAT_ROOM_SEEN_TYPES = new Set(["CHAT_MESSAGE", "CHAT_ENDING_SOON"]);

/**
 * 그 대화방을 가리키는 안 읽은 채팅 알림을 모두 읽음으로 넘긴다. 넘긴 개수를 돌려준다.
 *
 * 방에 들어가 메시지를 봤는데 알림 센터 행은 안 읽음으로 남아 있으면, 그 수가 그대로
 * 미읽음 수와 앱 아이콘 배지에 잡힌다(2026-10-07). 방 단위 읽음 API 가 없어서 최근 채팅
 * 알림 한 페이지(최대 100건)에서 골라 하나씩 읽는다. 채팅 계열의 `targetId` 는 방 ID 이고
 * 1:1·그룹 방이 같은 id 공간을 쓴다(`toNotificationTarget`).
 */
export async function markChatRoomNotificationsRead(roomId: number): Promise<number> {
  const { notifications } = await getNotifications({ category: "CHAT" });
  const unread = notifications.filter(
    (item) =>
      item.targetId === roomId && item.readAt === null && CHAT_ROOM_SEEN_TYPES.has(item.type),
  );
  await Promise.all(unread.map((item) => markNotificationRead(item.id)));
  return unread.length;
}

/** 홈 헤더 벨 배지용 미읽음 수. 목록과 같은 창(최근 30일)을 센다. */
export function getUnreadNotificationCount(): Promise<number> {
  return externalApiFetch<{ count: number }>("/api/v1/notifications/unread-count").then(
    (data) => data.count,
  );
}
