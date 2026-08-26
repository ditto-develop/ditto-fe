import type { ChatMessage, ChatRoom } from "@/features/chat/model/types";
import {
  CHAT_SYSTEM_EVENT_INSUFFICIENT_MEMBERS,
  CHAT_SYSTEM_EVENT_MEMBER_LEFT,
  CHAT_SYSTEM_EVENT_USER_LEFT,
  CHAT_SYSTEM_EVENT_VOTE_CLOSED,
  CHAT_SYSTEM_EVENT_VOTE_CREATED,
} from "@/features/chat/model/types";
import type { SystemPeriod } from "@/features/system/api/systemStateApi";
import { parseServerDateTime } from "@/shared/lib/serverDateTime";

/**
 * 방 상태. 서버는 status를 내려주지 않는다 — isEnded와 opensAt으로 FE가 파생한다.
 *
 * - BEFORE_OPEN: 방은 만들어졌지만 아직 금요일이 오지 않았다. 전송·구독이 막힌다(7005).
 * - OPEN: 대화 가능.
 * - ENDED: 기한 만료 또는 사용자 종료. 전송·구독이 막힌다(7004).
 *
 * 개방 여부는 시각만으로 판정하지 않는다 — 어드민 '시간 임시 조정'이 걸리면 서버 기간이
 * 실제 요일과 어긋나므로 serverPeriod를 함께 본다(deriveRoomState 참고).
 */
export type ChatRoomState = "BEFORE_OPEN" | "OPEN" | "ENDED";

/**
 * 개방·만료는 1분 주기 스케줄러가 처리한다. opensAt이 막 지난 직후 최대 1분간은
 * 서버가 아직 '개방 전'으로 판정해 전송·구독을 막는다.
 * 화면만 먼저 열어 두면 그 사이 보낸 메시지가 조용히 사라지므로, 그만큼 늦게 연다.
 */
const SCHEDULER_LAG_MS = 60 * 1000;

/**
 * @param now 생략하면 현재 시각. 렌더 중 `Date.now()`를 부르지 않도록 호출부는 대개 비워 둔다.
 * @param serverPeriod `GET /api/v1/system/state`의 기간. 어드민 시각 오버라이드가 반영된 값이다.
 *   모르면(null) 클라이언트 시계만으로 판정한다.
 */
