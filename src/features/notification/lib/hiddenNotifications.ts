import { createHiddenItemStore } from "@/shared/lib/hiddenItemStore";

/**
 * 사용자가 알림 센터에서 치운 알림 id.
 *
 * 서버에 알림 삭제 API 가 없어 기기 로컬로만 숨긴다 — 배경과 한계는
 * `createHiddenItemStore` 주석과 docs/be-request-notification-chat-delete.md 참고.
 */
export const hiddenNotifications = createHiddenItemStore("ditto.hiddenNotificationIds");
