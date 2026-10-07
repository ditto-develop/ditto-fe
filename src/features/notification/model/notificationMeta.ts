import type {
  NotificationFilter,
  NotificationItem,
} from "@/features/notification/model/types";
import type { IconName } from "@/shared/ui";

/**
 * 행별 leading 아이콘. Figma 7.2 [2508:31674].
 *
 * 서버 `type` enum은 늘어난다. 표에 없는 값은 기본 아이콘으로 폴백하며,
 * 절대 렌더를 건너뛰지 않는다(BE 위키 명시 — 건너뛰면 알림이 그냥 사라진다).
 */
const NOTIFICATION_ICON: Record<string, IconName> = {
  MATCH_RESULT: "notification.heart",
  GROUP_FORMED: "notification.people",
  REMATCH_MATCHED: "notification.rematch",
  REVIEW_REQUEST: "notification.star",
  REVIEW_REMINDER: "notification.star",
  CHAT_MESSAGE: "notification.message",
  CHAT_ENDING_SOON: "notification.clock",
  SYSTEM_NOTICE: "notification.bell",
};

/** 모르는 type의 기본 아이콘. */
const FALLBACK_ICON: IconName = "notification.bell";

export function toNotificationIcon(type: string): IconName {
  return NOTIFICATION_ICON[type] ?? FALLBACK_ICON;
}

export const NOTIFICATION_FILTERS: { value: NotificationFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "MATCHING", label: "매칭" },
  { value: "CHAT", label: "대화" },
  { value: "SYSTEM", label: "시스템" },
];

/** 안 읽음 여부는 `readAt`이 null인지로 판단한다(스펙 명시). */
export function isUnread(item: NotificationItem): boolean {
  return item.readAt === null;
}
