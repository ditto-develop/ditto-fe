import type {
    CreateUserDto,
    CurrentWeekQuizSetDto,
    CurrentWeekQuizSetsResponseDto,
    GetQuizSetWithProgressResponseDto,
    LoginResponseDto,
    QuizChoiceDto,
    QuizProgressDto,
    QuizSetDto,
    QuizWithAnswerDto,
    UserDto,
} from "@/shared/lib/api/generated";
import { externalApiFetch } from "@/shared/lib/api/externalClient";
import type {
    GetMatchCandidatesResponse,
    GetMatchingStatusResponse,
    GroupJoinResult,
    MatchCandidateDto,
    MatchRequestDto,
    ScoreBreakdownDto,
} from "@/features/matching/api/matchingApi";

type ExternalId = string | number;

type ExternalMatchRequest = {
    id: ExternalId;
    quizSetId: ExternalId;
    requesterId: ExternalId;
    receiverId: ExternalId;
    status: MatchRequestDto["status"];
    createdAt?: string | null;
    respondedAt?: string | null;
};

type ExternalPersonalMatch = ExternalMatchRequest | null;

type ExternalMatchCandidate = {
    userId: ExternalId;
    nickname: string;
    gender: string;
    age: number;
    introduction?: string | null;
    location?: string;
    profileImageUrl?: string | null;
    matchRate?: number;
    scoreBreakdown: ScoreBreakdownDto;
};

type ExternalMatchList = {
    sent: ExternalMatchRequest[];
    received: ExternalMatchRequest[];
    quizSetId?: ExternalId;
    matchingType?: GetMatchCandidatesResponse["matchingType"];
    candidates?: ExternalMatchCandidate[];
};

type ExternalMatchingStatus = {
    quizSetId: ExternalId;
    personalMatch?: ExternalPersonalMatch;
    groupMatchStatus: "NONE" | "JOINED" | "DECLINED";
    groupMatchRoomId?: ExternalId | null;
};

type NicknameAvailability = {
    available?: boolean;
};

const toId = (value: ExternalId | null | undefined): string => String(value ?? "");

const normalizeChoice = (choice: QuizChoiceDto): QuizChoiceDto => ({
    ...choice,
    id: toId(choice.id),
});

const normalizeQuiz = <T extends { id: string; quizSetId: string; choices: QuizChoiceDto[] }>(quiz: T): T => ({
    ...quiz,
    id: toId(quiz.id),
    quizSetId: toId(quiz.quizSetId),
    choices: quiz.choices.map(normalizeChoice),
});

const normalizeCurrentWeekQuizSet = (quizSet: CurrentWeekQuizSetDto): CurrentWeekQuizSetDto => ({
    ...quizSet,
    id: toId(quizSet.id),
    quizzes: quizSet.quizzes.map(normalizeQuiz),
});

const normalizeQuizWithAnswer = (quiz: QuizWithAnswerDto): QuizWithAnswerDto => normalizeQuiz(quiz);

const toMatchRequest = (request: ExternalMatchRequest): MatchRequestDto => ({
    id: toId(request.id),
    quizSetId: toId(request.quizSetId),
    fromUserId: toId(request.requesterId),
    toUserId: toId(request.receiverId),
    status: request.status,
});

const toMatchCandidate = (candidate: ExternalMatchCandidate): MatchCandidateDto => ({
    userId: toId(candidate.userId),
    nickname: candidate.nickname,
    gender: candidate.gender,
    age: candidate.age,
    introduction: candidate.introduction ?? null,
    location: candidate.location,
    profileImageUrl: candidate.profileImageUrl ?? null,
    matchRate: candidate.matchRate ?? candidate.scoreBreakdown.quizMatchRate,
    scoreBreakdown: candidate.scoreBreakdown,
});

function getStoredQuizSetId(): string {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("currentQuizSetId") || "";
}

function setStoredQuizSetId(quizSetId: string): void {
    if (typeof window === "undefined" || !quizSetId) return;
    sessionStorage.setItem("currentQuizSetId", quizSetId);
}

function isCypressRuntime(): boolean {
    return typeof window !== "undefined" && "Cypress" in window;
}

