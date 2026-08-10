"use client";

import { useState } from "react";
import { isAnswered } from "@/features/rating/api/reviewApi";
import { useReviewSubmission } from "@/features/rating/hooks/useReviewSubmission";
import type {
  GroupReviewFormValue,
  MemberReview,
  ReviewFormValue,
  ReviewTarget,
} from "@/features/rating/model/types";

const INITIAL_FORM: GroupReviewFormValue = {
  meetingStatus: null,
  rating: 0,
  comment: "",
  wantsOneToOneRematch: false,
};

/**
 * 그룹 평가는 대상마다 PUT을 한 번씩 보내고, 마지막 대상을 내면 서버가 자동으로 완료한다.
 * 제출이 최종이라 배치로 모아 보내지 않고 "다음"을 누를 때마다 바로 확정한다.
 * 이미 answeredAt이 있는 대상은 건너뛴다.
 */
export function useGroupRating(review: MemberReview, reload: () => Promise<void>) {
  // 진행 중 목록이 흔들리지 않도록 진입 시점의 미제출 대상을 고정한다.
  const [pendingTargets] = useState<ReviewTarget[]>(() =>
    review.targets.filter((target) => !isAnswered(target)),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [form, setForm] = useState<GroupReviewFormValue>(INITIAL_FORM);
  const { submitting, rematch, clearRematch, submitTarget } = useReviewSubmission(review, reload);

  const currentTarget = pendingTargets[currentIndex] ?? null;
  const isLast = currentIndex === pendingTargets.length - 1;
  const canContinue = form.meetingStatus !== null && form.rating > 0 && !submitting && currentTarget !== null;

  const setFormValue = (value: ReviewFormValue) => {
    setForm((previous) => ({ ...previous, ...value }));
  };

  const setWantsOneToOneRematch = (wantsOneToOneRematch: boolean) => {
    setForm((previous) => ({ ...previous, wantsOneToOneRematch }));
  };

  /** 현재 대상을 확정한다. 남은 대상이 있으면 다음으로 넘어가고, 없으면 true를 돌려준다. */
  const submitCurrent = async (): Promise<{ completed: boolean } | null> => {
    if (!canContinue || !currentTarget) return null;

    const result = await submitTarget(currentTarget.memberId, form, form.wantsOneToOneRematch);
    if (!result) return null;

    if (isLast) return { completed: true };

    setCurrentIndex((index) => index + 1);
    setForm(INITIAL_FORM);
    return { completed: false };
  };

  return {
    pendingTargets,
    currentTarget,
    currentIndex,
    total: pendingTargets.length,
    form,
    setFormValue,
    setWantsOneToOneRematch,
    isLast,
    canContinue,
    submitting,
    rematch,
    clearRematch,
    submitCurrent,
  };
}
