"use client";

import { useCallback, useEffect, useState } from "react";
import { getMemberReviews } from "@/features/rating/api/reviewApi";
import type { MemberReview, ReviewMatchType } from "@/features/rating/model/types";

type LoadState = "loading" | "ready" | "missing" | "error";

interface UseMemberReviewResult {
  review: MemberReview | null;
  state: LoadState;
  /** 제출 후 서버 상태를 다시 맞춘다(8005로 화면을 확정 상태로 되돌릴 때도 쓴다). */
  reload: () => Promise<void>;
}

/**
 * 채팅방 id로 열려 있는 평가를 찾는다.
 *
 * 평가 목록에는 아직 완료하지 않은 평가만 담기므로, 없으면 "이미 완료했거나 열리지
 * 않은 평가"다. 완료된 평가를 다시 조회할 API는 없어서 둘을 구분할 수 없다.
 */
export function useMemberReview(chatRoomId: string, matchType: ReviewMatchType): UseMemberReviewResult {
  const [review, setReview] = useState<MemberReview | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  const load = useCallback(async (): Promise<MemberReview | null> => {
    const reviews = await getMemberReviews();
    return (
      reviews.find(
        (item) => String(item.chatRoomId) === String(chatRoomId) && item.matchType === matchType,
      ) ?? null
    );
  }, [chatRoomId, matchType]);

  useEffect(() => {
    let active = true;

    load()
      .then((found) => {
        if (!active) return;
        setReview(found);
        setState(found ? "ready" : "missing");
      })
      .catch(() => {
        if (active) setState("error");
      });

    return () => {
      active = false;
    };
  }, [load]);

  const reload = useCallback(async () => {
    try {
      const found = await load();
      setReview(found);
      setState(found ? "ready" : "missing");
    } catch {
      setState("error");
    }
  }, [load]);

  return { review, state, reload };
}
