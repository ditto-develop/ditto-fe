import { externalApiFetch } from "@/shared/lib/api/externalClient";
import type { BlockedUser, NotificationSettings } from "@/features/settings/model/types";

/**
 * GET /api/v1/users/me/blocks 원형(BlockedMemberResponse).
 * id는 차단 레코드가 아니라 차단된 회원 ID(int64)이며, 해제 API 경로에 그대로 쓴다.
 */
type ExternalBlockedMember = {
  id: number | string;
  nickname: string;
  profileImageUrl?: string | null;
  blockedAt: string;
};

function toBlockedUser(raw: ExternalBlockedMember): BlockedUser {
  return {
    id: String(raw.id),
    nickname: raw.nickname,
    profileImageUrl: raw.profileImageUrl ?? null,
    blockedAt: raw.blockedAt,
  };
}

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
  return externalApiFetch<ExternalBlockedMember[]>("/api/v1/users/me/blocks").then((members) =>
    (members ?? []).map(toBlockedUser),
  );
}

/** 멱등 — 차단하지 않은 상대를 해제해도 성공한다. */
export function unblockUser(id: string): Promise<null> {
  return externalApiFetch<null>(`/api/v1/users/me/blocks/${id}`, {
    method: "DELETE",
  });
}
