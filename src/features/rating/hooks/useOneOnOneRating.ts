"use client";

import { useMemo, useState } from "react";
import { useReviewSubmission } from "@/features/rating/hooks/useReviewSubmission";
import type { MemberReview, ReviewFormValue, ReviewSubmitResult } from "@/features/rating/model/types";

const INITIAL_FORM: ReviewFormValue = {
  meetingStatus: null,
  rating: 0,
  comment: "",
};

/** 1:1 평가는 대상이 1명이고 wantsOneToOneRematch를 보내면 8002다. */
export function useOneOnOneRating(review: MemberReview, reload: () => Promise<void>) {
  const [form, setForm] = useState<ReviewFormValue>(INITIAL_FORM);
  const { submitting, rematch, clearRematch, submitTarget } = useReviewSubmission(review, reload);

  const target = review.targets[0] ?? null;
  const canSubmit = useMemo(
    () => form.meetingStatus !== null && form.rating > 0 && !submitting && target !== null,
    [form.meetingStatus, form.rating, submitting, target],
  );

  const submit = async (): Promise<ReviewSubmitResult | null> => {
    if (!canSubmit || !target) return null;
    return submitTarget(target.memberId, form);
  };

  return { target, form, setForm, submitting, canSubmit, rematch, clearRematch, submit };
}
