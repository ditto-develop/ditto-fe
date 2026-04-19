"use client";

import { Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { IntroNoteContainer } from "@/features/profile/containers/IntroNoteContainer";
import type { IntroNoteState } from "@/features/profile";

function ProfileContent() {
  console.log('[src/app/profile/[id]/page.tsx] ProfileContent'); // __component_log__
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const userId = String(params.id);
    const quizSetId = searchParams.get("quizSetId") ?? undefined;
    const matchRequestId = searchParams.get("matchRequestId") ?? undefined;
    const rawState = searchParams.get("state");
    const initialState: IntroNoteState =
        rawState === "after_acceptance" ||
        rawState === "completed" ||
        rawState === "chat_started"
            ? rawState
            : "before_request";

    return (
        <IntroNoteContainer
            userId={userId}
            quizSetId={quizSetId}
            matchRequestId={matchRequestId}
            initialState={initialState}
            onBack={() => router.back()}
        />
    );
}

export function ProfilePageClient() {
  console.log('[src/app/profile/[id]/page.tsx] ProfilePage'); // __component_log__
    return (
        <Suspense>
            <ProfileContent />
        </Suspense>
    );
}
