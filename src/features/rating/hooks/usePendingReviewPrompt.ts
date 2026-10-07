"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMemberReviews } from "@/features/rating/api/reviewApi";
import { toReviewHref } from "@/features/rating/hooks/usePendingReviews";
import {
  isReviewPromptSkipped,
  markReviewPromptSkipped,
} from "@/features/rating/lib/reviewStorage";
import type { MemberReview } from "@/features/rating/model/types";
import { parseServerDateTime } from "@/shared/lib/serverDateTime";

/**
 * 앱 세션(탭/웹뷰)당 한 번만 확인한다. 평가하러 갔다가 홈으로 돌아온 사용자를 다시 붙잡지 않는다.
 * 앱을 다시 켜면 비워지므로, 건너뛰기는 여기가 아니라 reviewStorage에 평가별로 남긴다.
 */
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
  /** 지금 열려 있는 평가는 앱을 다시 켜도 더 묻지 않고 홈에 머문다. */
  skip: () => void;
}

/**
 * 미평가 유도(2026-09-27 QA). 앱에 처음 들어와 홈이 열리면, 열려 있는 평가 중 가장 오래된
 * 것을 안내 모달로 띄운다. 모달에서 건너뛸 수 있으므로 강제가 아니다.
 *
 * 목록은 availableAt 오름차순이고 완료한 평가는 빠져 있다. availableAt 이 아직 오지 않은
 * 평가와 이미 건너뛴 평가는 빼고 고른다. 건너뛰기는 그때 열려 있던 평가를 전부 기록한다 —
 * 하나만 남기면 다음 실행에 남은 평가로 모달이 또 떠서 건너뛰기가 안 먹은 것처럼 보인다.
 * 그 뒤에 새로 열린 평가는 다시 한 번 안내한다.
 * 조회가 실패하면 아무것도 하지 않는다 — 홈 진입을 막을 이유가 없다.
 */
export function usePendingReviewPrompt(): PendingReviewPrompt {
  const router = useRouter();
  /** 안내 대상 후보(열려 있고 건너뛰지 않은 평가). 첫 항목을 모달에 띄운다. */
  const [pending, setPending] = useState<MemberReview[]>([]);
  const review = pending[0] ?? null;

  useEffect(() => {
    if (wasPrompted()) return;
    let active = true;

    getMemberReviews()
      .then((reviews) => {
        if (!active) return;
        // 첫 확인에서 끝낸다 — 세션 도중 평가가 새로 열려도 홈에 올 때마다 붙잡지 않는다.
        markPrompted();
        const now = Date.now();
        setPending(
          reviews.filter((item) => {
            if (isReviewPromptSkipped(item.reviewId)) return false;
            const availableAt = parseServerDateTime(item.availableAt);
            return !availableAt || availableAt.getTime() <= now;
          }),
        );
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const start = useCallback(() => {
    if (!review) return;
    setPending([]);
    router.push(toReviewHref(review));
  }, [review, router]);

  const skip = useCallback(() => {
    markReviewPromptSkipped(pending.map((item) => item.reviewId));
    setPending([]);
  }, [pending]);

  return { review, start, skip };
}
