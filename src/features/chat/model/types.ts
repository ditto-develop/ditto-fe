export type ChatMessageType = "TEXT" | "IMAGE" | "SYSTEM";

/** PERSONAL만 실시간 지원. GROUP은 응답 구조만 대비돼 있고 아직 미지원이다. */
export type ChatRoomType = "PERSONAL" | "GROUP";

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

export type ChatRoom = {
  roomId: number;
  roomType: ChatRoomType;
  /** 나를 제외한 참여 회원. 1:1이면 1명. */
  counterpartMemberIds: number[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
  createdAt: string;
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
