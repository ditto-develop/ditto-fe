/**
 * Matching feature API functions
 * BE 엔드포인트와 1:1 대응
 */

import {
    acceptExternalGroupMatch,
    acceptExternalMatchRequest,
    declineExternalGroupMatch,
    getExternalGroupCandidates,
    getExternalMatchCandidates,
    getExternalMatchingStatus,
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

/**
 * GET /api/v1/matches/1on1 — **1:1 전용**이다.
 *
 * 응답의 `matchingType` 은 일부러 뺐다. 이 엔드포인트는 1:1 퀴즈셋만 찾으므로
 * `GROUP` 이 나올 수 없는데, 예전 FE 는 이 값으로 그룹 화면을 분기해 그룹 결과가
 * 한 번도 뜨지 않았다(BE 위키 Frontend-Group-Matching-Guide). 그룹은 getGroupCandidates 를 쓴다.
 */
export interface GetMatchCandidatesResponse {
    quizSetId: string;
    /**
     * 이 후보들이 속한 운영 주의 월요일(`yyyy-MM-dd`). `GET /api/v1/system/state` 의 같은 이름
     * 필드와 문자열 비교하면 "이번 주 것인가"가 끝난다 — 예전처럼 quizSetId 크기를 견줄 필요가 없다.
     * 옛 서버는 내려주지 않으므로 null 일 수 있고, 그때는 비교를 건너뛴다.
     */
    weekStartedOn: string | null;
    candidates: MatchCandidateDto[];
}

/**
 * GET /api/v1/matching/status/{quizSetId} — **1:1 상태 전용**으로 쓴다.
 *
 * 응답의 `groupJoined` / `groupJoinPending` / `groupDeclined` 는 담지 않는다.
 * 세 플래그는 "후보를 받았지만 아직 응답 안 함"을 표현하지 못해 초대가 없는 회원과
 * 같은 값이 나온다. 그룹 화면 상태는 getGroupCandidates 의 `myStatus`/`isFormed` 로 판정한다
 * (BE 위키 Frontend-Group-Matching-Guide §화면 상태 판단). BE 도 FE 반영 후 제거 예정이다.
 */
export interface GetMatchingStatusResponse {
    sentRequests: MatchRequestDto[];
    receivedRequests: MatchRequestDto[];
    hasAcceptedMatch: boolean;
    acceptedMatchUserId?: string;
}

// --- API functions ---

/**
 * 후보 응답이 이번 운영 주의 것인지. 서버는 이번 주 퀴즈셋만 내려주지만(BE PR #176),
 * 캐시·지연된 응답이 섞일 수 있어 홈에서 한 번 더 대조한다.
 *
 * 어느 한쪽이라도 주차를 모르면(옛 서버 응답, system/state 실패) **true 로 본다** —
 * 모른다고 카드를 감추면 정상 사용자의 이번 주 매칭이 통째로 사라진다. 그 경우의 안전장치는
 * 서버의 주차 검사(`5008`)다.
 */
export function isCurrentWeek(
    candidateWeekStartedOn: string | null | undefined,
    currentWeekStartedOn: string | null | undefined,
): boolean {
    if (!candidateWeekStartedOn || !currentWeekStartedOn) return true;
    return candidateWeekStartedOn === currentWeekStartedOn;
}

function createEmptyMatchingStatus(): GetMatchingStatusResponse {
    return {
        sentRequests: [],
        receivedRequests: [],
        hasAcceptedMatch: false,
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

// --- 그룹 매칭 ---

/** 후보 그룹에 대한 내 응답. 거절한 그룹은 목록에서 빠지므로 DECLINED 는 내려오지 않는다. */
export type GroupInvitationStatus = "PENDING" | "ACCEPTED";

/**
 * 후보 그룹 하나.
 *
 * `averageMatchedQuestions` 는 **나와 각 구성원의 일치 문항 수 평균**으로,
 * 구성원 개인의 `scoreBreakdown.matchedQuestions` 와 다른 값이다. 그룹 카드는 평균을,
 * 프로필 목록은 개인 값을 쓴다(BE 위키 Frontend-Group-Matching-Guide).
 */
export interface GroupCandidateGroupDto {
    groupMatchId: string;
    myStatus: GroupInvitationStatus;
    /** 수락자가 최소 인원(3명)에 도달했는지. 성사되면 금요일에 채팅방이 열린다. */
    isFormed: boolean;
    averageMatchedQuestions: number;
    totalQuestions: number;
    /** 나를 제외한 구성원. 나와의 일치 문항 수 내림차순 */
    members: MatchCandidateDto[];
}

export interface GetGroupCandidatesResponse {
    quizSetId: string;
    /** @see GetMatchCandidatesResponse.weekStartedOn */
    weekStartedOn: string | null;
    /** 그룹 점수 내림차순, 최대 3개. 빈 배열이면 매칭 실패 화면이다. */
    groups: GroupCandidateGroupDto[];
}

export interface GroupMatchAcceptResult {
    groupMatchId: string;
    quizSetId: string;
    acceptedCount: number;
    isFormed: boolean;
}

export function getGroupCandidates(): Promise<GetGroupCandidatesResponse> {
    return getExternalGroupCandidates();
}

export function acceptGroupMatch(groupMatchId: string): Promise<GroupMatchAcceptResult> {
    return acceptExternalGroupMatch(groupMatchId);
}

export function declineGroupMatch(groupMatchId: string): Promise<void> {
    return declineExternalGroupMatch(groupMatchId);
}
