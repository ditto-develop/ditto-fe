/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GroupChatMemberDto } from './GroupChatMemberDto';
import type { GroupVoteDto } from './GroupVoteDto';
export type GroupChatRoomDetailDto = {
    /**
     * 채팅방 ID
     */
    roomId: string;
    /**
     * 참여 멤버 목록
     */
    members: Array<GroupChatMemberDto>;
    /**
     * 총 멤버 수
     */
    totalMembers: number;
    /**
     * 활성 투표 정보 (없으면 null)
     */
    vote?: GroupVoteDto | null;
    /**
     * 채팅방 만료 시각 (ISO8601)
     */
    expiresAt?: string;
    /**
     * 채팅방 종료 여부
     */
    isEnded: boolean;
};

