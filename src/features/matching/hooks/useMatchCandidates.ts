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

function toMatchProfile(c: MatchCandidateDto): MatchProfile {
    return {
        id: c.userId,
        nickname: c.nickname,
        age: c.age,
        gender: c.gender,
        location: c.location || "",
        bio: c.introduction || "",
        avatarUrl: "",
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const { quizSetId: qid, candidates: raw } = await getMatchCandidates();
                const { sentRequests, receivedRequests } = await getMatchingStatus(qid);
                setQuizSetId(qid);
                setCandidates(mergeWithStatus(raw, sentRequests, receivedRequests));
            } catch (e) {
                setError(e as Error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return { quizSetId, candidates, loading, error };
}
