import type { ChatMessage, ChatRoom } from "@/features/chat/model/types";
import { CHAT_SYSTEM_EVENT_USER_LEFT } from "@/features/chat/model/types";
import { parseServerDateTime } from "@/shared/lib/serverDateTime";

/**
 * 방 상태. 서버는 status를 내려주지 않는다 — isEnded와 opensAt으로 FE가 파생한다.
 *
 * - BEFORE_OPEN: 방은 만들어졌지만 아직 금요일이 오지 않았다. 전송·구독이 막힌다(7005).
 * - OPEN: 대화 가능.
 * - ENDED: 기한 만료 또는 사용자 종료. 전송·구독이 막힌다(7004).
 */
export type ChatRoomState = "BEFORE_OPEN" | "OPEN" | "ENDED";

/**
 * 개방·만료는 1분 주기 스케줄러가 처리한다. opensAt이 막 지난 직후 최대 1분간은
 * 서버가 아직 '개방 전'으로 판정해 전송·구독을 막는다.
 * 화면만 먼저 열어 두면 그 사이 보낸 메시지가 조용히 사라지므로, 그만큼 늦게 연다.
 */
const SCHEDULER_LAG_MS = 60 * 1000;

export function deriveRoomState(
  room: Pick<ChatRoom, "isEnded" | "opensAt" | "expiresAt">,
  now: number = Date.now(),
): ChatRoomState {
  if (room.isEnded) return "ENDED";

  // 서버가 아직 마감을 돌리지 않았어도 만료 시각이 지났으면 종료로 본다.
  const expiresAt = parseServerDateTime(room.expiresAt);
  if (expiresAt && expiresAt.getTime() <= now) return "ENDED";

  const opensAt = parseServerDateTime(room.opensAt);
  if (opensAt && now < opensAt.getTime() + SCHEDULER_LAG_MS) return "BEFORE_OPEN";

  return "OPEN";
}

export function isRoomEnded(
  room: Pick<ChatRoom, "isEnded" | "opensAt" | "expiresAt">,
  now?: number,
): boolean {
  return deriveRoomState(room, now) === "ENDED";
}

/**
 * 목록·홈 카드의 마지막 메시지 미리보기.
 * IMAGE의 content는 S3 objectKey라 그대로 노출하면 안 된다.
 */
export function getLastMessagePreview(
  room: Pick<ChatRoom, "lastMessage">,
): string | undefined {
  const last = room.lastMessage;
  if (!last) return undefined;
  if (last.messageType === "IMAGE") return "사진을 보냈어요.";
  return last.content;
}

/** 종료된 방의 안내 문구. 사용자 종료와 기한 만료를 구분한다. */
export function getRoomEndedMessage(
  room: Pick<ChatRoom, "endedReason">,
): string {
  return room.endedReason === "USER_ENDED"
    ? "대화가 종료되어 메시지를 보낼 수 없어요."
    : "대화 기간이 끝나 메시지를 보낼 수 없어요.";
}

/**
 * 종료 안내(SYSTEM) 메시지의 표시 문구.
 * content에는 사건 코드가 오고, senderId가 종료를 누른 회원이다.
 * 모르는 코드는 null을 돌려준다 — 값이 추가될 수 있으므로 그리지 않고 넘긴다.
 */
export function getSystemMessageText(
  message: Pick<ChatMessage, "content">,
  isMine: boolean,
): string | null {
  if (message.content === "채팅을 종료했습니다.") return message.content;
  if (message.content === "상대방이 채팅을 종료했습니다.") return message.content;
  if (message.content !== CHAT_SYSTEM_EVENT_USER_LEFT) return null;

  return isMine ? "채팅을 종료했습니다." : "상대방이 채팅을 종료했습니다.";
}

export function isRoomEndedSystemMessage(
  message: Pick<ChatMessage, "messageType" | "content">,
): boolean {
  if (message.messageType !== "SYSTEM") return false;

  return (
    message.content === CHAT_SYSTEM_EVENT_USER_LEFT ||
    message.content === "채팅을 종료했습니다." ||
    message.content === "상대방이 채팅을 종료했습니다."
  );
}
