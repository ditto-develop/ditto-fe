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

// 회원가입 payload: name/nickname/gender/age + nullable email/birthDate/phoneNumber
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
    "name" | "email" | "birthDate" | "phoneNumber" | "provider" | "providerUserId"
> & {
    email: string | null;
    birthDate: string | null;
    // 라이브 스펙(`/api/v1/users`)에서 nullable 이다. 본인인증을 빼면서 수집을
    // 중단했으므로 항상 null 로 나간다(2026-08-30).
    phoneNumber: string | null;
    interests: string[];
    location: string;
    job: string;
    caricature: string;
    introduction: string | null;
};

// 카카오 로그인 직후 BE가 카카오 정보를 바탕으로 채워둔 현재 사용자 정보.
// 회원가입 단계에서 성별/생년월일로 폼을 미리 채우고, 이메일은 설정 화면이 읽는다.
//
// BE 는 name/phoneNumber 도 함께 내려주지만 FE 는 더 이상 쓰지 않는다(2026-09-06).
// 이름은 수집을 중단했고 전화번호는 본인인증을 빼면서(2026-08-30) 쓰임이 사라졌다.
export type CurrentUserInfo = {
    gender: string | null;
    email: string | null;
    birthDate: string | null;
};

export async function getExternalCurrentUser(): Promise<CurrentUserInfo> {
    const data = await externalApiFetch<Partial<CurrentUserInfo>>("/api/v1/users/me");
    return {
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

/**
 * POST /api/v1/users/social-login/kakao/native 응답 data.
 *
 * 리다이렉트 콜백이 쿼리스트링으로 주던 것과 같은 정보를 JSON 으로 받는다.
 * 제재 회원도 HTTP 200 / success:true 로 내려오므로 `sanctioned` 로 분기해야 한다
 * (accessToken 이 null 이라는 사실로 판단하지 말 것).
 */
export type NativeSocialLoginResult = {
    /** 우리 서비스 JWT. 제재 회원은 null. */
    accessToken?: string | null;
    signupRequired: boolean;
    sanctioned: boolean;
    /** MEMBER_SUSPENDED | MEMBER_BANNED. 제재가 아니면 null. */
    sanctionCode?: string | null;
    /**
     * 정지 해제 예정 일시. 정지일 때만 값이 있다.
     *
     * ⚠️ 이 값은 **본문**이라 `yyyy-MM-dd HH:mm:ss` 다. ISO-8601 인 것은
     * 리다이렉트 콜백 쿼리의 suspendedUntil 뿐이다. parseServerDateTime 이
     * 두 형식을 모두 받으므로 /sanction 화면은 그대로 재사용된다.
     */
    suspendedUntil?: string | null;
};

/**
 * 네이티브 카카오 SDK 가 받아온 카카오 accessToken 을 우리 JWT 로 교환한다(앱 전용).
 *
 * ⚠️ **이 요청은 반드시 웹뷰(JS)에서 나가야 한다.** 네이티브 코드가 직접 호출하면
 * 응답의 `Set-Cookie: refreshToken` 이 네이티브 쿠키 저장소로 들어가 웹뷰가 보지 못하고,
 * 이후 /auth/refresh 가 항상 실패해 **며칠 뒤 원인 모를 로그아웃**이 난다.
 * 네이티브가 맡는 것은 카카오 SDK 로그인 한 조각뿐이다.
 *
 * ⚠️ 요청 바디 필드명은 `accessToken` 이다. docs/be-request-app-push-auth.md §D 는
 * `kakaoAccessToken` 으로 요청했지만 BE 는 `accessToken` 으로 구현했고 라이브 스펙이 정본이다.
 *
 * `credentials: "include"` 가 없으면 refreshToken 쿠키가 저장되지 않는다 —
 * externalApiFetch 의 기본값이 아니므로 명시해야 한다.
 */
export function loginWithExternalKakaoNative(
    kakaoAccessToken: string,
): Promise<NativeSocialLoginResult> {
    return externalApiFetch<NativeSocialLoginResult>("/api/v1/users/social-login/kakao/native", {
        method: "POST",
        body: { accessToken: kakaoAccessToken },
        credentials: "include",
    });
}

/**
 * 네이티브 Sign in with Apple 이 받아온 identityToken 을 우리 JWT 로 교환한다(iOS 앱 전용).
 *
 * ⚠️ **이 계약은 아직 라이브 스펙으로 확인되지 않았다.** BE 가 구현 중이며 위키가 오면
 * 대조해야 한다. 카카오 네이티브(`/kakao/native`)와 같은 자리·같은 응답 모양을 전제로
 * 미리 배선해 둔 것이고, 응답 타입(NativeSocialLoginResult)과 결말 분기
 * (resolveSocialLogin)를 그대로 공유한다. 스펙이 다르면 **고칠 곳은 이 함수 하나**다.
 *
 * 요청 필드가 카카오보다 많은 이유:
 * - `identityToken` — 서버가 애플 JWKS 로 검증하는 본체.
 * - `authorizationCode` — 서버가 `/auth/token` 으로 교환해 refresh token 을 보관한다.
 *   **탈퇴 시 애플 토큰 폐기(`/auth/revoke`)에 필요하고, 그건 애플의 의무 사항이다.**
 * - `nonce` — 네이티브가 만든 원본. 서버가 해시해 토큰의 nonce 클레임과 대조한다.
 * - `fullName` — **최초 인증 1회만** 오고 토큰에는 들어 있지 않다. 서버가 첫 로그인에
 *   저장하지 않으면 영영 받을 수 없다. 이메일은 토큰 안에 있으므로 보내지 않는다.
 *
 * ⚠️ 교환 요청이 웹뷰(JS)에서 나가야 하는 이유는 카카오와 같다 —
 * loginWithExternalKakaoNative 주석 참고.
 */
export function loginWithExternalAppleNative(params: {
    identityToken: string;
    authorizationCode: string | null;
    nonce: string;
    fullName: string | null;
}): Promise<NativeSocialLoginResult> {
    return externalApiFetch<NativeSocialLoginResult>("/api/v1/users/social-login/apple/native", {
        method: "POST",
        body: {
            identityToken: params.identityToken,
            authorizationCode: params.authorizationCode,
            nonce: params.nonce,
            fullName: params.fullName,
        },
        credentials: "include",
    });
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
