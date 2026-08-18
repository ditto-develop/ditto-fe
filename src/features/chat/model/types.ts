export type ChatMessageType = "TEXT" | "IMAGE" | "SYSTEM";

/**
 * 방의 원본 유형. 1:1·그룹·재매칭 모두 같은 방 계약을 쓴다.
 * 그룹 방은 정원이 차면, 재매칭 방은 성사 후 스케줄러가 서버에서 자동 생성한다.
 */
export type ChatRoomSourceType = "PERSONAL" | "GROUP" | "REMATCH";

/**
 * 종료 사유. 기한 만료(EXPIRED)에는 SYSTEM 메시지도 실시간 이벤트도 없어서
 * FE가 expiresAt으로 직접 감지해야 한다.
 */
export type ChatRoomEndedReason = "EXPIRED" | "USER_ENDED";

/**
 * SYSTEM 메시지의 content는 완성된 문장이 아니라 사건 코드다.
 * 같은 사건도 보는 사람에 따라 문구가 달라져서 FE가 senderId로 갈라 만든다.
 * 값은 추가될 수 있으니 모르는 코드는 무시한다.
 */
export const CHAT_SYSTEM_EVENT_USER_LEFT = "USER_LEFT";

/** GET /api/v1/chat/rooms/{roomId}/messages, STOMP 수신 payload 공통 형태. */
export type ChatMessage = {
  id: number;
  roomId: number;
  senderId: number;
  messageType: ChatMessageType;
  /** TEXT는 본문, IMAGE는 S3 objectKey. */
  content: string;
  /** IMAGE 열람용 presigned URL. 그 외에는 null. 표시는 항상 이 값을 쓴다. */
  imageUrl: string | null;
  /** yyyy-MM-dd HH:mm:ss */
  createdAt: string;
};

export type ChatMessagesPage = {
  /** id DESC(최신 먼저). 화면에는 역순으로 쌓는다. */
  messages: ChatMessage[];
  /** 더 없으면 null. 위로 스크롤 시 cursor로 전달. */
  nextCursor: number | null;
};

/**
 * GET /api/v1/chat/rooms 항목. 방 상세 조회 API가 없어 이 목록이 방 메타의 유일한 출처다.
 * 개방 전·종료된 방도 목록에서 빠지지 않으므로 상태 분기는 FE가 파생한다(deriveRoomState).
 */
export type ChatRoom = {
  roomId: number;
  sourceType: ChatRoomSourceType;
  /** 나를 제외한 참여 회원. 1:1·재매칭이면 1명, 그룹이면 여러 명. */
  counterpartMemberIds: number[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
  createdAt: string;
  /** 개방 시각(금요일 00:00). 이 시각 전에는 전송·구독이 막힌다. */
  opensAt: string | null;
  /** 자동 종료 예정 시각. 남은 시간 카운트다운의 기준. */
  expiresAt: string | null;
  isEnded: boolean;
  /** 종료된 방에만 값이 있다. */
  endedAt: string | null;
  endedReason: ChatRoomEndedReason | null;
};

/** 상대 프로필을 붙인 목록 아이템. 방 목록 응답에는 닉네임/이미지가 없어 별도 조회한다. */
export type ChatRoomWithCounterpart = ChatRoom & {
  counterpartNickname: string;
  counterpartProfileImageUrl: string | null;
};

/** POST /api/v1/chat/rooms/{roomId}/image-upload-urls */
export type ChatImageUploadFileRequest = {
  contentType: string;
  /** byte 단위. 최대 10MB. */
  contentLength: number;
};

export type ChatImageUploadUrl = {
  objectKey: string;
  uploadUrl: string;
};

export type ChatImageUploadUrlsResponse = {
  uploads: ChatImageUploadUrl[];
};

/** STOMP SEND /pub/chat/rooms/{roomId} body. */
export type ChatOutgoingMessage = {
  /** TEXT는 본문(공백 불가·최대 1000자), IMAGE는 업로드한 objectKey. */
  content: string;
  messageType: Extract<ChatMessageType, "TEXT" | "IMAGE">;
};

export type ChatConnectionStatus = "idle" | "connecting" | "connected" | "disconnected";

export type ChatOptimisticMessage = {
  localId: string;
  content: string;
  messageType: Exclude<ChatMessageType, "SYSTEM">;
  createdAt: string;
  status: "sending" | "failed";
};

export type ChatRoomNotice = {
  message: string;
  actionLabel: string;
  onAction: () => void;
};
