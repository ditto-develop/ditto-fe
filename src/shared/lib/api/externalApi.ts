import type {
    CreateUserDto,
    CurrentWeekQuizSetDto,
    CurrentWeekQuizSetsResponseDto,
    GetQuizSetWithProgressResponseDto,
    QuizChoiceDto,
    QuizProgressDto,
    SystemStateDto,
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

// GET /api/v1/matches/1on1 응답 (MatchCandidateResponse)
type ExternalMatchCandidateList = {
    quizSetId: ExternalId;
    matchingType: GetMatchCandidatesResponse["matchingType"];
    algorithmVersion?: string;
    candidates?: ExternalMatchCandidate[];
};

// GET /api/v1/matching/status/{quizSetId} 응답 (MatchingStatusResponse)
type ExternalMatchingStatus = {
    quizSetId: ExternalId;
    sentRequests?: ExternalMatchRequest[];
    receivedRequests?: ExternalMatchRequest[];
    hasAcceptedMatch: boolean;
    acceptedMatchUserId?: ExternalId | null;
    groupDeclined: boolean;
    groupJoined: boolean;
    groupJoinPending: boolean;
};

type NicknameAvailability = {
    available?: boolean;
};

type IntroNoteItem = {
    questionCode: string;
    question: string;
    answer: string;
};

export type IntroNotesData = {
    answers: IntroNoteItem[];
    completedCount: number;
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

export async function getExternalQuizSetWithProgress(id: string): Promise<GetQuizSetWithProgressResponseDto> {
    setStoredQuizSetId(id);
    const data = await externalApiFetch<GetQuizSetWithProgressResponseDto>(`/api/v1/quiz-progress/quiz-sets/${id}`);
    return {
        ...data,
        quizzes: data.quizzes.map(normalizeQuizWithAnswer),
    };
}

export function getExternalSystemState(): Promise<SystemStateDto> {
    return externalApiFetch<SystemStateDto>("/api/v1/system/state");
}

// 회원가입 payload: name/nickname/phoneNumber/gender/age + nullable email/birthDate
// + interests/location/job/caricature(프로필).
// provider/providerUserId는 더 이상 body로 보내지 않는다(인증은 Authorization 헤더로 처리).
// generated CreateUserDto는 email/birthDate를 optional string으로만 정의하지만,
// BE는 값이 없을 때 null을 허용하므로 해당 두 필드만 nullable로 넓힌다.
// interests/location/job/caricature는 라이브 CreateUserRequest의 required 필드지만,
// 리포지토리의 ditto-api.json이 구 스펙이라 generated DTO에 없다. 여기서 수동으로 얹는다.
// 스펙을 https://api.ditto.pics/docs/openapi.yaml로 교체하고 generate-client를 다시 돌리면 정리된다.
//
// 프로필 이미지는 별도 필드가 없다 — caricature에 실은 아바타 경로가 프로필 조회의
// profileImageUrl로 그대로 나간다(라이브 스펙 CreateUserRequest 설명).
// introduction은 한 줄 소개(최대 50자)이며, 소개노트 Q10('나를 한 줄로 표현한다면?')
// 답변으로 저장된다. 나머지 소개노트 9개는 가입 후 PUT /users/me/intro-notes/{code}로 보낸다.
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
    introduction: string | null;
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

/**
 * 회원 탈퇴.
 *
 * `reason`은 선택지 code, `reasonDetail`은 자유 입력(최대 100자)이다. BE는 '기타'가
 * 아니어도 detail을 받는다 — 선택지와 무관하게 있으면 그대로 보낸다.
 */
export function leaveExternalUser(
    id: string,
    reason?: string,
    reasonDetail?: string,
): Promise<UserDto> {
    const body: { reason?: string; reasonDetail?: string } = {};
    if (reason) body.reason = reason;
    if (reasonDetail) body.reasonDetail = reasonDetail;

    return externalApiFetch<UserDto>(`/api/v1/users/${id}/leave`, {
        method: "POST",
        ...(Object.keys(body).length > 0 ? { body } : {}),
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

export function saveExternalIntroNote(questionCode: string, answer: string): Promise<IntroNotesData> {
    return externalApiFetch<IntroNotesData>(`/api/v1/users/me/intro-notes/${questionCode}`, {
        method: "PUT",
        body: { answer },
    });
}

export function getExternalMyIntroNotes(): Promise<IntroNotesData> {
    return externalApiFetch<IntroNotesData>("/api/v1/users/me/intro-notes");
}

export function getExternalUserIntroNotes(id: string): Promise<IntroNotesData> {
    return externalApiFetch<IntroNotesData>(`/api/v1/users/${id}/intro-notes`);
}

export function startExternalSocialLogin(provider: string): void {
    const url = `${process.env.NEXT_PUBLIC_API_BASE || "https://api.ditto.pics"}/api/v1/users/social-login/${provider}`;
    if (isCypressRuntime()) return;
    window.location.href = url;
}

export async function getExternalMatchCandidates(): Promise<GetMatchCandidatesResponse> {
    const data = await externalApiFetch<ExternalMatchCandidateList>("/api/v1/matches/1on1");
    const quizSetId = toId(data.quizSetId) || getStoredQuizSetId();
    if (quizSetId) setStoredQuizSetId(quizSetId);

    return {
        quizSetId,
        matchingType: data.matchingType ?? "ONE_TO_ONE",
        candidates: (data.candidates ?? []).map(toMatchCandidate),
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
    return {
        sentRequests: (data.sentRequests ?? []).map(toMatchRequest),
        receivedRequests: (data.receivedRequests ?? []).map(toMatchRequest),
        hasAcceptedMatch: data.hasAcceptedMatch,
        acceptedMatchUserId: data.acceptedMatchUserId != null ? toId(data.acceptedMatchUserId) : undefined,
        groupDeclined: data.groupDeclined,
        groupJoined: data.groupJoined,
        groupJoinPending: data.groupJoinPending,
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
