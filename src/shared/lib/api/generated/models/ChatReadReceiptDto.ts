/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ChatReadReceiptDto = {
    /**
     * 읽음 처리한 유저 ID
     */
    userId: string;
    /**
     * 해당 유저가 마지막으로 읽은 메시지 ID
     */
    lastReadMessageId?: string;
    /**
     * 마지막 읽음 처리 시각
     */
    readAt: string;
};

