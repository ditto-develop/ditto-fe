"use client";

import { useRouter } from "next/navigation";
import { MatchingResultContainer } from "@/features/matching/containers/MatchingResultContainer";
import type { ProfileClickInfo } from "@/features/matching/containers/MatchingResultContainer";

export default function MatchingPage() {
  console.log('[src/app/matching/page.tsx] MatchingPage'); // __component_log__
    const router = useRouter();

    function handleProfileClick({ userId, quizSetId, matchRequestId, state }: ProfileClickInfo) {
        const params = new URLSearchParams({ quizSetId, state });
        if (matchRequestId) params.set("matchRequestId", matchRequestId);
        router.push(`/profile/${userId}?${params.toString()}`);
    }

    return (
        <MatchingResultContainer
            onBack={() => router.push("/home")}
            onProfileClick={handleProfileClick}
        />
    );
}
