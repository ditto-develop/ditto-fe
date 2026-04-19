import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { CancelablePromise } from '../core/CancelablePromise';

export type GroupChatMember = {
  userId: string;
  nickname: string;
  profileImageUrl: string | null;
};

export type VotePlaceOption = {
  id: string;
  label: string;
  mapLink?: string;
  voterIds: string[];
};

export type VoteTimeOption = {
  id: string;
  dateLabel: string;
  date: string;
  time: string;
  voterIds: string[];
};

export type GroupVote = {
  id: string;
  title: string;
  allowMultiple: boolean;
  placeOptions: VotePlaceOption[];
  timeOptions: VoteTimeOption[];
  totalMembers: number;
  votedCount: number;
  myVote: { placeIds: string[]; timeIds: string[] } | null;
  status: 'OPEN' | 'CLOSED';
};

export type GroupChatRoomDetailDto = {
  roomId: string;
  expiresAt: string | null;
  members: GroupChatMember[];
  totalMembers: number;
  vote: { id: string; title: string } | null;
  canSendMessage?: boolean;
  isEnded?: boolean;
  endedAt?: string | null;
  endedReason?: string | null;
};

export type VoteMessageMeta = {
  voteId: string;
  placeSummary: { head: string; extraCount: number };
  timeSummary: { head: string; extraCount: number };
};

export type GroupMessageItem = {
  id: string;
  senderId: string;
  senderNickname: string;
  senderAvatarUrl: string | null;
  content: string;
  createdAt: string;
  unreadCount: number;
  /** CHAT: 일반 메시지, SYSTEM: 시스템 메시지, VOTE_OPENED: 투표 열림 알림 */
  type?: 'CHAT' | 'SYSTEM' | 'VOTE_OPENED';
  voteMeta?: VoteMessageMeta;
};

export type CreateGroupVotePayload = {
  title: string;
  allowMultiple: boolean;
  placeOptions: { label: string; mapLink?: string }[];
  timeOptions: { dateLabel: string; date: string; time: string }[];
};

export type CastGroupVotePayload = {
  placeIds: string[];
  timeIds: string[];
};

export type GroupMessageListDto = {
  messages: GroupMessageItem[];
  nextCursor?: string | null;
  readReceipts?: Array<{
    userId: string;
    lastReadMessageId: string;
    readAt: string;
  }>;
};

export class GroupChatService {
  /**
   * 그룹 채팅방 상세 조회
   */
  public static getGroupChatRoomDetail(
    roomId: string,
  ): CancelablePromise<{
    success?: boolean;
    data?: GroupChatRoomDetailDto;
    error?: string;
  }> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/chat/group-rooms/{roomId}',
      path: { roomId },
      errors: { 400: '잘못된 요청', 401: '인증 필요', 403: '권한 없음', 500: '서버 오류' },
    });
  }

  /**
   * 그룹 채팅방 메시지 목록 조회
   */
  public static getGroupMessages(
    roomId: string,
    cursor?: string,
    limit?: number,
  ): CancelablePromise<{
    success?: boolean;
    data?: GroupMessageListDto;
    error?: string;
  }> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/chat/group-rooms/{roomId}/messages',
      path: { roomId },
      query: { cursor, limit },
      errors: { 400: '잘못된 요청', 401: '인증 필요', 403: '권한 없음', 500: '서버 오류' },
    });
  }

  /**
   * 그룹 채팅방 메시지 전송
   */
  public static sendGroupMessage(
    roomId: string,
    requestBody: { content: string },
  ): CancelablePromise<{
    success?: boolean;
    data?: GroupMessageItem;
    error?: string;
  }> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/chat/group-rooms/{roomId}/messages',
      path: { roomId },
      body: requestBody,
      mediaType: 'application/json',
      errors: { 400: '잘못된 요청', 401: '인증 필요', 403: '권한 없음', 500: '서버 오류' },
    });
  }

  /**
   * 그룹 채팅방 읽음 처리
   */
  public static markGroupAsRead(
    roomId: string,
  ): CancelablePromise<{
    success?: boolean;
    error?: string;
  }> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/api/chat/group-rooms/{roomId}/read',
      path: { roomId },
      errors: { 400: '잘못된 요청', 401: '인증 필요', 403: '권한 없음', 500: '서버 오류' },
    });
  }

  /**
   * 그룹 채팅방 나가기
   */
  public static leaveGroupChatRoom(
    roomId: string,
    requestBody?: { reason?: string },
  ): CancelablePromise<{
    success?: boolean;
    error?: string;
  }> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/chat/group-rooms/{roomId}/leave',
      path: { roomId },
      body: requestBody ?? {},
      mediaType: 'application/json',
      errors: { 400: '잘못된 요청', 401: '인증 필요', 403: '권한 없음', 500: '서버 오류' },
    });
  }

  /**
   * 그룹 투표 상세 조회
   */
  public static getGroupVote(
    roomId: string,
    voteId: string,
  ): CancelablePromise<{
    success?: boolean;
    data?: GroupVote;
    error?: string;
  }> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/chat/group-rooms/{roomId}/votes/{voteId}',
      path: { roomId, voteId },
      errors: { 400: '잘못된 요청', 401: '인증 필요', 403: '권한 없음', 404: '투표 없음', 500: '서버 오류' },
    });
  }

  /**
   * 그룹 투표 생성
   */
  public static createGroupVote(
    roomId: string,
    requestBody: CreateGroupVotePayload,
  ): CancelablePromise<{
    success?: boolean;
    data?: GroupVote;
    error?: string;
  }> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/chat/group-rooms/{roomId}/votes',
      path: { roomId },
      body: requestBody,
      mediaType: 'application/json',
      errors: { 400: '잘못된 요청', 401: '인증 필요', 403: '권한 없음', 500: '서버 오류' },
    });
  }

  /**
   * 그룹 투표 제출
   */
  public static castGroupVote(
    roomId: string,
    voteId: string,
    requestBody: CastGroupVotePayload,
  ): CancelablePromise<{
    success?: boolean;
    data?: GroupVote;
    error?: string;
  }> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/chat/group-rooms/{roomId}/votes/{voteId}/cast',
      path: { roomId, voteId },
      body: requestBody,
      mediaType: 'application/json',
      errors: { 400: '잘못된 요청', 401: '인증 필요', 403: '권한 없음', 404: '투표 없음', 500: '서버 오류' },
    });
  }

  /**
   * 그룹 투표 옵션 추가
   */
  public static addGroupVoteOption(
    roomId: string,
    voteId: string,
    requestBody:
      | { type: 'PLACE'; label: string; mapLink?: string }
      | { type: 'TIME'; dateLabel: string; date: string; time: string },
  ): CancelablePromise<{
    success?: boolean;
    data?: GroupVote;
    error?: string;
  }> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/chat/group-rooms/{roomId}/votes/{voteId}/options',
      path: { roomId, voteId },
      body: requestBody,
      mediaType: 'application/json',
      errors: { 400: '잘못된 요청', 401: '인증 필요', 403: '권한 없음', 404: '투표 없음', 500: '서버 오류' },
    });
  }
}
