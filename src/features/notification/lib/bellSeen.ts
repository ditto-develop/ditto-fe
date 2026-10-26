import { isUnread } from "@/features/notification/model/notificationMeta";
import type { NotificationItem } from "@/features/notification/model/types";
import { getMyMemberId } from "@/shared/lib/auth";

/**
 * 홈 벨 레드닷의 "여기까지 봤다" 표시 — 마지막으로 벨을 누르거나 알림 센터를 열었을 때의
 * 가장 최근 알림 id.
 *
 * 레드닷은 안 읽은 알림이 있다는 표시가 아니라 **그 뒤로 새 알림이 왔다**는 표시다
 * (QA 2026-10-26: 벨을 누르면 사라져야 한다). 알림 하나하나의 읽음은 서버 readAt 이
 * 그대로 맡고, 여기는 이 기기의 벨 표시만 다룬다. 알림 id 는 서버 시퀀스라 늘기만 한다.
 *
 * 계정마다 따로 둔다. 알림 id 는 회원 사이에 공유되는 번호라, 한 기기에서 계정을 바꾸면
 * 앞 계정의 값이 다음 계정의 알림을 "본 것"으로 가린다.
 */
const KEY_PREFIX = "ditto.notificationBellSeenId";

function storageKey(): string {
  const memberId = getMyMemberId();
  return memberId === null ? KEY_PREFIX : `${KEY_PREFIX}.${memberId}`;
}

/** 저장소를 못 읽으면(프라이빗 창 등) 0 — 안 읽은 새 알림이 있으면 점이 뜬다. */
export function readBellSeenId(): number {
  try {
    const stored = Number(window.localStorage.getItem(storageKey()));
    return Number.isFinite(stored) ? stored : 0;
  } catch {
    return 0;
  }
}

/** 더 큰 id 로만 올린다. 늦게 도착한 옛 목록이 방금 올린 값을 되돌리지 않게 한다. */
export function markBellSeen(newestId: number): void {
  if (!Number.isFinite(newestId) || newestId <= readBellSeenId()) return;
  try {
    window.localStorage.setItem(storageKey(), String(newestId));
  } catch {
    // 저장에 실패하면 다음 진입에 점이 다시 뜰 뿐이다. 화면을 막을 일은 아니다.
  }
}

/** 목록에서 가장 최근 알림 id. 비어 있으면 0. */
export function newestNotificationId(items: NotificationItem[]): number {
  return items.reduce((newest, item) => Math.max(newest, item.id), 0);
}

/** 마지막으로 본 뒤에 온 알림 중 아직 안 읽은 것이 있는가 — 벨 레드닷 조건. */
export function hasNewUnreadSince(items: NotificationItem[], seenId: number): boolean {
  return items.some((item) => item.id > seenId && isUnread(item));
}
