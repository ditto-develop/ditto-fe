"use client";

import { useState, useEffect, useRef } from "react";
import {
    getMatchCandidates,
    getMatchingStatus,
    type MatchCandidateDto,
    type MatchRequestDto,
    type MatchRequestStatus,
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
    /** 내가 보낸 신청을 상대가 거절했다 */
    wasRejectedByThem: boolean;
    /** 상대가 보낸 신청을 내가 거절했다 */
    didRejectThem: boolean;
    /**
     * 둘 중 한 사람이 같은 주에 다른 사람과 성사돼 서버가 끝낸 신청(CANCELLED).
     * 누가 성사됐는지는 hasAcceptedMatch 로 가른다 — 한 쌍의 신청은 한 주에 한 건뿐이라
     * 내가 성사됐다면 그 상대는 이 후보가 아니다.
     */
    wasCancelled: boolean;
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

/**
 * 아직 진행 중인 요청 상태. 서버는 거절·취소·만료된 요청도 목록에 그대로 내려주므로
 * (보낸 목록에서 "거절당함"을 보여주려면 필요하다) 화면이 상태로 걸러야 한다.
 * 걸러지지 않으면 거절한 요청이 수락하기 탭에 계속 남는다.
 */
const ACTIVE_REQUEST_STATUSES: MatchRequestStatus[] = ["PENDING", "ACCEPTED"];

const isActive = (request?: MatchRequestDto): boolean =>
    !!request && ACTIVE_REQUEST_STATUSES.includes(request.status);

const isCancelled = (request?: MatchRequestDto): boolean => request?.status === "CANCELLED";

/** 거절로 보이는 끝난 요청. 서버가 만들지 않는 EXPIRED 도 여기 남겨 신청 버튼이 되살아나지 않게 한다. */
const isRejected = (request?: MatchRequestDto): boolean =>
    !!request && !isActive(request) && !isCancelled(request);

function mergeWithStatus(
    candidates: MatchCandidateDto[],
    sentRequests: MatchRequestDto[],
    receivedRequests: MatchRequestDto[]
): MatchItem[] {
    return candidates.map((c) => {
        const sent = sentRequests.find((r) => r.toUserId === c.userId);
        const received = receivedRequests.find((r) => r.fromUserId === c.userId);
        // 끝난 요청은 다시 신청할 수도 없다 — 서버가 같은 주의 재요청을 MATCH_REQUEST_ALREADY_EXISTS
        // 로 막으므로, 신청 버튼을 되살리면 누를 때마다 실패한다. 전용 상태로 표시한다.
        // 방향을 나누는 이유: "내가 거절했다"와 "거절당했다"는 사용자에게 전혀 다른 사실이다.
        // 다른 1:1 성사로 서버가 취소한 신청(CANCELLED, BE #236)은 거절과 따로 둔다 — 거절한 적 없는
        // 회원이 "거절"로 보인다는 문의가 들어왔다(2026-10-22, 2026-10-07 의 "거절과 같게" 결정을 뒤집음).
        const wasRejectedByThem = isRejected(sent);
        const didRejectThem = isRejected(received);
        const wasCancelled = isCancelled(sent) || isCancelled(received);
        return {
            profile: toMatchProfile(c),
            // 뱃지 등급/문구는 일치 개수·전체 문항 수 기준 (getMatchBadgeInfo)
            matchedQuestions: c.scoreBreakdown?.matchedQuestions ?? 0,
            totalQuestions: c.scoreBreakdown?.totalQuestions ?? 0,
            // 정렬용 퍼센트 (가변 total에서도 일관)
            matchRate: c.scoreBreakdown?.quizMatchRate ?? c.matchRate ?? 0,
            hasRequested: isActive(sent),
            hasReceivedRequest: isActive(received),
            wasRejectedByThem,
            didRejectThem,
            wasCancelled,
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
