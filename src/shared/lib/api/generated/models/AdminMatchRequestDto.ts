/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AdminMatchRequestDto = {
    id: string;
    quizSetId: string;
    fromUserId: string;
    fromUserNickname: string;
    toUserId: string;
    toUserNickname: string;
    status: AdminMatchRequestDto.status;
    score: number;
    scoreBreakdown?: Record<string, any>;
    algorithmVersion: string;
    matchingType: AdminMatchRequestDto.matchingType;
    requestedAt: string;
    respondedAt?: string;
    createdAt: string;
};
export namespace AdminMatchRequestDto {
    export enum status {
        PENDING = 'PENDING',
        ACCEPTED = 'ACCEPTED',
        REJECTED = 'REJECTED',
        CANCELLED = 'CANCELLED',
        EXPIRED = 'EXPIRED',
    }
    export enum matchingType {
        ONE_TO_ONE = 'ONE_TO_ONE',
        GROUP = 'GROUP',
    }
}

