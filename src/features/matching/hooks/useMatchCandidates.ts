"use client";

import { useState, useEffect } from "react";
import {
    getMatchCandidates,
    getMatchingStatus,
    type MatchCandidateDto,
    type MatchRequestDto,
} from "@/features/matching/api/matchingApi";
import type { MatchProfile } from "@/features/matching/model/types";

export interface MatchItem {
    profile: MatchProfile;
    matchRate: number;
    hasRequested: boolean;
    hasReceivedRequest: boolean;
    matchRequestId?: string;
}

function toGenderKo(gender: string): string {
    if (gender === "MALE") return "남자";
    if (gender === "FEMALE") return "여자";
    return gender;
}

function toMatchProfile(c: MatchCandidateDto): MatchProfile {
    return {
        id: c.userId,
        nickname: c.nickname,
        age: c.age,
        gender: toGenderKo(c.gender),
        location: c.location || "",
        bio: c.introduction || "",
        avatarUrl: c.profileImageUrl || "",
    };
}

function mergeWithStatus(
    candidates: MatchCandidateDto[],
    sentRequests: MatchRequestDto[],
    receivedRequests: MatchRequestDto[]
): MatchItem[] {
    return candidates.map((c) => {
        const sent = sentRequests.find((r) => r.toUserId === c.userId);
        const received = receivedRequests.find((r) => r.fromUserId === c.userId);
        return {
            profile: toMatchProfile(c),
            // getMatchBadgeInfo은 0~12 개수 기준 → matchedQuestions 사용
            matchRate: c.scoreBreakdown?.matchedQuestions ?? 0,
            hasRequested: !!sent,
            hasReceivedRequest: !!received,
            matchRequestId: sent?.id ?? received?.id,
        };
    });
}

export function useMatchCandidates() {
    const [quizSetId, setQuizSetId] = useState<string>("");
    const [candidates, setCandidates] = useState<MatchItem[]>([]);
    const [hasAcceptedMatch, setHasAcceptedMatch] = useState(false);
    const [acceptedMatchUserId, setAcceptedMatchUserId] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const { quizSetId: qid, candidates: raw } = await getMatchCandidates();
                const { sentRequests, receivedRequests, hasAcceptedMatch: accepted, acceptedMatchUserId: acceptedId } = await getMatchingStatus(qid);
                setQuizSetId(qid);
                setHasAcceptedMatch(accepted);
                setAcceptedMatchUserId(acceptedId);
                setCandidates(mergeWithStatus(raw, sentRequests, receivedRequests));
            } catch (e) {
                setError(e as Error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return { quizSetId, candidates, hasAcceptedMatch, acceptedMatchUserId, loading, error };
}
