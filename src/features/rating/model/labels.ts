import type { MeetingStatus, ReviewTarget } from "@/features/rating/model/types";
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
