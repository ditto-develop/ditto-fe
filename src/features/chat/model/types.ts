export type ChatMessageType = "TEXT" | "IMAGE" | "SYSTEM";

/**
 * 방의 원본 유형. 1:1·그룹·재매칭 모두 같은 방 계약을 쓴다.
 * 그룹 방은 정원이 차면, 재매칭 방은 성사 후 스케줄러가 서버에서 자동 생성한다.
 */
export type ChatRoomSourceType = "PERSONAL" | "GROUP" | "REMATCH";

/**
 * 종료 사유. 기한 만료(EXPIRED)에는 SYSTEM 메시지도 실시간 이벤트도 없어서
 * FE가 expiresAt으로 직접 감지해야 한다.
 *
 * INSUFFICIENT_MEMBERS는 그룹 전용이다 — 이탈로 잔여 1명이 되는 순간 서버가 방을 해체한다
 * (2명까지는 유지). MEMBER_LEFT 1건 + INSUFFICIENT_MEMBERS 1건이 연달아 발행된다.
 */
export type ChatRoomEndedReason = "EXPIRED" | "USER_ENDED" | "INSUFFICIENT_MEMBERS";

/**
 * SYSTEM 메시지의 content는 완성된 문장이 아니라 사건 코드다.
 * 같은 사건도 보는 사람에 따라 문구가 달라져서 FE가 senderId로 갈라 만든다.
 * 값은 추가될 수 있으니 모르는 코드는 무시한다.
 */
export const CHAT_SYSTEM_EVENT_USER_LEFT = "USER_LEFT";

/**
 * 그룹 방에서 한 명이 나갔다. **방은 계속된다** — USER_LEFT와 정반대이므로
 * 방 종료 판정(isRoomEndedSystemMessage)에 넣으면 안 된다.
 */
export const CHAT_SYSTEM_EVENT_MEMBER_LEFT = "MEMBER_LEFT";

/** 이탈로 잔여 1명이 되어 방이 해체됐다. 이건 종료 이벤트다. */
export const CHAT_SYSTEM_EVENT_INSUFFICIENT_MEMBERS = "INSUFFICIENT_MEMBERS";

/**
 * 투표 사건 코드. 다른 SYSTEM 코드와 달리 `:{voteId}` 접미가 붙는다
 * (`VOTE_CREATED:41`). 콜론 1회 split으로 코드와 id를 가른다 — parseVoteSystemMessage.
 */
export const CHAT_SYSTEM_EVENT_VOTE_CREATED = "VOTE_CREATED";
export const CHAT_SYSTEM_EVENT_VOTE_CLOSED = "VOTE_CLOSED";

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
  /**
   * 내가 이 방을 나갔는지. 이탈해도 방은 목록에 읽기 전용으로 남는다.
   * 이탈자 기준으로 counterpartMemberIds에서도 빠진다.
   */
  hasLeft: boolean;
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

/* ────────────────────────── 그룹 만남 투표 ──────────────────────────
 *
 * 그룹 방에서 만날 장소·시간을 정하는 투표. 방당 열린 투표는 하나뿐이다.
 * 선택지는 생성 시 확정되며 이후 추가·삭제가 없다(선택지 추가 API는 만들지 않기로 확정).
 *
 * 서버는 승자·득표율을 계산하지 않는다 — voterIds와 입력 순 배열만 내려주고
 * 1위·동표 판정은 FE가 한다(features/chat/lib/voteResult.ts).
 */

export type GroupVoteStatus = "OPEN" | "CLOSED";

export type VotePlaceOption = {
  optionId: number;
  /** 상호명. */
  label: string;
  /** 직접 입력한 장소면 아래 4개가 전부 null이다. */
  address: string | null;
  mapLink: string | null;
  latitude: number | null;
  longitude: number | null;
  /** 이 선택지를 고른 활성 멤버의 회원 ID. 닉네임·프로필 매핑은 FE 몫이다. */
  voterIds: number[];
};

export type VoteTimeOption = {
  optionId: number;
  /** `yyyy-MM-dd HH:mm:ss`. 서버는 표시 문구(dateLabel)를 저장하지 않는다. */
  meetAt: string;
  voterIds: number[];
};

/** 내 표. 한 표도 던지지 않았으면 상세 응답에서 이 값이 통째로 null이다. */
export type MyVote = {
  placeIds: number[];
  timeIds: number[];
};

/** 투표 다섯 엔드포인트(목록·상세·생성·cast·close)가 모두 이 형태를 돌려준다. */
export type GroupVote = {
  voteId: number;
  roomId: number;
  status: GroupVoteStatus;
  /** 장소·시간 공통. false면 유형별 1개까지(초과 시 8207). */
  allowMultiple: boolean;
  /** 투표를 만든 회원 ID. 프로필은 FE가 붙인다. */
  createdBy: number;
  createdAt: string;
  /** 진행 중이면 null. */
  closedAt: string | null;
  /** 진행 카운터의 분모 — 이탈하지 않은 멤버 수. */
  totalMembers: number;
  /** 장소·시간 중 하나라도 표를 던진 활성 멤버 수. */
  votedCount: number;
  /** 입력 순. 동표일 때 이 순서가 곧 노출 순서다. */
  placeOptions: VotePlaceOption[];
  timeOptions: VoteTimeOption[];
  myVote: MyVote | null;
};

/** POST 요청 본문의 장소 선택지. 상호명만 필수다. */
export type CreateVotePlaceOption = {
  /** 최대 100자. 공백 제거 + 대소문자 무시 기준으로 요청 안 중복이면 8205. */
  label: string;
  /** 최대 200자. */
  address?: string;
  /** 최대 500자. */
  mapLink?: string;
  latitude?: number;
  longitude?: number;
};

/** 시간은 `meetAt` 단일 필드다. date/time 분리가 아니다. 초 이하는 서버가 버린다. */
export type CreateVoteTimeOption = {
  /** `yyyy-MM-dd HH:mm:ss` */
  meetAt: string;
};

/** POST /api/v1/chat/rooms/{roomId}/votes. 장소·시간 각 2~10개. */
export type CreateGroupVoteRequest = {
  allowMultiple: boolean;
  placeOptions: CreateVotePlaceOption[];
  timeOptions: CreateVoteTimeOption[];
};

/**
 * POST .../cast 본문.
 * **요청에 담긴 집합이 그 회원의 최종 선택이다(치환).** 덧붙이는 방식이 아니므로
 * 재투표할 때도 유지할 기존 선택을 반드시 포함해서 보낸다. 빈 배열은 해당 유형 표 취소.
 */
export type CastVoteRequest = {
  placeIds: number[];
  timeIds: number[];
};
