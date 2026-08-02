export type MetStatus = "MET" | "PLANNED" | "CHAT_ONLY" | "NO_SHOW";

export interface OneOnOneRatingForm {
  metStatus: MetStatus | null;
  stars: number;
  comment: string;
}

export interface GroupMemberProfile {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  age?: number;
  gender?: string;
  location?: string;
}

export interface GroupMemberRating extends OneOnOneRatingForm {
  targetUserId: string;
  wantRematch: boolean;
}

export interface RatingSubmitResult {
  ratingId: string;
  submittedAt: string;
}

export interface GroupRatingSubmitResult {
  ratingIds: string[];
  submittedAt: string;
}

export interface RematchStatus {
  rematchId: string | null;
  matched: boolean;
  targetUserId: string | null;
}
