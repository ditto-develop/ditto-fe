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
     * 매칭 확정된 상대방 userId
     */
    acceptedMatchUserId?: string;
    /**
     * 보낸 요청
     */
    sentRequests: Array<MatchRequestDto>;
    /**
     * 받은 요청
     */
    receivedRequests: Array<MatchRequestDto>;
    /**
     * 그룹 매칭 거절 여부
     */
    groupDeclined: boolean;
    /**
     * 그룹 매칭 참여 여부 (3명 이상 충족)
     */
    groupJoined: boolean;
    /**
     * 그룹 참여 신청했으나 3명 미만 대기 중
     */
    groupJoinPending: boolean;
};