function pickQuizSetId(list: ExternalMatchList): string {
    const first = list.sent[0] || list.received[0];
    return toId(first?.quizSetId) || getStoredQuizSetId();
}

export async function getExternalCurrentWeekQuizSets(): Promise<CurrentWeekQuizSetsResponseDto> {
    const data = await externalApiFetch<CurrentWeekQuizSetsResponseDto>("/api/v1/quiz-sets/current-week");
    const normalized = {
        ...data,
        quizSets: data.quizSets.map(normalizeCurrentWeekQuizSet),
    };
    const firstQuizSetId = normalized.quizSets?.[0]?.id;
    if (firstQuizSetId) setStoredQuizSetId(String(firstQuizSetId));
    return normalized;
}

export async function getExternalQuizSet(id: string): Promise<QuizSetDto> {
    const data = await externalApiFetch<QuizSetDto>(`/api/v1/quiz-sets/${id}`);
    return {
        ...data,
        id: toId(data.id),
    };
}

export function submitExternalQuizAnswer(quizId: string, choiceId: string): Promise<null> {
    return externalApiFetch<null>("/api/v1/quiz-progress/answers", {
        method: "POST",
        body: {
            quizId: Number(quizId),
            choiceId: Number(choiceId),
        },
    });
}

export async function getExternalQuizProgress(): Promise<QuizProgressDto> {
    const data = await externalApiFetch<QuizProgressDto>("/api/v1/quiz-progress/current");
    if (data.quizSetId) setStoredQuizSetId(toId(data.quizSetId));
    return {
        ...data,
        quizSetId: data.quizSetId ? toId(data.quizSetId) : data.quizSetId,
    };
}

export function resetExternalQuizProgress(): Promise<null> {
    return externalApiFetch<null>("/api/v1/quiz-progress/reset", { method: "POST" });
}

export async function getExternalQuizSetWithProgress(id: string): Promise<GetQuizSetWithProgressResponseDto> {
    setStoredQuizSetId(id);
    const data = await externalApiFetch<GetQuizSetWithProgressResponseDto>(`/api/v1/quiz-progress/quiz-sets/${id}`);
    return {
        ...data,
        quizzes: data.quizzes.map(normalizeQuizWithAnswer),
    };
}

// 회원가입 payload: name/nickname/phoneNumber/gender/age + nullable email/birthDate
// + interests/location/job/caricature(프로필).
// provider/providerUserId는 더 이상 body로 보내지 않는다(인증은 Authorization 헤더로 처리).
// generated CreateUserDto는 email/birthDate를 optional string으로만 정의하지만,
// BE는 값이 없을 때 null을 허용하므로 해당 두 필드만 nullable로 넓힌다.
// interests/location/job/caricature는 BE 스펙(ditto-api.json)에 아직 반영되지 않아 generated
// DTO에 없으므로 여기서 수동으로 추가한다. 스펙 갱신 후 generate-client 재실행 시 정리한다.
export type CreateExternalUserBody = Omit<
    CreateUserDto,
    "email" | "birthDate" | "provider" | "providerUserId"
> & {
    email: string | null;
    birthDate: string | null;
    interests: string[];
    location: string;
    job: string;
    caricature: string;
};

// 카카오 로그인 직후 BE가 카카오 정보를 바탕으로 채워둔 현재 사용자 정보.
// 회원가입 단계에서 이름/전화번호/성별/이메일/생년월일을 받아와 폼을 미리 채운다.
export type CurrentUserInfo = {
    name: string | null;
    phoneNumber: string | null;
    gender: string | null;
    email: string | null;
    birthDate: string | null;
};

export async function getExternalCurrentUser(): Promise<CurrentUserInfo> {
    const data = await externalApiFetch<Partial<CurrentUserInfo>>("/api/v1/users/me");
    return {
        name: data?.name ?? null,
        phoneNumber: data?.phoneNumber ?? null,
        gender: data?.gender ?? null,
        email: data?.email ?? null,
        birthDate: data?.birthDate ?? null,
    };
}

export function createExternalUser(requestBody: CreateExternalUserBody): Promise<UserDto> {
    return externalApiFetch<UserDto>("/api/v1/users", {
        method: "POST",
        body: requestBody,
    });
}

export function leaveExternalUser(id: string): Promise<UserDto> {
    return externalApiFetch<UserDto>(`/api/v1/users/${id}/leave`, { method: "POST" });
}

