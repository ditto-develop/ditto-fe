"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMemberReviews } from "@/features/rating/api/reviewApi";
import { toReviewHref } from "@/features/rating/hooks/usePendingReviews";
import type { MemberReview } from "@/features/rating/model/types";
import { parseServerDateTime } from "@/shared/lib/serverDateTime";

/** 앱 세션(탭/웹뷰)당 한 번만 확인한다. 건너뛰고 홈으로 돌아온 사용자를 다시 붙잡지 않는다. */
const PROMPTED_KEY = "ditto:review:prompted";

function wasPrompted(): boolean {
  try {
    return window.sessionStorage.getItem(PROMPTED_KEY) === "1";
  } catch {
    return false;
  }
}

function markPrompted(): void {
  try {
    window.sessionStorage.setItem(PROMPTED_KEY, "1");
  } catch {
    // 저장이 막혀도(프라이빗 모드 등) 이번 세션에서 한 번 더 뜰 뿐이다.
  }
}

interface PendingReviewPrompt {
  /** 안내 모달에 띄울 평가. 없으면 모달을 띄우지 않는다. */
  review: MemberReview | null;
  /** 평가 화면으로 이동한다. */
  start: () => void;
  /** 이번 세션에서는 더 묻지 않고 홈에 머문다. */
  skip: () => void;
}

/**
 * 미평가 유도(2026-09-27 QA). 앱에 처음 들어와 홈이 열리면, 열려 있는 평가 중 가장 오래된
 * 것을 안내 모달로 띄운다. 모달에서 건너뛸 수 있으므로 강제가 아니다.
 *
 * 목록은 availableAt 오름차순이고 완료한 평가는 빠져 있다. availableAt 이 아직 오지 않은
 * 평가는 건너뛴다. 조회가 실패하면 아무것도 하지 않는다 — 홈 진입을 막을 이유가 없다.
 */
export function usePendingReviewPrompt(): PendingReviewPrompt {
  const router = useRouter();
  const [review, setReview] = useState<MemberReview | null>(null);

  useEffect(() => {
    if (wasPrompted()) return;
    let active = true;

    getMemberReviews()
      .then((reviews) => {
        if (!active) return;
        // 첫 확인에서 끝낸다 — 세션 도중 평가가 새로 열려도 홈에 올 때마다 붙잡지 않는다.
        markPrompted();
        const now = Date.now();
        const next = reviews.find((item) => {
          const availableAt = parseServerDateTime(item.availableAt);
          return !availableAt || availableAt.getTime() <= now;
        });
        if (next) setReview(next);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const start = useCallback(() => {
    if (!review) return;
    setReview(null);
    router.push(toReviewHref(review));
  }, [review, router]);

  const skip = useCallback(() => setReview(null), []);

  return { review, start, skip };
}
