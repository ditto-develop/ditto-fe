import {
  getRematchStatus,
  requestRematch,
  submitGroupRating,
  submitOneOnOneRating,
} from "@/shared/lib/api/externalApi";
import type {
  GroupMemberRating,
  GroupRatingSubmitResult,
  OneOnOneRatingForm,
  RatingSubmitResult,
  RematchStatus,
} from "@/features/rating";

export function createOneOnOneRating(
  roomId: string,
  form: OneOnOneRatingForm & { metStatus: NonNullable<OneOnOneRatingForm["metStatus"]> },
): Promise<RatingSubmitResult> {
  return submitOneOnOneRating(roomId, form);
}

export function createGroupRatings(
  roomId: string,
  ratings: Array<GroupMemberRating & { metStatus: NonNullable<GroupMemberRating["metStatus"]> }>,
): Promise<GroupRatingSubmitResult> {
  return submitGroupRating(roomId, ratings);
}

export function createRematchRequest(targetUserId: string): Promise<RematchStatus> {
  return requestRematch(targetUserId);
}

export function fetchRematchStatus(): Promise<RematchStatus> {
  return getRematchStatus();
}
