/**
 * Profile feature API functions
 */

import {
    getExternalMyIntroNotes,
    getExternalUserIntroNotes,
} from "@/shared/lib/api/externalApi";
import { externalApiFetch } from "@/shared/lib/api/externalClient";
import { INTRO_NOTE_FIELDS } from "@/features/profile/model/introNotes";
import type { AnswerMatchSummary, MyStats, RatingSummary } from "@/features/profile/model/types";

// --- BE DTO ---

export interface PublicProfileDto {
    userId: string;
    nickname: string;
    gender: string;
    age: number;
    introduction?: string;
    profileImageUrl?: string;
    location?: string;
    preferredMinAge?: number;
    preferredMaxAge?: number;
    interests?: string[];
    rating?: number;
    occupation?: string;
}

/**
 * GET /api/v1/users/me/profile · /api/v1/users/{id}/profile 원형(PublicProfileResponse).
 * userId는 int64로 내려오고, 미작성 항목은 null이다.
 * FE는 id를 문자열로 다루므로 toPublicProfile에서 정규화한다.
 */
type ExternalPublicProfile = {
    userId: number | string;
    nickname: string;
    gender?: string | null;
    age?: number | null;
    introduction?: string | null;
    profileImageUrl?: string | null;
    location?: string | null;
    occupation?: string | null;
    interests?: string[] | null;
    rating?: number | null;
    preferredMinAge?: number | null;
    preferredMaxAge?: number | null;
};

export interface IntroNoteAnswer {
    questionCode?: string;
    question: string;
    answer: string;
}

export type UpdateMyProfileRequest = Pick<
    PublicProfileDto,
    "introduction" | "profileImageUrl" | "interests"
>;

// --- API ---

function toPublicProfile(raw: ExternalPublicProfile): PublicProfileDto {
    return {
        userId: String(raw.userId ?? ""),
        nickname: raw.nickname,
        gender: raw.gender ?? "",
        age: raw.age ?? 0,
        introduction: raw.introduction ?? undefined,
        profileImageUrl: raw.profileImageUrl ?? undefined,
        location: raw.location ?? undefined,
        occupation: raw.occupation ?? undefined,
        interests: raw.interests ?? [],
        rating: raw.rating ?? undefined,
        preferredMinAge: raw.preferredMinAge ?? undefined,
        preferredMaxAge: raw.preferredMaxAge ?? undefined,
    };
}

export function getUserProfile(userId: string): Promise<PublicProfileDto> {
    return externalApiFetch<ExternalPublicProfile>(`/api/v1/users/${userId}/profile`).then(
        toPublicProfile,
    );
}

export function getMyProfile(): Promise<PublicProfileDto> {
    return externalApiFetch<ExternalPublicProfile>("/api/v1/users/me/profile").then(toPublicProfile);
}

/**
 * 생략한 필드는 변경되지 않는다(부분 수정).
 * 수정 가능한 값은 introduction(최대 50자) / profileImageUrl / interests(1~5개)뿐이며,
 * 닉네임·성별·나이·사는곳·직업은 서버가 받지 않는다.
 */
export function updateMyProfile(body: UpdateMyProfileRequest): Promise<PublicProfileDto> {
    return externalApiFetch<ExternalPublicProfile>("/api/v1/users/me/profile", {
        method: "PATCH",
        body,
    }).then(toPublicProfile);
}

export function getMyStats(): Promise<MyStats> {
    return externalApiFetch<MyStats>("/api/v1/users/me/stats");
}

export function getMyRatingSummary(): Promise<RatingSummary> {
    return externalApiFetch<RatingSummary>("/api/v1/users/me/ratings");
}

/**
 * 상대가 받은 평가. `/users/me/ratings` 와 스키마가 완전히 같다.
 *
 * 열람 권한은 공개 프로필과 동일하다 — 매칭이 성사된 상대나 같은 그룹채팅 참여자만 볼 수
 * 있고, 아니면 0003(403)이다. 프로필은 보이는데 평점만 403인 상황은 없다.
 */
export function getUserRatingSummary(userId: string): Promise<RatingSummary> {
    return externalApiFetch<RatingSummary>(`/api/v1/users/${userId}/ratings`);
}

/**
 * `GET /users/{id}/answers` 원형. quizSetId는 int64로 내려오고, 함께 완주한
 * 퀴즈셋이 없으면 null이다.
 */
type ExternalAnswerMatch = {
    quizSetId?: number | string | null;
    matchedCount?: number | null;
    totalCount?: number | null;
    matchRate?: number | null;
};

/**
 * 상대와 나의 답변 일치 요약("나와 같은 답").
 *
 * 등급 라벨 문구는 서버가 주지 않는다 — FE의 `getMatchBadgeInfo`가 정본이다.
 * 그룹의 "평균 일치 수"도 멤버별로 이 API를 부른 뒤 FE가 평균을 낸다.
 */
export function getUserAnswerMatch(userId: string): Promise<AnswerMatchSummary> {
    return externalApiFetch<ExternalAnswerMatch>(`/api/v1/users/${userId}/answers`).then((raw) => ({
        quizSetId: raw.quizSetId != null ? String(raw.quizSetId) : null,
        matchedCount: raw.matchedCount ?? 0,
        totalCount: raw.totalCount ?? 0,
        matchRate: raw.matchRate ?? 0,
    }));
}

export async function getUserIntroNotes(userId: string): Promise<IntroNoteAnswer[]> {
    const data = await getExternalUserIntroNotes(userId);
    return data.answers
        .filter((item) => item.answer.trim().length > 0)
        .map((item) => {
            const localField = INTRO_NOTE_FIELDS.find((field) => field.code === item.questionCode);

            return {
                questionCode: item.questionCode,
                question: localField?.question ?? item.question,
                answer: item.answer,
            };
        });
}

export async function getMyIntroNoteAnswersByIndex(): Promise<string[]> {
    const data = await getExternalMyIntroNotes();
    const answerByCode = new Map(data.answers.map((item) => [item.questionCode, item.answer]));
    return INTRO_NOTE_FIELDS.map((field) => answerByCode.get(field.code) ?? "");
}
