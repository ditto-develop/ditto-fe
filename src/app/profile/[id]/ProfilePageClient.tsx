"use client";

import { Suspense, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { IntroNoteContainer } from "@/features/profile/containers/IntroNoteContainer";
import type { IntroNoteState } from "@/features/profile";
import { resolveStaticRouteParam } from "@/shared/lib/staticRouteParam";

function ProfileContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const [userId] = useState(() => resolveStaticRouteParam("profile", String(params.id)));
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
    return (
        <Suspense>
            <ProfileContent />
        </Suspense>
    );
}
