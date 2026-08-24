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

/**
 * 탭했을 때 갈 곳.
 *
 * 서버는 완성된 경로가 아니라 `type` + `targetId`만 준다. targetId가 무엇을
 * 가리키는지는 type이 정하는데, 채팅 계열(방 ID) 외에는 계약이 확정돼 있지 않다.
 * 그래서 확정된 것만 정확히 보내고 나머지는 해당 목록 화면으로 보낸다.
 * 모르는 type은 이동하지 않는다(null).
 */
export function toNotificationTarget(
  item: NotificationItem,
): { kind: "path"; path: string } | { kind: "chatRoom"; roomId: number } | null {
  switch (item.type) {
    case "MATCH_RESULT":
      return { kind: "path", path: "/matching" };
    case "GROUP_FORMED":
    case "REMATCH_MATCHED":
    case "REVIEW_REQUEST":
      // 그룹 구성·재매칭 성사·평가 요청의 targetId 의미가 확정되지 않았다.
      // 대화방 목록에는 방별 진입점과 '평가하기'가 함께 붙어 있으므로 목록으로 보낸다.
      return { kind: "path", path: "/chat" };
    case "CHAT_MESSAGE":
    case "CHAT_ENDING_SOON":
      // 채팅 계열의 targetId는 방 ID다. 1:1인지 그룹인지는 방 목록에서 판별한다.
      return item.targetId === null
        ? { kind: "path", path: "/chat" }
        : { kind: "chatRoom", roomId: item.targetId };
    case "SYSTEM_NOTICE":
    default:
      return null;
  }
}
