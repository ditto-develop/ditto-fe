/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatMessageDto } from './ChatMessageDto';
export type ChatRoomItemDto = {
    /**
     * 채팅방 ID
     */
    roomId: string;
    /**
     * 매칭 요청 ID
     */
    matchRequestId: string;
    /**
     * 참여자 ID 목록
     */
    participantUserIds: Array<string>;
    /**
     * 마지막 메시지
     */
    lastMessage?: ChatMessageDto;
    /**
     * 안읽은 메시지 수
     */
    unreadCount: number;
    /**
     * 생성일
     */
    createdAt: string;
};

