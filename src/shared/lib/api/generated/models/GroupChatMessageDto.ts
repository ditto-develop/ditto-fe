/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { VoteMessageMetaDto } from './VoteMessageMetaDto';
export type GroupChatMessageDto = {
    /**
     * 메시지 ID
     */
    id: string;
    /**
     * 메시지 타입
     */
    type: GroupChatMessageDto.type;
    /**
     * 발신자 ID (SYSTEM 메시지는 null)
     */
    senderId?: string | null;
    /**
     * 발신자 닉네임 (SYSTEM 메시지는 빈 문자열)
     */
    senderNickname: string;
    /**
     * 발신자 프로필 이미지 URL
     */
    senderAvatarUrl?: string | null;
    /**
     * 메시지 내용
     */
    content: string;
    /**
     * 생성일시
     */
    createdAt: string;
    /**
     * 읽지 않은 참여자 수 (SYSTEM 메시지는 0)
     */
    unreadCount: number;
    /**
     * 투표 메타데이터 (VOTE_OPENED 메시지만)
     */
    voteMeta?: VoteMessageMetaDto | null;
};
export namespace GroupChatMessageDto {
    /**
     * 메시지 타입
     */
    export enum type {
        CHAT = 'CHAT',
        SYSTEM = 'SYSTEM',
        VOTE_OPENED = 'VOTE_OPENED',
    }
}

