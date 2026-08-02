import type { NotificationItem } from "@/features/notification/model/types";
import { externalApiFetch } from "@/shared/lib/api/externalClient";

export function getNotifications(): Promise<NotificationItem[]> {
  return externalApiFetch<NotificationItem[]>("/api/v1/notifications");
}

export function markNotificationRead(id: string): Promise<null> {
  return externalApiFetch<null>(`/api/v1/notifications/${id}/read`, { method: "POST" });
}

export function markAllNotificationsRead(): Promise<null> {
  return externalApiFetch<null>("/api/v1/notifications/read-all", { method: "POST" });
}
