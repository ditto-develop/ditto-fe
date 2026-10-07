import type { MeetingStatus, ReviewFormValue, ReviewTarget } from "@/features/rating/model/types";
import { toLocationLabel } from "@/shared/lib/profileLabels";

/** MeetingStatus 화면 문구는 응답에 없다. 선택지 순서도 여기가 정본이다. */
export const MEETING_STATUS_OPTIONS: ReadonlyArray<{ value: MeetingStatus; label: string }> = [
  { value: "MET", label: "만났어요 😊" },
  { value: "APPOINTMENT_MADE", label: "약속 잡았어요 📅" },
  { value: "CHAT_ONLY", label: "채팅만 했어요 💬" },
  { value: "NO_SHOW", label: "노쇼 당했어요 😢" },
];

export function toMeetingStatusLabel(value: MeetingStatus): string {
  return MEETING_STATUS_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

/** 상대가 완전 삭제되면 프로필 5개 필드가 null로 내려온다. */
export function toTargetNickname(target: ReviewTarget): string {
  return target.nickname ?? "알 수 없는 사용자";
}

export function toTargetMetadata(target: ReviewTarget): string {
  return [
    target.age ? `${Math.floor(target.age / 5) * 5}~${Math.floor(target.age / 5) * 5 + 4}세` : "나이 미공개",
    target.gender === "FEMALE" ? "여성" : target.gender === "MALE" ? "남성" : "성별 미공개",
    target.location ? toLocationLabel(target.location) : "지역 미공개",
  ].join(" · ");
}

/** 비속어가 든 한줄 코멘트 안내. 입력란 아래 경고와 제출 차단 토스트가 같이 쓴다. */
export const FORBIDDEN_COMMENT_MESSAGE = "코멘트에 사용할 수 없는 표현이 있어요.";

/** 비활성 CTA를 눌렀을 때 빠진 필수 항목을 알려준다. 다 채웠으면 null. */
export function toMissingRequiredMessage(form: ReviewFormValue): string | null {
  const missingMeetingStatus = form.meetingStatus === null;
  const missingRating = form.rating <= 0;

  if (missingMeetingStatus && missingRating) return "만남 성사 여부와 별점은 필수로 선택해야 해요.";
  if (missingMeetingStatus) return "만남 성사 여부는 필수로 선택해야 해요.";
  if (missingRating) return "별점은 필수로 선택해야 해요.";
  return null;
}
