/**
 * 평가(member-review) 계약. GET /api/v1/member-reviews, PUT .../targets/{memberId}.
 *
 * 채팅이 끝나면 서버가 평가를 열고, 그룹 평가에 실린 재매칭 의사가 양쪽에서 맞으면
 * 다음 금요일에 1:1 채팅방이 열린다. 재매칭 전용 조회 API는 아직 없어서,
 * 성사 여부는 제출 응답의 rematch로만 관측한다.
 */

/** 화면 문구는 응답에 없다. MEETING_STATUS_LABEL로 FE가 매핑한다. */
export type MeetingStatus = "MET" | "APPOINTMENT_MADE" | "CHAT_ONLY" | "NO_SHOW";

/** 평가가 열리는 방은 PERSONAL·GROUP 둘뿐이다. REMATCH 방은 평가를 열지 않는다. */
export type ReviewMatchType = "PERSONAL" | "GROUP";

/** COMPLETED는 목록에서 사라지므로 실질적으로 제출 응답에서만 관측된다. */
export type ReviewStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export type ReviewTargetGender = "MALE" | "FEMALE";

/** 상대가 완전 삭제되면 nickname~profileImageUrl 5개가 null로 내려온다. */
export interface ReviewTarget {
  memberId: number;
  nickname: string | null;
  gender: ReviewTargetGender | null;
  age: number | null;
  /** 지역 code(seoul 등). 표시 문구는 FE가 매핑한다. */
  location: string | null;
  /** 캐리커쳐 식별자(m1 등). */
  profileImageUrl: string | null;
  /** 내가 확정한 값. 미제출이면 null. */
  meetingStatus: MeetingStatus | null;
  rating: number | null;
  comment: string | null;
  /** null이면 아직 제출하지 않은 대상 — 완료 판정은 반드시 이 필드로 한다. */
  answeredAt: string | null;
}

export interface MemberReview {
  reviewId: number;
  matchType: ReviewMatchType;
  matchId: number;
  chatRoomId: number;
  /** 채팅이 끝난 시각(yyyy-MM-dd HH:mm:ss, KST). 정렬 키이며 마감 시한이 아니다. */
  availableAt: string;
  status: ReviewStatus;
  answeredTargetCount: number;
  totalTargetCount: number;
  /** 순서는 채팅 종료 시점에 동결된다. 별도 정렬이 필요 없다. */
  targets: ReviewTarget[];
}

export interface SubmitReviewBody {
  meetingStatus: MeetingStatus;
  /** 1~5 정수. */
  rating: number;
  /** trim 후 최대 50자. 비어 있으면 null. */
  comment: string | null;
  /** 그룹이면 필수 / 1:1이면 보내면 안 된다(둘 다 위반 시 8002). */
  wantsOneToOneRematch?: boolean;
}

export interface RematchInfo {
  matchedMemberId: number;
  matchedAt: string;
}

export interface ReviewSubmitResult {
  reviewId: number;
  status: ReviewStatus;
  answeredTargetCount: number;
  totalTargetCount: number;
  /** COMPLETED가 아니면 null. */
  completedAt: string | null;
  /**
   * 이 쌍이 성사돼 있으면 실린다. 재전송에도 다시 오므로 축하 화면 중복 노출은
   * FE가 막아야 한다(markRematchAnnounced).
   */
  rematch: RematchInfo | null;
}

/** 화면 입력 상태. 제출 직전에 SubmitReviewBody로 변환한다. */
export interface ReviewFormValue {
  meetingStatus: MeetingStatus | null;
  rating: number;
  comment: string;
}

/** 그룹 평가 입력 상태 — 대상마다 재매칭 의사를 함께 확정한다. */
export interface GroupReviewFormValue extends ReviewFormValue {
  wantsOneToOneRematch: boolean;
}
