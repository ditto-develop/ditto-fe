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

/** 홈 헤더 벨 배지용 미읽음 수. 목록과 같은 창(최근 30일)을 센다. */
export function getUnreadNotificationCount(): Promise<number> {
  return externalApiFetch<{ count: number }>("/api/v1/notifications/unread-count").then(
    (data) => data.count,
  );
}
