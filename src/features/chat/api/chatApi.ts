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

function normalizeRoom(room: ChatRoom): ChatRoom {
  return {
    ...room,
    // 계약 정본은 swagger(ChatRoomResponse.roomType)다. 가이드 문서의 sourceType은 따르지 않는다.
    roomType: room.roomType ?? "PERSONAL",
    counterpartMemberIds: room.counterpartMemberIds ?? [],
    lastMessage: room.lastMessage ? normalizeMessage(room.lastMessage) : null,
    unreadCount: room.unreadCount ?? 0,
  };
}
