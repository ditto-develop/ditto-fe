"use client";

import { useEffect, useState } from "react";
import { getMyProfile, type PublicProfileDto } from "@/features/profile/api/profileApi";
import type { ProfileInfo } from "@/features/profile/model/types";
import { toInterestLabel, toLocationLabel, toOccupationLabel } from "@/shared/lib/profileLabels";

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

export function useMyProfile() {
    const [profile, setProfile] = useState<ProfileInfo | null>(null);
    const [rawProfile, setRawProfile] = useState<PublicProfileDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setLoading(true);
        getMyProfile()
            .then((dto) => {
                setRawProfile(dto);
                setProfile(toProfileInfo(dto));
            })
            .catch((e: unknown) => {
                setError(e instanceof Error ? e : new Error("Failed to load my profile"));
            })
            .finally(() => setLoading(false));
    }, []);

    return { profile, rawProfile, loading, error };
}
