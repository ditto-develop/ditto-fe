"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMemberReviews } from "@/features/rating/api/reviewApi";
import { toReviewHref } from "@/features/rating/hooks/usePendingReviews";
import { parseServerDateTime } from "@/shared/lib/serverDateTime";

/** 앱 세션(탭/웹뷰)당 한 번만 확인한다. 건너뛰고 홈으로 돌아온 사용자를 다시 끌고 가지 않는다. */
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

/**
 * 미평가 유도(2026-09-27 QA). 앱에 처음 들어와 홈이 열리면, 열려 있는 평가 중 가장 오래된
 * 것의 평가 화면으로 보낸다. 평가 화면에서 건너뛸 수 있으므로 강제가 아니다.
 *
 * 목록은 availableAt 오름차순이고 완료한 평가는 빠져 있다. availableAt 이 아직 오지 않은
 * 평가는 건너뛴다. 조회가 실패하면 아무것도 하지 않는다 — 홈 진입을 막을 이유가 없다.
 */
export function usePendingReviewPrompt(): void {
  const router = useRouter();

  useEffect(() => {
    if (wasPrompted()) return;
    let active = true;

    getMemberReviews()
      .then((reviews) => {
        if (!active) return;
        // 첫 확인에서 끝낸다 — 세션 도중 평가가 새로 열려도 홈에 올 때마다 끌고 가지 않는다.
        markPrompted();
        const now = Date.now();
        const next = reviews.find((review) => {
          const availableAt = parseServerDateTime(review.availableAt);
          return !availableAt || availableAt.getTime() <= now;
        });
        if (!next) return;
        router.push(toReviewHref(next));
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [router]);
}
