"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SecretMatchingCard } from "@/components/home/_parts/SecretMatchingCard";
import { useToast } from "@/context/ToastContext";
import type { SecretMatchingCardState, SecretMatchingStatus } from "@/features/matching/model/secretMatching";
import { buildLateQuizPath, toSecretRoundDay } from "@/features/matching/model/secretMatching";
import { MIN_INTRO_NOTE_ANSWERS } from "@/features/profile/model/introNotes";
import { AlertModal } from "@/shared/ui";

/**
 * 시크릿 매칭 홈 카드(A·B·C·D)와 그 버튼이 가는 곳.
 *
 * - [퀴즈 풀어보기] → 바텀시트 없이 이번 주 1:1 퀴즈로 바로 간다. 정규 퀴즈 카드(ThisWeekQuiz)처럼 소개 노트가
 *   모자라면 먼저 작성하게 한다.
 * - [지난 퀴즈 풀어보기] → 기록 탭.
 */
export function SecretMatchingHome({
  state,
  status,
  introNoteCount,
}: {
  state: SecretMatchingCardState;
  status: SecretMatchingStatus;
  /** 조회에 실패해 모르면 null — 그때는 막지 않는다(ThisWeekQuiz 와 같다). */
  introNoteCount: number | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [introNoteAlertOpen, setIntroNoteAlertOpen] = useState(false);

  const startQuiz = () => {
    if (introNoteCount !== null && introNoteCount < MIN_INTRO_NOTE_ANSWERS) {
      setIntroNoteAlertOpen(true);
      return;
    }
    if (!status.quizSetId) {
      showToast("이번 주 1:1 퀴즈를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.", "error");
      return;
    }
    router.push(buildLateQuizPath(status.quizSetId));
  };

  return (
    <>
      <AlertModal
        isOpen={introNoteAlertOpen}
        title="소개 노트를 먼저 작성해주세요"
        message={`퀴즈에 참여하려면 소개 노트를 최소 ${MIN_INTRO_NOTE_ANSWERS}개 이상 작성해야 해요.`}
        confirmParams={{
          text: "작성하러 가기",
          onClick: () => router.push("/onboarding/intro"),
        }}
        cancelParams={{
          text: "닫기",
          onClick: () => setIntroNoteAlertOpen(false),
        }}
        onClose={() => setIntroNoteAlertOpen(false)}
      />
      <SecretMatchingCard
        state={state}
        roundDay={toSecretRoundDay(status.nextRoundAt)}
        onStartQuiz={startQuiz}
        onOpenRecords={() => router.push("/records")}
      />
    </>
  );
}
