/**
 * Matching feature API functions
 * BE 엔드포인트와 1:1 대응
 */

import {
    acceptExternalMatchRequest,
    declineExternalGroupMatch,
    getExternalMatchCandidates,
    getExternalMatchingStatus,
    joinExternalGroupMatch,
    rejectExternalMatchRequest,
    sendExternalMatchRequest,
} from "@/shared/lib/api/externalApi";

// --- BE DTO types ---

export interface ScoreBreakdownDto {
    quizMatchRate: number;       // 0~100 percentage
    matchedQuestions: number;    // 일치한 문항 수
    totalQuestions: number;      // 전체 비교 문항 수
    reasons: string[];
}

export interface MatchCandidateDto {
    userId: string;
    nickname: string;
    gender: string;
    age: number;
    introduction: string | null;
    location?: string;
    profileImageUrl?: string | null;
    matchRate: number;           // 0~100 percentage (= quizMatchRate)
    scoreBreakdown: ScoreBreakdownDto;
}

export type MatchRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "EXPIRED";

export interface MatchRequestDto {
    id: string;
    fromUserId: string;
    toUserId: string;
    status: MatchRequestStatus;
    quizSetId: string;
}

export interface GetMatchCandidatesResponse {
    quizSetId: string;
    matchingType: 'ONE_TO_ONE' | 'GROUP';
    candidates: MatchCandidateDto[];
}

export interface GetMatchingStatusResponse {
    sentRequests: MatchRequestDto[];
    receivedRequests: MatchRequestDto[];
    hasAcceptedMatch: boolean;
    acceptedMatchUserId?: string;
    groupDeclined: boolean;
    groupJoined: boolean;
    groupJoinPending: boolean;
}

// --- API functions ---

function createEmptyMatchingStatus(): GetMatchingStatusResponse {
    return {
        sentRequests: [],
        receivedRequests: [],
        hasAcceptedMatch: false,
        groupDeclined: false,
        groupJoined: false,
        groupJoinPending: false,
    };
}

export function getMatchCandidates(): Promise<GetMatchCandidatesResponse> {
    return getExternalMatchCandidates();
}

export function sendMatchRequest(toUserId: string, quizSetId: string): Promise<MatchRequestDto> {
    return sendExternalMatchRequest(toUserId, quizSetId);
}

export function acceptMatchRequest(matchRequestId: string): Promise<MatchRequestDto> {
    return acceptExternalMatchRequest(matchRequestId);
}

export function rejectMatchRequest(matchRequestId: string): Promise<MatchRequestDto> {
    return rejectExternalMatchRequest(matchRequestId);
}

export function getMatchingStatus(quizSetId: string): Promise<GetMatchingStatusResponse> {
    if (!quizSetId) return Promise.resolve(createEmptyMatchingStatus());
    return getExternalMatchingStatus(quizSetId);
}

export interface GroupJoinResult {
    roomId: string;
    quizSetId: string;
    participantCount: number;
    isActive: boolean;
}

export function joinGroupMatch(quizSetId?: string): Promise<GroupJoinResult> {
    return joinExternalGroupMatch(quizSetId);
}

export function declineGroupMatch(quizSetId?: string): Promise<void> {
    return declineExternalGroupMatch(quizSetId);
}
