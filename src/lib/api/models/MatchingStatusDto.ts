/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MatchRequestDto } from './MatchRequestDto';
export type MatchingStatusDto = {
    /**
     * 퀴즈셋 ID
     */
    quizSetId: string;
    /**
     * 이미 매칭 확정 여부
     */
    hasAcceptedMatch: boolean;
    /**
     * 보낸 요청
     */
    sentRequests: Array<MatchRequestDto>;
    /**
     * 받은 요청
     */
    receivedRequests: Array<MatchRequestDto>;
};

