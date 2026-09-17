"use client";

import { useState, useEffect } from "react";
import { getUserProfile, type PublicProfileDto } from "@/features/profile/api/profileApi";
import type { ProfileInfo } from "@/features/profile/model/types";
import { toLocationLabel, toOccupationLabel, toInterestLabel } from "@/shared/lib/profileLabels";

function toGenderKo(gender: string): string {
    if (gender === "MALE") return "남성";
    if (gender === "FEMALE") return "여성";
    return gender;
}

function toProfileInfo(dto: PublicProfileDto): ProfileInfo {
    return {
        id: dto.userId,
        nickname: dto.nickname,
        age: dto.age,
        gender: toGenderKo(dto.gender),
        location: dto.location ? toLocationLabel(dto.location) : "",
        occupation: dto.occupation ? toOccupationLabel(dto.occupation) : undefined,
        bio: dto.introduction || "",
        avatarUrl: dto.profileImageUrl || "",
        rating: dto.rating,
        interests: (dto.interests ?? []).map(toInterestLabel),
    };
}

export function useUserProfile(userId: string) {
    const [profile, setProfile] = useState<ProfileInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!userId) return;

        let active = true;
        setLoading(true);
        setError(null);

        getUserProfile(userId)
            .then((dto) => toProfileInfo(dto))
            .then((info) => {
                if (active) setProfile(info);
            })
            .catch((cause: unknown) => {
                if (active) setError(cause as Error);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [userId]);

    return { profile, loading, error };
}
