import { isRoomEnded } from "@/features/chat/lib/roomState";
import type { ChatRoom } from "@/features/chat/model/types";

/**
 * 하단 탭 '대화방' 배지가 읽는 안읽은 메시지 총합.
 *
 * 목록 화면(useChatRooms)과 배지(useChatUnreadTotal)가 각자 방 목록을 부르면 같은 데이터를
 * 두 번 받아 오는 데다, 방에 들어갔다 나온 직후 둘이 서로 다른 숫자를 보여 준다. 그래서 값
 * 하나를 모듈에 두고 목록이 읽을 때마다 여기에 밀어 넣는다 — 배지는 구독만 한다.
 *
 * 전역 상태 라이브러리를 새로 들이지 않기 위한 최소 구현이다(CLAUDE.md §8).
 */

let total = 0;
const listeners = new Set<() => void>();

/** useSyncExternalStore 규약상 같은 값이면 같은 참조를 돌려줘야 한다. */
export function getChatUnreadTotal(): number {
  return total;
}

export function subscribeChatUnread(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setChatUnreadTotal(next: number): void {
  const normalized = Number.isFinite(next) && next > 0 ? Math.floor(next) : 0;
  if (normalized === total) return;
  total = normalized;
  listeners.forEach((listener) => listener());
}

/**
 * 방 목록에서 총합을 계산해 반영한다.
 *
 * 종료된 방은 빼는데, 종료 안내(SYSTEM)가 unreadCount 에 들어가 끝난 방이 영영 1 을 달고
 * 남기 때문이다 — 목록 줄의 배지(ChatRoomListItem)도 같은 이유로 같은 판정을 쓴다.
 * 둘이 갈리면 탭에는 1 이 붙었는데 목록에는 아무 방도 배지가 없는 상태가 된다.
 */
export function setChatUnreadFromRooms(rooms: ChatRoom[]): void {
  setChatUnreadTotal(
    rooms.reduce((sum, room) => (isRoomEnded(room) ? sum : sum + (room.unreadCount ?? 0)), 0),
  );
}
