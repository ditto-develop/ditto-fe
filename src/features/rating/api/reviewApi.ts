import { externalApiFetch } from "@/shared/lib/api/externalClient";
import type {
  MemberReview,
  ReviewSubmitResult,
  ReviewTarget,
  SubmitReviewBody,
} from "@/features/rating/model/types";

const COMMENT_MAX_LENGTH = 50;

/**
 * 아직 완료하지 않은 평가 전건. 페이징이 없고 availableAt 오름차순으로 내려온다.
 * 마지막 대상을 제출해 COMPLETED가 되면 목록에서 사라지고, 완료된 평가를 다시
 * 조회할 API는 없다.
 */
export async function getMemberReviews(): Promise<MemberReview[]> {
  const reviews = await externalApiFetch<MemberReview[]>("/api/v1/member-reviews");
  return (reviews ?? []).map(normalizeReview);
}

/**
 * 대상 한 명 제출. 최종이며 수정도 임시저장도 없다.
 * 같은 내용 재전송은 멱등이고, 성사된 쌍이면 rematch가 다시 실려 온다.
 */
export function submitMemberReview(
  reviewId: number,
  memberId: number,
  body: SubmitReviewBody,
): Promise<ReviewSubmitResult> {
  return externalApiFetch<ReviewSubmitResult>(
    `/api/v1/member-reviews/${reviewId}/targets/${memberId}`,
    { method: "PUT", body },
  );
}

/**
 * 화면 입력값 → 요청 바디.
 * comment는 서버가 trim 후 비교/저장하므로 여기서 미리 trim해 재전송 멱등성을 맞춘다.
 * wantsOneToOneRematch는 그룹에만 싣는다 — 1:1에 실으면 8002다.
 */
export function toSubmitReviewBody(
  form: { meetingStatus: NonNullable<SubmitReviewBody["meetingStatus"]>; rating: number; comment: string },
  wantsOneToOneRematch?: boolean,
): SubmitReviewBody {
  const comment = form.comment.trim();
  return {
    meetingStatus: form.meetingStatus,
    rating: form.rating,
    comment: comment.length > 0 ? comment.slice(0, COMMENT_MAX_LENGTH) : null,
    ...(wantsOneToOneRematch === undefined ? {} : { wantsOneToOneRematch }),
  };
}

/** targets가 swagger required에 빠져 있어 방어한다(실제 응답에는 항상 실린다). */
function normalizeReview(review: MemberReview): MemberReview {
  const targets = (review.targets ?? []).map(normalizeTarget);
  return {
    ...review,
    targets,
    answeredTargetCount: review.answeredTargetCount ?? targets.filter(isAnswered).length,
    totalTargetCount: review.totalTargetCount ?? targets.length,
  };
}

function normalizeTarget(target: ReviewTarget): ReviewTarget {
  return {
    ...target,
    nickname: target.nickname ?? null,
    gender: target.gender ?? null,
    age: target.age ?? null,
    location: target.location ?? null,
    profileImageUrl: target.profileImageUrl ?? null,
    meetingStatus: target.meetingStatus ?? null,
    rating: target.rating ?? null,
    comment: target.comment ?? null,
    answeredAt: target.answeredAt ?? null,
  };
}

/** 완료 판정은 answeredAt으로만 한다(가이드 명시). */
export function isAnswered(target: ReviewTarget): boolean {
  return target.answeredAt !== null;
}
