import type { GroupCandidateGroupDto } from "@/features/matching/api/matchingApi";

/**
 * 그룹 화면을 "매칭 실패"로 그릴지. 홈 매칭 카드와 `/matching/group/`이 같은 기준을 쓴다.
 *
 * 화면 상태는 `groups[0]`만으로 갈린다(BE 위키 Frontend-Group-Matching-Guide §화면 상태 판단).
 * 후보가 없으면 실패이고, 대화 기간에는 성사된 그룹을 수락한 경우만 남는다 — 인원 미달로
 * 성사되지 못한 그룹(`GROUP_NOT_FORMED` 알림)도 대화 기간에는 실패로 그린다.
 */
export function isGroupMatchFailed(
  group: GroupCandidateGroupDto | undefined,
  isChattingPeriod: boolean,
): boolean {
  if (!group) return true;
  const formed = group.myStatus === "ACCEPTED" && group.isFormed;
  return isChattingPeriod && !formed;
}