export function deriveRoomState(
  room: Pick<ChatRoom, "isEnded" | "opensAt" | "expiresAt">,
  now: number = Date.now(),
  serverPeriod: SystemPeriod | null = null,
): ChatRoomState {
  if (room.isEnded) return "ENDED";

  // 서버가 아직 마감을 돌리지 않았어도 만료 시각이 지났으면 종료로 본다.
  const expiresAt = parseServerDateTime(room.expiresAt);
  if (expiresAt && expiresAt.getTime() <= now) return "ENDED";

  const opensAt = parseServerDateTime(room.opensAt);
  if (opensAt && now < opensAt.getTime() + SCHEDULER_LAG_MS) {
    // 어드민 시각 오버라이드가 걸리면 서버는 이미 대화 기간인데 opensAt은 실제 금요일 그대로다.
    // 클라 시계가 opensAt 이전인데 서버가 CHATTING_PERIOD라고 하면 오버라이드 상태이므로 서버를 따른다.
    // 자연스러운 금요일 전환(now가 opensAt 직후)은 여기 해당하지 않아 스케줄러 지연 보호가 유지된다.
    const openedByOverride = serverPeriod === "CHATTING_PERIOD" && now < opensAt.getTime();
    if (!openedByOverride) return "BEFORE_OPEN";
  }

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

/** 종료된 방의 안내 문구. 사용자 종료·인원 부족 해체·기한 만료를 구분한다. */
export function getRoomEndedMessage(
  room: Pick<ChatRoom, "endedReason">,
): string {
  if (room.endedReason === "USER_ENDED") return "대화가 종료되어 메시지를 보낼 수 없어요.";
  // 그룹 전용 — 이탈로 잔여 1명이 되는 순간 서버가 방을 해체한다.
  if (room.endedReason === "INSUFFICIENT_MEMBERS") return "인원이 부족해 대화가 종료되었어요.";
  return "대화 기간이 끝나 메시지를 보낼 수 없어요.";
}

/**
 * 종료 안내(SYSTEM) 메시지의 표시 문구.
 * content에는 사건 코드가 오고, senderId가 종료를 누른 회원이다.
 * 모르는 코드는 null을 돌려준다 — 값이 추가될 수 있으므로 그리지 않고 넘긴다.
 */
export function getSystemMessageText(
  message: Pick<ChatMessage, "content">,
  isMine: boolean,
  /** MEMBER_LEFT의 senderId(나간 회원) 닉네임. 모르면 이름 없이 안내한다. */
  senderNickname?: string,
): string | null {
  if (message.content === "채팅을 종료했습니다.") return message.content;
  if (message.content === "상대방이 채팅을 종료했습니다.") return message.content;

  if (message.content === CHAT_SYSTEM_EVENT_USER_LEFT) {
    return isMine ? "채팅을 종료했습니다." : "상대방이 채팅을 종료했습니다.";
  }

  // 그룹 이탈. USER_LEFT와 달리 **방은 계속된다** — 종료 문구를 쓰면 안 된다.
  if (message.content === CHAT_SYSTEM_EVENT_MEMBER_LEFT) {
    if (isMine) return "대화방에서 나갔어요.";
    return senderNickname
      ? `${senderNickname}님이 대화방에서 나갔어요.`
      : "한 명이 대화방에서 나갔어요.";
  }

  if (message.content === CHAT_SYSTEM_EVENT_INSUFFICIENT_MEMBERS) {
    return "인원이 부족해 대화가 종료되었어요.";
  }

  return null;
}

/** 투표 SYSTEM 메시지에서 뽑아낸 사건. 그 외 메시지는 null이다. */
export type VoteSystemEvent = {
  code: typeof CHAT_SYSTEM_EVENT_VOTE_CREATED | typeof CHAT_SYSTEM_EVENT_VOTE_CLOSED;
  voteId: number;
};

/**
 * `VOTE_CREATED:41` 처럼 **투표 코드에만 붙는 `:{voteId}` 접미**를 가른다.
 * 다른 SYSTEM 코드에는 접미가 없으므로 콜론이 없으면 그대로 null이다.
 * 모르는 코드는 무시한다 — 값이 추가될 수 있다.
 */
export function parseVoteSystemMessage(
  message: Pick<ChatMessage, "messageType" | "content">,
): VoteSystemEvent | null {
  if (message.messageType !== "SYSTEM") return null;

  const separatorIndex = message.content.indexOf(":");
  if (separatorIndex < 0) return null;

  const code = message.content.slice(0, separatorIndex);
  if (code !== CHAT_SYSTEM_EVENT_VOTE_CREATED && code !== CHAT_SYSTEM_EVENT_VOTE_CLOSED) {
    return null;
  }

  const voteId = Number(message.content.slice(separatorIndex + 1));
  if (!Number.isInteger(voteId)) return null;

  return { code, voteId };
}

export function isRoomEndedSystemMessage(
  message: Pick<ChatMessage, "messageType" | "content">,
): boolean {
  if (message.messageType !== "SYSTEM") return false;

  // MEMBER_LEFT는 **의도적으로 빠져 있다** — 그룹에서 한 명이 나가도 방은 계속된다.
  return (
    message.content === CHAT_SYSTEM_EVENT_USER_LEFT ||
    message.content === CHAT_SYSTEM_EVENT_INSUFFICIENT_MEMBERS ||
    message.content === "채팅을 종료했습니다." ||
    message.content === "상대방이 채팅을 종료했습니다."
  );
}
