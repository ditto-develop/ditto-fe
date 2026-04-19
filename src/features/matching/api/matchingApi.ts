/**
 * Matching feature API functions
 * BE 엔드포인트와 1:1 대응
 */

import { apiFetch } from "@/shared/lib/api/client";

export { apiFetch, tryRefreshToken } from "@/shared/lib/api/client";

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

export function getMatchCandidates(): Promise<GetMatchCandidatesResponse> {
    return apiFetch("/matches/1on1");
}

export function sendMatchRequest(toUserId: string, quizSetId: string): Promise<MatchRequestDto> {
    return apiFetch("/matches/request", {
        method: "POST",
        body: JSON.stringify({ toUserId, quizSetId }),
    });
}

export function acceptMatchRequest(matchRequestId: string): Promise<MatchRequestDto> {
    return apiFetch(`/matches/request/${matchRequestId}/accept`, { method: "POST" });
}

export function rejectMatchRequest(matchRequestId: string): Promise<MatchRequestDto> {
    return apiFetch(`/matches/request/${matchRequestId}/reject`, { method: "POST" });
}

export function getMatchingStatus(quizSetId: string): Promise<GetMatchingStatusResponse> {
    return apiFetch(`/matching/status/${quizSetId}`);
}

export interface GroupJoinResult {
    roomId: string;
    quizSetId: string;
    participantCount: number;
    isActive: boolean;
}

export function joinGroupMatch(): Promise<GroupJoinResult> {
    return apiFetch("/matches/group/join", { method: "POST" });
}

export function declineGroupMatch(): Promise<void> {
    return apiFetch("/matches/group/decline", { method: "POST" });
}
