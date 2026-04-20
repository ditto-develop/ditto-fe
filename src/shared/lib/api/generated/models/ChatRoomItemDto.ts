/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ChatRoomItemDto = {
    /**
     * 채팅방 ID
     */
    roomId: string;
    /**
     * 파트너 닉네임
     */
    partnerNickname: string;
    /**
     * 파트너 프로필 이미지 URL
     */
    partnerAvatarUrl?: string;
    /**
     * 마지막 메시지 내용
     */
    lastMessageContent?: string;
    /**
     * 마지막 메시지 시각 (ISO8601)
     */
    lastMessageAt?: string;
    /**
     * 안읽은 메시지 수
     */
    unreadCount: number;
    /**
     * 채팅방 만료 시각 (ISO8601)
     */
    expiresAt?: string;
    /**
     * 그룹 채팅방 여부
     */
    isGroup: boolean;
    /**
     * 그룹방 두 번째 참여자 아바타 URL
     */
    coParticipantAvatarUrl?: string;
    /**
     * 채팅방 상태
     */
    status: ChatRoomItemDto.status;
    /**
     * 메시지 전송 가능 여부
     */
    canSendMessage: boolean;
    /**
     * 채팅방 종료 시각 (ISO8601)
     */
    endedAt?: string;
    /**
     * 채팅방을 종료한 유저 ID
     */
    endedByUserId?: string;
    /**
     * 요청 사용자 기준 종료 사유
     */
    endedReason?: ChatRoomItemDto.endedReason;
    /**
     * 채팅방 종료 여부
     */
    isEnded: boolean;
    /**
     * 상대방 퇴장 여부
     */
    isPartnerLeft: boolean;
    /**
     * 상대방이 마지막으로 읽은 메시지 ID
     */
    partnerLastReadMessageId?: string;
};
export namespace ChatRoomItemDto {
    /**
     * 채팅방 상태
     */
    export enum status {
        ACTIVE = 'ACTIVE',
        ENDED = 'ENDED',
    }
    /**
     * 요청 사용자 기준 종료 사유
     */
    export enum endedReason {
        PARTNER_LEFT = 'PARTNER_LEFT',
        SELF_LEFT = 'SELF_LEFT',
        EXPIRED = 'EXPIRED',
    }
}

