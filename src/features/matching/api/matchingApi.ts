/**
 * Matching feature API functions
 * BE 엔드포인트와 1:1 대응
 */

const getApiBase = () => process.env.NEXT_PUBLIC_API_BASE || "https://ditto.pics";

function getToken(): string {
    return typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : "";
}

async function tryRefreshToken(): Promise<string | null> {
    try {
        const res = await fetch(`${getApiBase()}/api/users/auth/refresh`, {
            method: "POST",
            credentials: "include",
        });
        if (!res.ok) return null;
        const data = await res.json();
        const newToken = data?.data?.accessToken;
        if (newToken && typeof window !== "undefined") {
            localStorage.setItem("accessToken", newToken);
            return newToken;
        }
        return null;
    } catch {
        return null;
    }
}

// BE는 { success, data?, error? } 래핑 구조로 응답
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const makeRequest = (token: string) =>
        fetch(`${getApiBase()}/api${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(options.headers as Record<string, string>),
            },
        });

    let res = await makeRequest(getToken());

    // 401이면 토큰 갱신 후 1회 재시도
    if (res.status === 401) {
        const newToken = await tryRefreshToken();
        if (newToken) {
            res = await makeRequest(newToken);
        }
    }

    if (!res.ok) {
        throw new Error(`API ${res.status}: ${path}`);
    }
    const json = (await res.json()) as { success: boolean; data?: T; error?: string };
    if (!json.success) {
        throw new Error(json.error || `API error: ${path}`);
    }
    return json.data as T;
}

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
