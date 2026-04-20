/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatMessageDto } from './ChatMessageDto';
import type { ChatReadReceiptDto } from './ChatReadReceiptDto';
export type MessageListDto = {
    /**
     * 메시지 목록
     */
    messages: Array<ChatMessageDto>;
    /**
     * 다음 페이지 커서 (없으면 마지막 페이지)
     */
    nextCursor?: string;
    /**
     * 상대방이 마지막으로 읽은 메시지 ID
     */
    partnerLastReadMessageId?: string;
    /**
     * 참여자별 읽음 정보
     */
    readReceipts: Array<ChatReadReceiptDto>;
};

