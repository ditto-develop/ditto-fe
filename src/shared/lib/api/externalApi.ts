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
import { externalApiFetch, readExternalRefreshToken } from "@/shared/lib/api/externalClient";
import type {
    GetMatchCandidatesResponse,
    GetMatchingStatusResponse,
    GroupJoinResult,
    MatchRequestDto,
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

type ExternalMatchList = {
    sent: ExternalMatchRequest[];
    received: ExternalMatchRequest[];
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

type OAuthCallbackResult = {
    accessToken?: string | null;
    refreshToken?: string | null;
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

function getStoredQuizSetId(): string {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("currentQuizSetId") || "";
}

function setStoredQuizSetId(quizSetId: string): void {
    if (typeof window === "undefined" || !quizSetId) return;
    sessionStorage.setItem("currentQuizSetId", quizSetId);
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

export function createExternalUser(requestBody: CreateUserDto): Promise<UserDto> {
    return externalApiFetch<UserDto>("/api/v1/users", {
        method: "POST",
        body: {
            ...requestBody,
            provider: requestBody.provider.toUpperCase(),
        },
    });
}

export function leaveExternalUser(id: string): Promise<UserDto> {
    return externalApiFetch<UserDto>(`/api/v1/users/${id}/leave`, { method: "POST" });
}

export function refreshExternalToken(): Promise<LoginResponseDto> {
    return externalApiFetch<LoginResponseDto>("/api/v1/users/auth/refresh", {
        method: "POST",
        body: { refreshToken: readExternalRefreshToken() },
    });
}

export async function logoutExternal(): Promise<null> {
    try {
        return await externalApiFetch<null>("/api/v1/users/auth/logout", { method: "POST" });
    } finally {
        if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
        }
    }
}

export function checkExternalNicknameAvailability(nickname: string): Promise<NicknameAvailability> {
    return externalApiFetch<NicknameAvailability>(`/api/v1/users/nickname/${encodeURIComponent(nickname)}/availability`);
}

export function startExternalSocialLogin(provider: string): void {
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE || "https://api.ditto.pics"}/api/v1/users/social-login/${provider}`;
}

export function handleExternalSocialCallback(provider: string, code: string): Promise<OAuthCallbackResult> {
    const query = new URLSearchParams({ code });
    return externalApiFetch<OAuthCallbackResult>(`/api/v1/users/social-login/${provider}/callback?${query.toString()}`);
}

export async function getExternalMatchCandidates(): Promise<GetMatchCandidatesResponse> {
    const data = await externalApiFetch<ExternalMatchList>("/api/v1/matches/1on1");
    const quizSetId = pickQuizSetId(data);
    if (quizSetId) setStoredQuizSetId(quizSetId);

    return {
        quizSetId,
        matchingType: "ONE_TO_ONE",
        candidates: [],
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
