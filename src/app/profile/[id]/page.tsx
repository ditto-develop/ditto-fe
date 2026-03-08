"use client";

import { useRouter, useParams } from "next/navigation";
import IntroNoteContainer from "@/features/profile/containers/IntroNoteContainer";
import type { ProfileInfo, QuizAnswer, IntroNoteState } from "@/features/profile";
import { useState } from "react";

// TODO: Replace with real API data fetched by profile ID
const dummyProfile: ProfileInfo = {
    id: "2",
    nickname: "커피홀릭",
    age: 32,
    gender: "여성",
    location: "서울",
    occupation: "유통/판매",
    bio: "조용한 카페 탐방러",
    avatarUrl: "/assets/avatar/f2.svg",
    rating: 4.5,
    interests: ["🏃 운동", "🎬 영화/드라마", "🖼️ 전시"],
};

const dummyQuizAnswers: QuizAnswer[] = [
    { questionNumber: 5, question: "최근 1년 내 가장 잘한 선택은?", answer: "퇴사하고 커피 공부한 것" },
    { questionNumber: 6, question: "나를 가장 행복하게 만드는 순간은?", answer: "새로운 여행지의 카페가보기" },
    { questionNumber: 10, question: "나를 한 단어로 표현한다면?", answer: "조용한 카페 탐방러" },
];

export default function ProfilePage() {
    const router = useRouter();
    const params = useParams();
    // TODO: Determine state from API (whether user has received or sent request)
    const [noteState] = useState<IntroNoteState>("before_request");

    return (
        <IntroNoteContainer
            profile={dummyProfile}
            quizAnswers={dummyQuizAnswers}
            state={noteState}
            onBack={() => router.back()}
            onRequest={() => {
                // TODO: POST /matches/request
                alert("대화 신청 완료!");
            }}
            onAccept={() => {
                // TODO: POST /matches/group/accept
                alert("대화 수락 완료!");
            }}
            onReject={() => {
                // TODO: reject logic
                router.back();
            }}
        />
    );
}
