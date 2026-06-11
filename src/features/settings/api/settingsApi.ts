import { externalApiFetch } from "@/shared/lib/api/externalClient";
import type { BlockedUser, NotificationSettings } from "@/features/settings/model/types";

export function getNotificationSettings(): Promise<NotificationSettings> {
  return externalApiFetch<NotificationSettings>("/api/v1/users/me/notification-settings");
}

export function updateNotificationSettings(
  patch: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  return externalApiFetch<NotificationSettings>("/api/v1/users/me/notification-settings", {
    method: "PATCH",
    body: patch,
  });
}

export function getBlockedUsers(): Promise<BlockedUser[]> {
  return externalApiFetch<BlockedUser[]>("/api/v1/users/me/blocks");
}

export function unblockUser(id: string): Promise<null> {
  return externalApiFetch<null>(`/api/v1/users/me/blocks/${id}`, {
    method: "DELETE",
  });
}
