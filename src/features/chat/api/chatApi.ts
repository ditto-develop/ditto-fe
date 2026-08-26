import { CHAT_PAGE_SIZE } from "@/features/chat/model/constants";
import type {
  ChatImageUploadFileRequest,
  ChatImageUploadUrlsResponse,
  ChatMessagesPage,
  ChatRoom,
} from "@/features/chat/model/types";
import { externalApiFetch } from "@/shared/lib/api/externalClient";

/** 내 채팅방 목록. 최근 대화순 정렬로 내려온다. */
export async function getChatRooms(): Promise<ChatRoom[]> {
  const rooms = await externalApiFetch<ChatRoom[]>("/api/v1/chat/rooms");
  return rooms.map(normalizeRoom);
}

/**
 * 과거 메시지(커서 페이징).
 * 최초 조회는 cursor 생략, 위로 스크롤 시 직전 응답의 nextCursor를 넘긴다.
 * 응답 messages는 id DESC(최신 먼저)다.
 */
export async function getChatMessages(
  roomId: number,
  cursor?: number | null,
  size: number = CHAT_PAGE_SIZE,
): Promise<ChatMessagesPage> {
  const query = new URLSearchParams({ size: String(size) });
  if (cursor != null) query.set("cursor", String(cursor));

  const page = await externalApiFetch<ChatMessagesPage>(
    `/api/v1/chat/rooms/${roomId}/messages?${query.toString()}`,
  );

  return {
    messages: (page.messages ?? []).map(normalizeMessage),
    nextCursor: page.nextCursor ?? null,
  };
}

export function markChatRoomRead(roomId: number, lastReadMessageId: number): Promise<null> {
  return externalApiFetch<null>(`/api/v1/chat/rooms/${roomId}/read`, {
    method: "POST",
    body: { lastReadMessageId },
  });
}

/**
 * 채팅 종료. 멱등이라 여러 번 불러도 안내 메시지는 1건만 남고 최초 종료 시각이 덮이지 않는다.
 *
 * 응답 data가 비어 있어 종료를 누른 본인 화면은 서버 응답만으로 아무것도 알 수 없다.
 * 호출부가 낙관적으로 전환하거나 목록을 다시 조회해야 한다.
 *
 * 그룹 방은 이 경로로 끝낼 수 없다(7002 — 코드가 멤버십 오류와 같아 message로만 구분된다).
 * 그룹은 기한 만료로만 종료되므로 호출부에서 sourceType을 보고 막는다.
 */
export function endChatRoom(roomId: number): Promise<null> {
  return externalApiFetch<null>(`/api/v1/chat/rooms/${roomId}/end`, { method: "POST" });
}

/**
 * 채팅방 나가기. 그룹은 나만 빠지고 방은 남은 인원으로 유지된다.
 *
 * **방 유형별로 호출을 가를 필요가 없다** — 1:1·재매칭에 부르면 서버가 end와 동일하게
 * 처리한다(USER_LEFT). 그룹은 MEMBER_LEFT를 브로드캐스트하고, 이탈로 잔여 1명이 되면
 * INSUFFICIENT_MEMBERS를 한 건 더 발행하며 방을 해체한다.
 *
 * **멱등이다.** 이미 나갔거나 끝난 방에 다시 요청해도 200이라 재시도를 막을 필요가 없다.
 * 이탈 후에도 방은 목록에 읽기 전용(`hasLeft: true`)으로 남는다.
 */
export function leaveChatRoom(roomId: number): Promise<null> {
  return externalApiFetch<null>(`/api/v1/chat/rooms/${roomId}/leave`, { method: "POST" });
}

/** 1단계: 방 멤버만 발급 가능. image/*만 허용, 장당 10MB, 한 번에 최대 10장. */
export function issueChatImageUploadUrls(
  roomId: number,
  files: ChatImageUploadFileRequest[],
): Promise<ChatImageUploadUrlsResponse> {
  return externalApiFetch<ChatImageUploadUrlsResponse>(
    `/api/v1/chat/rooms/${roomId}/image-upload-urls`,
    { method: "POST", body: { files } },
  );
}

/**
 * 2단계: presigned URL에 이미지 바이트를 직접 PUT.
 * 이미지 바이트는 서버/WebSocket을 거치지 않는다(클라 ↔ S3 직접).
 */
export async function uploadChatImage(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`이미지 업로드 실패 (${response.status})`);
  }
}

/**
 * 발급 → PUT까지 처리하고 objectKey를 돌려준다.
 * 3단계(STOMP 전송)는 호출부에서 소켓으로 보낸다.
 */
export async function uploadChatImages(roomId: number, files: File[]): Promise<string[]> {
  if (files.length === 0) return [];

  const { uploads } = await issueChatImageUploadUrls(
    roomId,
    files.map((file) => ({ contentType: file.type, contentLength: file.size })),
  );

  await Promise.all(uploads.map((upload, index) => uploadChatImage(upload.uploadUrl, files[index])));

  return uploads.map((upload) => upload.objectKey);
}

/** 선택 필드를 명시적 null로 정규화해 화면에서 undefined 분기를 없앤다. */
function normalizeMessage<T extends { imageUrl?: string | null }>(message: T) {
  return { ...message, imageUrl: message.imageUrl ?? null };
}

/**
 * 선택 필드를 명시적 null로 정규화한다.
 *
 * swagger 스키마에는 endedAt·endedReason·lastMessage.imageUrl이 빠져 있지만(예시값이 null이라
 * 타입 추론이 안 된 결과) 실제 응답에는 항상 키가 있다. sourceType도 enum에 REMATCH가 빠져 있어
 * 자동 생성 타입을 믿을 수 없으므로, 계약 정본은 BE 위키 Frontend-Chat-Guide로 둔다.
 */
function normalizeRoom(room: ChatRoom): ChatRoom {
  return {
    ...room,
    sourceType: room.sourceType ?? "PERSONAL",
    counterpartMemberIds: room.counterpartMemberIds ?? [],
    lastMessage: room.lastMessage ? normalizeMessage(room.lastMessage) : null,
    unreadCount: room.unreadCount ?? 0,
    opensAt: room.opensAt ?? null,
    expiresAt: room.expiresAt ?? null,
    isEnded: room.isEnded ?? false,
    endedAt: room.endedAt ?? null,
    endedReason: room.endedReason ?? null,
    hasLeft: room.hasLeft ?? false,
  };
}
