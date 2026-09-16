import {
  CHAT_SYSTEM_EVENT_INSUFFICIENT_MEMBERS,
  CHAT_SYSTEM_EVENT_MEMBER_LEFT,
  CHAT_SYSTEM_EVENT_USER_LEFT,
  CHAT_SYSTEM_EVENT_VOTE_CLOSED,
  CHAT_SYSTEM_EVENT_VOTE_CREATED,
} from "@/features/chat/model/types";

const VOTE_CREATED_PREVIEW = "투표가 생성되었습니다!";

/**
 * SYSTEM 메시지 코드 → 목록 미리보기 문구.
 *
 * 방 안(`getSystemMessageText`)과 달리 **주어를 쓰지 않는다** — 목록에는 isMine 판정도
 * 나간 사람의 닉네임도 없다. "OO님이"를 쓰려면 방마다 프로필을 더 받아와야 하는데,
 * 한 줄 미리보기가 그만한 값을 하지 않는다.
 */
const SYSTEM_EVENT_PREVIEW: Record<string, string> = {
  [CHAT_SYSTEM_EVENT_USER_LEFT]: "대화가 종료되었어요.",
  [CHAT_SYSTEM_EVENT_MEMBER_LEFT]: "대화방에서 나갔어요.",
  [CHAT_SYSTEM_EVENT_INSUFFICIENT_MEMBERS]: "인원이 부족해 대화가 종료되었어요.",
  [CHAT_SYSTEM_EVENT_VOTE_CREATED]: VOTE_CREATED_PREVIEW,
  [CHAT_SYSTEM_EVENT_VOTE_CLOSED]: "투표가 마감되었어요.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isVoteOpenedPayload(value: unknown): boolean {
  if (!isRecord(value)) return false;

  return (
    typeof value.voteId === "string" &&
    isRecord(value.placeSummary) &&
    isRecord(value.timeSummary)
  );
}

/**
 * 투표 코드에만 붙는 `:{voteId}` 접미를 떼어 코드만 남긴다.
 * 다른 코드에는 접미가 없으므로 콜론이 없으면 원문 그대로다.
 */
function toEventCode(content: string): string {
  const separatorIndex = content.indexOf(":");
  return separatorIndex < 0 ? content : content.slice(0, separatorIndex);
}

/**
 * 대화방 목록·홈 카드의 마지막 메시지 한 줄.
 *
 * SYSTEM 메시지의 `content`는 사람이 읽는 문장이 아니라 **사건 코드**다(`MEMBER_LEFT` 등).
 * 그대로 내보내면 목록에 코드가 노출되므로 여기서 문구로 바꾼다.
 * 모르는 코드는 원문을 유지한다 — 일반 텍스트 메시지가 대부분이고, 새 코드가 생겨도
 * 빈 줄보다는 원문이 낫다.
 */
export function formatChatMessagePreview(content?: string | null): string {
  if (!content) return "";

  try {
    const parsed: unknown = JSON.parse(content);
    if (isVoteOpenedPayload(parsed)) {
      return VOTE_CREATED_PREVIEW;
    }
  } catch {
    // JSON이 아니면 코드 또는 일반 텍스트다. 아래에서 이어 판정한다.
  }

  return SYSTEM_EVENT_PREVIEW[toEventCode(content)] ?? content;
}
