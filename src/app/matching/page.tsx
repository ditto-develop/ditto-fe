"use client";

import { useRouter } from "next/navigation";
import MatchingResultContainer from "@/features/matching/containers/MatchingResultContainer";
import type { MatchProfile } from "@/features/matching";

// TODO: Replace with real API data
const dummyMatches = [
    {
        profile: {
            id: "1",
            nickname: "사부작사부작",
            age: 27,
            gender: "여성",
            location: "서울",
            bio: "느긋한 집순이",
            avatarUrl: "/assets/avatar/f1.svg",
            matchRate: 11,
        } as MatchProfile,
        matchRate: 11,
        hasRequested: false,
        hasReceivedRequest: true,
    },
    {
        profile: {
            id: "2",
            nickname: "커피홀릭",
            age: 31,
            gender: "여성",
            location: "서울",
            bio: "조용한 카페 탐방러",
            avatarUrl: "/assets/avatar/f2.svg",
            matchRate: 9,
        } as MatchProfile,
        matchRate: 9,
        hasRequested: true,
        hasReceivedRequest: false,
    },
    {
        profile: {
            id: "3",
            nickname: "Lemon Tea",
            age: 32,
            gender: "여성",
            location: "서울",
            bio: "느긋한 집순이",
            avatarUrl: "/assets/avatar/f5.svg",
            matchRate: 7,
        } as MatchProfile,
        matchRate: 7,
        hasRequested: false,
        hasReceivedRequest: false,
    },
    {
        profile: {
            id: "4",
            nickname: "와그작",
            age: 37,
            gender: "남성",
            location: "서울",
            bio: "게임, UFC 좋아해요",
            avatarUrl: "/assets/avatar/m3.svg",
            matchRate: 5,
        } as MatchProfile,
        matchRate: 5,
        hasRequested: false,
        hasReceivedRequest: false,
    },
];

export default function MatchingPage() {
    const router = useRouter();

    return (
        <MatchingResultContainer
            matches={dummyMatches}
            onBack={() => router.push("/home")}
            onProfileClick={(id) => router.push(`/profile/${id}`)}
        />
    );
}
