/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatMessageDto } from './ChatMessageDto';

export type ReadReceiptDto = {
    userId: string;
    lastReadMessageId: string;
    readAt: string;
};

export type MessageListDto = {
    messages: Array<ChatMessageDto>;
    nextCursor?: string;
    partnerLastReadMessageId?: string | null;
    readReceipts?: Array<ReadReceiptDto>;
};

