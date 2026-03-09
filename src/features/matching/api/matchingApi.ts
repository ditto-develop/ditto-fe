/**
 * Matching feature API functions
 * BE 엔드포인트와 1:1 대응
 */

const getApiBase = () => process.env.NEXT_PUBLIC_API_BASE || "https://ditto.pics";

function getToken(): string {
    return typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : "";
}

// BE는 { success, data?, error? } 래핑 구조로 응답
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    const res = await fetch(`${getApiBase()}/api${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers as Record<string, string>),
        },
    });
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
    candidates: MatchCandidateDto[];
}

export interface GetMatchingStatusResponse {
    sentRequests: MatchRequestDto[];
    receivedRequests: MatchRequestDto[];
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
