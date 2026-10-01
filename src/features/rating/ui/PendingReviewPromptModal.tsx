"use client";

import { toTargetNickname } from "@/features/rating/model/labels";
import type { MemberReview } from "@/features/rating/model/types";
import { AlertModal } from "@/shared/ui";

interface PendingReviewPromptModalProps {
  review: MemberReview | null;
  onStart: () => void;
  onSkip: () => void;
}

function toPromptMessage(review: MemberReview): string {
  const [target] = review.targets;
  const subject =
    review.matchType === "GROUP" || !target
      ? "지난 그룹 채팅"
      : `${toTargetNickname(target)}님과의 채팅`;
  return `${subject} 평가가 아직 남아 있어요.\n남겨주신 평가는 다음 매칭과 만남에 도움이 돼요.`;
}

/** 앱 첫 진입 시 남은 평가를 안내한다. 뒤로가기는 건너뛰기로 취급한다. */
export function PendingReviewPromptModal({
  review,
  onStart,
  onSkip,
}: PendingReviewPromptModalProps) {
  if (!review) return null;

  return (
    <AlertModal
      isOpen
      title="지난 채팅은 어떠셨나요?"
      message={toPromptMessage(review)}
      cancelParams={{ text: "건너뛰기", onClick: onSkip }}
      confirmParams={{ text: "평가하기", onClick: onStart }}
    />
  );
}
