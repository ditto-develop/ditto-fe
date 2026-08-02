import type {
  NotificationFilter,
  NotificationType,
} from "@/features/notification/model/types";
import type { IconName } from "@/shared/ui";

/** Figma 7.2 [2508:31674] — 행별 leading 아이콘. */
export const NOTIFICATION_ICON: Record<NotificationType, IconName> = {
  MATCH_RESULT: "notification.heart",
  NEW_MESSAGE: "notification.message",
  GROUP_FORMED: "notification.people",
  VOTE_RESULT: "notification.pin",
  RATING_REQUEST: "notification.star",
  REMATCH_SUCCESS: "notification.rematch",
  CHAT_CLOSING: "notification.clock",
  APP_UPDATE: "notification.bell",
};

/** 필터 탭 분류. `ALL`은 필터링하지 않으므로 표에 없다. */
export const NOTIFICATION_CATEGORY: Record<
  NotificationType,
  Exclude<NotificationFilter, "ALL">
> = {
  MATCH_RESULT: "MATCHING",
  GROUP_FORMED: "MATCHING",
  REMATCH_SUCCESS: "MATCHING",
  NEW_MESSAGE: "CHAT",
  VOTE_RESULT: "CHAT",
  CHAT_CLOSING: "CHAT",
  RATING_REQUEST: "SYSTEM",
  APP_UPDATE: "SYSTEM",
};

export const NOTIFICATION_FILTERS: { value: NotificationFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "MATCHING", label: "매칭" },
  { value: "CHAT", label: "대화" },
  { value: "SYSTEM", label: "시스템" },
];
