"use client";

import { Suspense, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { IntroNoteContainer } from "@/features/profile/containers/IntroNoteContainer";
import type { IntroNoteState } from "@/features/profile";

/**
 * 정적 export(`output: 'export'`) 환경에서 동적 라우트는 빌드 시
 * `generateStaticParams`의 더미값(`placeholder`) 페이지만 생성된다.
 * `/profile/18`을 직접(하드) 로드하면 placeholder 페이지가 서빙되어
 * `useParams().id`가 실제 세그먼트가 아닌 `"placeholder"`를 반환한다.
 * 따라서 클라이언트에서 실제 pathname의 세그먼트로 id를 보정한다.
 */
function resolveProfileId(paramId: string): string {
    if (typeof window === "undefined") return paramId;
    const segments = window.location.pathname.split("/").filter(Boolean);
    const idx = segments.indexOf("profile");
    const real = idx >= 0 ? segments[idx + 1] : undefined;
    if (real && real !== "placeholder") return decodeURIComponent(real);
    return paramId;
}

function ProfileContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const [userId] = useState(() => resolveProfileId(String(params.id)));
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
