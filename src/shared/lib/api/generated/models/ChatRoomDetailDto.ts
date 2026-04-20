/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatPartnerDto } from './ChatPartnerDto';
import type { ChatReadReceiptDto } from './ChatReadReceiptDto';
export type ChatRoomDetailDto = {
    /**
     * 채팅방 ID
     */
    roomId: string;
    /**
     * 채팅방 만료 시각 (72시간)
     */
    expiresAt?: string;
    /**
     * 상대방 정보
     */
    partner: ChatPartnerDto;
    /**
     * 채팅방 상태
     */
    status: ChatRoomDetailDto.status;
    /**
     * 메시지 전송 가능 여부
     */
    canSendMessage: boolean;
    /**
     * 채팅방 종료 시각
     */
    endedAt?: string;
    /**
     * 채팅방을 종료한 유저 ID
     */
    endedByUserId?: string;
    /**
     * 요청 사용자 기준 종료 사유
     */
    endedReason?: ChatRoomDetailDto.endedReason;
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
    /**
     * 참여자별 읽음 정보
     */
    readReceipts: Array<ChatReadReceiptDto>;
};
export namespace ChatRoomDetailDto {
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

