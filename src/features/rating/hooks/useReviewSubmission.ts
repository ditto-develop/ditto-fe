"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { submitMemberReview, toSubmitReviewBody } from "@/features/rating/api/reviewApi";
import { toReviewError } from "@/features/rating/lib/reviewError";
import {
  isRematchAnnounced,
  markRematchAnnounced,
  rememberSubmittedReview,
} from "@/features/rating/lib/reviewStorage";
import type {
  MeetingStatus,
  MemberReview,
  RematchInfo,
  ReviewFormValue,
  ReviewSubmitResult,
} from "@/features/rating/model/types";

interface UseReviewSubmissionResult {
  submitting: boolean;
  /** 아직 알리지 않은 성사. 축하 화면을 닫으면 clearRematch로 비운다. */
  rematch: RematchInfo | null;
  clearRematch: () => void;
  submitTarget: (
    memberId: number,
    form: ReviewFormValue,
    wantsOneToOneRematch?: boolean,
  ) => Promise<ReviewSubmitResult | null>;
}

/**
 * 대상 한 명 제출. 실패는 여기서 토스트로 처리하고 null을 돌려준다.
 * 8005/8004는 화면과 서버 상태가 어긋난 것이므로 목록을 다시 읽어 확정 상태로 되돌린다.
 */
export function useReviewSubmission(
  review: MemberReview,
  reload: () => Promise<void>,
): UseReviewSubmissionResult {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [rematch, setRematch] = useState<RematchInfo | null>(null);

  const submitTarget = useCallback(
    async (memberId: number, form: ReviewFormValue, wantsOneToOneRematch?: boolean) => {
      if (submitting || form.meetingStatus === null) return null;

      const body = toSubmitReviewBody(
        { ...form, meetingStatus: form.meetingStatus as MeetingStatus },
        wantsOneToOneRematch,
      );

      setSubmitting(true);
      try {
        // 성사 회수용 재전송에 쓸 수 있도록 보낸 값을 그대로 남긴다.
        rememberSubmittedReview(review.reviewId, memberId, body);
        const result = await submitMemberReview(review.reviewId, memberId, body);

        // rematch는 재전송에도 다시 실려 오므로 이미 알린 성사는 건너뛴다.
        if (result.rematch && !isRematchAnnounced(result.rematch.matchedMemberId, result.rematch.matchedAt)) {
          markRematchAnnounced(result.rematch.matchedMemberId, result.rematch.matchedAt);
          setRematch(result.rematch);
        }

        return result;
      } catch (err: unknown) {
        const { kind, message } = toReviewError(err);
        showToast(message, "error");
        if (kind === "already-answered" || kind === "not-found") await reload();
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [review.reviewId, reload, showToast, submitting],
  );

  const clearRematch = useCallback(() => setRematch(null), []);

  return { submitting, rematch, clearRematch, submitTarget };
}
