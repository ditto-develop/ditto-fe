"use client";

import { useEffect, useState } from "react";
import { getMemberReviews } from "@/features/rating/api/reviewApi";
import type { MemberReview } from "@/features/rating/model/types";

/**
 * 아직 완료하지 않은 평가. 채팅방 목록에서 평가 진입점을 띄우는 데 쓴다.
 * 라이브 채팅 계약에는 방 종료 상태가 없어서, 평가가 열렸는지는 이 목록으로만 안다.
 */
export function usePendingReviews(): { reviews: MemberReview[]; loading: boolean } {
  const [reviews, setReviews] = useState<MemberReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getMemberReviews()
      .then((data) => {
        if (active) setReviews(data);
      })
      .catch(() => {
        // 평가 목록 실패는 채팅방 목록 자체를 막지 않는다.
        if (active) setReviews([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { reviews, loading };
}

/** 평가 화면 경로. matchType에 따라 1:1 / 그룹 라우트가 갈린다. */
export function toReviewHref(review: MemberReview): string {
  const segment = review.matchType === "GROUP" ? "group" : "one-on-one";
  return `/chat/${segment}/${review.chatRoomId}/rate`;
}