export function refreshExternalToken(): Promise<LoginResponseDto> {
    return externalApiFetch<LoginResponseDto>("/api/v1/users/auth/refresh", {
        method: "POST",
        credentials: "include",
    });
}

export async function logoutExternal(): Promise<null> {
    try {
        return await externalApiFetch<null>("/api/v1/users/auth/logout", { method: "POST" });
    } finally {
        if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
        }
    }
}

export function checkExternalNicknameAvailability(nickname: string): Promise<NicknameAvailability> {
    return externalApiFetch<NicknameAvailability>(`/api/v1/users/nickname/${encodeURIComponent(nickname)}/availability`);
}

export function startExternalSocialLogin(provider: string): void {
    const url = `${process.env.NEXT_PUBLIC_API_BASE || "https://api.ditto.pics"}/api/v1/users/social-login/${provider}`;
    if (isCypressRuntime()) return;
    window.location.href = url;
}

export async function getExternalMatchCandidates(): Promise<GetMatchCandidatesResponse> {
    const data = await externalApiFetch<ExternalMatchList>("/api/v1/matches/1on1");
    const quizSetId = toId(data.quizSetId) || pickQuizSetId(data);
    if (quizSetId) setStoredQuizSetId(quizSetId);

    return {
        quizSetId,
        matchingType: data.matchingType ?? "ONE_TO_ONE",
        candidates: (data.candidates ?? []).map(toMatchCandidate),
        receivedRequests: (data.received ?? []).map(toMatchRequest),
    };
}

export function sendExternalMatchRequest(toUserId: string, quizSetId: string): Promise<MatchRequestDto> {
    return externalApiFetch<ExternalMatchRequest>("/api/v1/matches/request", {
        method: "POST",
        body: {
            quizSetId: Number(quizSetId),
            receiverId: Number(toUserId),
        },
    }).then(toMatchRequest);
}

export function acceptExternalMatchRequest(matchRequestId: string): Promise<MatchRequestDto> {
    return externalApiFetch<ExternalMatchRequest>(`/api/v1/matches/request/${matchRequestId}/accept`, {
        method: "POST",
    }).then(toMatchRequest);
}

export function rejectExternalMatchRequest(matchRequestId: string): Promise<MatchRequestDto> {
    return externalApiFetch<ExternalMatchRequest>(`/api/v1/matches/request/${matchRequestId}/reject`, {
        method: "POST",
    }).then(toMatchRequest);
}

export async function getExternalMatchingStatus(quizSetId: string): Promise<GetMatchingStatusResponse> {
    const data = await externalApiFetch<ExternalMatchingStatus>(`/api/v1/matching/status/${quizSetId}`);
    const personalMatch = data.personalMatch ? toMatchRequest(data.personalMatch) : undefined;
    return {
        sentRequests: personalMatch ? [personalMatch] : [],
        receivedRequests: [],
        hasAcceptedMatch: personalMatch?.status === "ACCEPTED",
        acceptedMatchUserId: personalMatch?.status === "ACCEPTED" ? personalMatch.toUserId : undefined,
        groupDeclined: data.groupMatchStatus === "DECLINED",
        groupJoined: data.groupMatchStatus === "JOINED",
        groupJoinPending: data.groupMatchStatus === "NONE" && Boolean(data.groupMatchRoomId),
    };
}

export function joinExternalGroupMatch(quizSetId?: string): Promise<GroupJoinResult> {
    const resolvedQuizSetId = quizSetId || getStoredQuizSetId();
    return externalApiFetch<GroupJoinResult>("/api/v1/matches/group/join", {
        method: "POST",
        body: { quizSetId: Number(resolvedQuizSetId) },
    }).then((result) => ({
        ...result,
        roomId: toId(result.roomId),
        quizSetId: toId(result.quizSetId),
    }));
}

export function declineExternalGroupMatch(quizSetId?: string): Promise<void> {
    const resolvedQuizSetId = quizSetId || getStoredQuizSetId();
    return externalApiFetch<null>("/api/v1/matches/group/decline", {
        method: "POST",
        body: { quizSetId: Number(resolvedQuizSetId) },
    }).then(() => undefined);
}
