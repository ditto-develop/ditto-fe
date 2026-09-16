"use client";

import { useState, useEffect, useRef } from "react";
import {
    getMatchCandidates,
    getMatchingStatus,
    type MatchCandidateDto,
    type MatchRequestDto,
} from "@/features/matching/api/matchingApi";
import type { MatchProfile } from "@/features/matching/model/types";
import { toLocationLabel } from "@/shared/lib/profileLabels";

export interface MatchItem {
    profile: MatchProfile;
    matchRate: number; // 정렬용 일치율 퍼센트 (quizMatchRate)
    matchedQuestions: number;
    totalQuestions: number;
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
        location: c.location ? toLocationLabel(c.location) : "",
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
            // 뱃지 등급/문구는 일치 개수·전체 문항 수 기준 (getMatchBadgeInfo)
            matchedQuestions: c.scoreBreakdown?.matchedQuestions ?? 0,
            totalQuestions: c.scoreBreakdown?.totalQuestions ?? 0,
            // 정렬용 퍼센트 (가변 total에서도 일관)
            matchRate: c.scoreBreakdown?.quizMatchRate ?? c.matchRate ?? 0,
            hasRequested: !!sent,
            hasReceivedRequest: !!received,
            matchRequestId: sent?.id ?? received?.id,
        };
    });
}

const POLLING_INTERVAL = 5000;

export function useMatchCandidates() {
    const [quizSetId, setQuizSetId] = useState<string>("");
    const [candidates, setCandidates] = useState<MatchItem[]>([]);
    const [hasAcceptedMatch, setHasAcceptedMatch] = useState(false);
    const [acceptedMatchUserId, setAcceptedMatchUserId] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const rawCandidatesRef = useRef<MatchCandidateDto[]>([]);

    useEffect(() => {
        async function load() {
            try {
                const { quizSetId: qid, candidates: raw } = await getMatchCandidates();
                const { sentRequests, receivedRequests, hasAcceptedMatch: accepted, acceptedMatchUserId: acceptedId } = await getMatchingStatus(qid);
                rawCandidatesRef.current = raw;
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

    useEffect(() => {
        if (!quizSetId) return;

        const poll = async () => {
            try {
                const { sentRequests, receivedRequests, hasAcceptedMatch: accepted, acceptedMatchUserId: acceptedId } = await getMatchingStatus(quizSetId);
                setHasAcceptedMatch(accepted);
                setAcceptedMatchUserId(acceptedId);
                setCandidates(mergeWithStatus(rawCandidatesRef.current, sentRequests, receivedRequests));
            } catch {
                // 폴링 실패는 무시
            }
        };

        const id = setInterval(poll, POLLING_INTERVAL);
        return () => clearInterval(id);
    }, [quizSetId]);

    return { quizSetId, candidates, hasAcceptedMatch, acceptedMatchUserId, loading, error };
}
