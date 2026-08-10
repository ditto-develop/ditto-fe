/**
 * Profile feature API functions
 */

import {
    getExternalMyIntroNotes,
    getExternalUserIntroNotes,
} from "@/shared/lib/api/externalApi";
import { externalApiFetch } from "@/shared/lib/api/externalClient";
import { INTRO_NOTE_FIELDS } from "@/features/profile/model/introNotes";
import type { MyRatingSummary, MyStats } from "@/features/profile/model/types";

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

export function getMyRatingSummary(): Promise<MyRatingSummary> {
    return externalApiFetch<MyRatingSummary>("/api/v1/users/me/ratings");
}

export async function getUserIntroNotes(userId: string): Promise<IntroNoteAnswer[]> {
    const data = await getExternalUserIntroNotes(userId);
    return data.answers
        .filter((item) => item.answer.trim().length > 0)
        .map((item) => ({
            questionCode: item.questionCode,
            question: item.question,
            answer: item.answer,
        }));
}

export async function getMyIntroNoteAnswersByIndex(): Promise<string[]> {
    const data = await getExternalMyIntroNotes();
    const answerByCode = new Map(data.answers.map((item) => [item.questionCode, item.answer]));
    return INTRO_NOTE_FIELDS.map((field) => answerByCode.get(field.code) ?? "");
}
