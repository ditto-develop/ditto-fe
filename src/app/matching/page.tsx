"use client";

import { useRouter } from "next/navigation";
import { goBackOr } from "@/shared/lib/navigation";
import { MatchingResultContainer } from "@/features/matching/containers/MatchingResultContainer";
import type { ProfileClickInfo } from "@/features/matching/containers/MatchingResultContainer";

export default function MatchingPage() {
    const router = useRouter();

    function handleProfileClick({ userId, quizSetId, matchRequestId, state }: ProfileClickInfo) {
        const params = new URLSearchParams({ quizSetId, state });
        if (matchRequestId) params.set("matchRequestId", matchRequestId);
        router.push(`/profile/${userId}?${params.toString()}`);
    }

    return (
        <MatchingResultContainer
            onBack={() => goBackOr(router, "/home")}
            onProfileClick={handleProfileClick}
        />
    );
}
