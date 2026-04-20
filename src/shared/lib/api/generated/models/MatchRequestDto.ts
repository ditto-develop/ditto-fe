/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MatchRequestDto = {
    id: string;
    quizSetId: string;
    fromUserId: string;
    toUserId: string;
    status: string;
    score: number;
    scoreBreakdown?: Record<string, any>;
    algorithmVersion: string;
    requestedAt: string;
    respondedAt?: string;
};

