"use client";

import { useState, useEffect } from "react";
import { getUserProfile, type PublicProfileDto } from "@/features/profile/api/profileApi";
import { getMatchCandidates } from "@/features/matching/api/matchingApi";
import type { MatchCandidateDto } from "@/features/matching/api/matchingApi";
import type { ProfileInfo } from "@/features/profile/model/types";
import { API_ERROR_CODE, hasApiErrorCode } from "@/shared/lib/api/apiError";
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

/**
 * 매칭 후보 정보로 만든 프로필.
 * 후보 목록에는 직업·관심사·평점이 없다. 억지로 채우지 않고 비워 둔다
 * (ProfileIntroView가 빈 값이면 그 영역을 그리지 않는다).
 */
function toProfileInfoFromCandidate(candidate: MatchCandidateDto): ProfileInfo {
    return {
        id: String(candidate.userId),
        nickname: candidate.nickname,
        age: candidate.age,
        gender: toGenderKo(candidate.gender),
        location: candidate.location ? toLocationLabel(candidate.location) : "",
        occupation: undefined,
        bio: candidate.introduction || "",
        avatarUrl: candidate.profileImageUrl || "",
        rating: undefined,
        interests: [],
    };
}

/**
 * 매칭 후보 목록에서 같은 회원을 찾아 온다.
 *
 * 라이브 BE는 `GET /api/v1/users/{id}/profile`을 **매칭이 성사된 상대(또는 같은 그룹
 * 채팅 참여자)** 에게만 허용하고 그 외에는 403(0003)으로 막는다(스펙 명시). 매칭 결과에서
 * 여는 소개노트는 아직 성사 전이라 후보 전원이 403이 된다. 이때 후보 목록이 이미 갖고 있는
 * 공개 정보로 화면을 채운다. 프로필 기능이 매칭을 참조하는 건 이 폴백 하나뿐이다.
 */
async function loadCandidateProfile(userId: string): Promise<ProfileInfo | null> {
    const { candidates } = await getMatchCandidates();
    const found = candidates.find((candidate) => String(candidate.userId) === userId);
    return found ? toProfileInfoFromCandidate(found) : null;
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
            .catch(async (cause: unknown) => {
                // 403(0003)은 '차단'이 아니라 '아직 매칭 성사 전'인 경우가 대부분이다.
                if (!hasApiErrorCode(cause, API_ERROR_CODE.FORBIDDEN)) throw cause;
                const fallback = await loadCandidateProfile(userId).catch(() => null);
                if (!fallback) throw cause;
                return fallback;
            })
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
