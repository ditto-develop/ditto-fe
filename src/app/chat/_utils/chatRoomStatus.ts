type ChatRoomStatusLike = {
  expiresAt?: string | null;
  status?: string | null;
  state?: string | null;
  endedAt?: string | null;
  closedAt?: string | null;
  leftAt?: string | null;
  partnerLeftAt?: string | null;
  opponentLeftAt?: string | null;
  otherParticipantLeftAt?: string | null;
  endedByUserId?: string | null;
  closedByUserId?: string | null;
  leftUserIds?: string[] | null;
  canSendMessage?: boolean | null;
  isEnded?: boolean | null;
  isClosed?: boolean | null;
  isPartnerLeft?: boolean | null;
  isOpponentLeft?: boolean | null;
  endReason?: string | null;
  endedReason?: string | null;
};

export type ChatRoomEndState = {
  isEnded: boolean;
  isPartnerLeft: boolean;
  isExpired: boolean;
  message: string;
};

const ENDED_STATUSES = new Set(["ENDED", "CLOSED", "LEFT", "INACTIVE", "EXPIRED"]);

export function getChatRoomEndState(
  room: ChatRoomStatusLike | null | undefined,
  currentUserId?: string | null
): ChatRoomEndState {
  if (!room) {
    return {
      isEnded: false,
      isPartnerLeft: false,
      isExpired: false,
      message: "",
    };
  }

  const status = (room.status ?? room.state ?? "").toUpperCase();
  const reason = (room.endedReason ?? room.endReason ?? "").toUpperCase();
  const isExpired = !!room.expiresAt && new Date(room.expiresAt) < new Date();
  const endedByUserId = room.endedByUserId ?? room.closedByUserId ?? null;
  const isPartnerLeft =
    room.isPartnerLeft === true ||
    room.isOpponentLeft === true ||
    !!room.partnerLeftAt ||
    !!room.opponentLeftAt ||
    !!room.otherParticipantLeftAt ||
    reason.includes("PARTNER") ||
    reason.includes("OPPONENT") ||
    (!!endedByUserId && !!currentUserId && endedByUserId !== currentUserId) ||
    (!!currentUserId && (room.leftUserIds ?? []).some((userId) => userId !== currentUserId));

  const isEnded =
    isExpired ||
    room.isEnded === true ||
    room.isClosed === true ||
    ENDED_STATUSES.has(status) ||
    !!room.endedAt ||
    !!room.closedAt ||
    !!room.leftAt ||
    room.canSendMessage === false ||
    isPartnerLeft;

  return {
    isEnded,
    isPartnerLeft,
    isExpired,
    message: isPartnerLeft
      ? "상대방이 채팅을 종료했습니다."
      : "대화가 종료되어 메시지를 보낼 수 없어요.",
  };
}
