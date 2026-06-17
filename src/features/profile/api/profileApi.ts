/**
 * Profile feature API functions
 */

import { apiFetch } from "@/shared/lib/api/client";
import {
    getExternalMyIntroNotes,
    getExternalUserIntroNotes,
} from "@/shared/lib/api/externalApi";
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

export function getUserProfile(userId: string): Promise<PublicProfileDto> {
    return apiFetch(`/users/${userId}/profile`);
}

export function getMyProfile(): Promise<PublicProfileDto> {
    return apiFetch("/users/me/profile");
}

export function updateMyProfile(body: UpdateMyProfileRequest): Promise<PublicProfileDto> {
    return apiFetch("/users/me/profile", {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}

export function getMyStats(): Promise<MyStats> {
    return apiFetch("/users/me/stats");
}

export function getMyRatingSummary(): Promise<MyRatingSummary> {
    return apiFetch("/users/me/ratings");
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
