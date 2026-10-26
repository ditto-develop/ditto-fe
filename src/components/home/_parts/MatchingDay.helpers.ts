import type { AlertStatus } from "@/components/display/Card";
import type { ChatRoom } from "@/features/chat";
import type { MatchCandidateDto } from "@/features/matching/api/matchingApi";

export type MatchingCardType = "failmatch" | "one" | "many" | "beforematch";
export type ButtonStateType =
  | "primary"
  | "secondary"
  | "tertiary"
  | "disabled"
  | undefined;

export type MatchingButtonProps = {
  cardType: MatchingCardType;
  buttonState: ButtonStateType;
  isChatTime: boolean;
  hasChat?: boolean;
  /** 대화방이 종료됐으면 버튼을 비활성화한다. */
  isEnded?: boolean;
  onClick?: () => void;
};

export interface Profile {
  name: string;
  age: number;
  gender: string;
  location: string;
  bio: string;
  avatarUrl: string;

  isMe?: boolean;
  matchCount?: number;
  totalQuestions?: number;
}


// 등급은 일치 비율(matchedQuestions / totalQuestions) 기준이며,
// 기존 12문항 기준 컷(11/12, 8/12, 6/12)을 비율로 환산해 동작을 보존한다.
export const getMatchBadgeInfo = (
  matchedQuestions: number,
  totalQuestions: number
): { badge: string; color: AlertStatus; description: string } => {
  const rate = totalQuestions > 0 ? (matchedQuestions / totalQuestions) * 100 : 0;
  const description = `${totalQuestions}개중 ${matchedQuestions}개 일치`;

  if (rate >= (11 / 12) * 100) {
    return {
      badge: "🌟 당신과 가장 비슷해요",
      color: "destructive", // Semantic/Status/Negative
      description
    };
  } else if (rate >= (8 / 12) * 100) {
    return {
      badge: "😊 대부분 비슷하게 생각해요",
      color: "destructive", // Semantic/Status/Negative
      description
    };
  } else if (rate >= (6 / 12) * 100) {
    return {
      badge: "🙂 비슷하지만 새로운 관점도 있어요",
      color: "cautionary", // Semantic/Status/Cautionary
      description
    };
  } else {
    return {
      badge: "👀 다르게 생각하는 편이에요",
      color: "navy", // Semantic/Accent/Foreground/Navy
      description
    };
  }
};

// 매칭 수락 알림 toast를 quizSetId당 1회만 띄우기 위한 localStorage 키.
// 수락 직후 홈(?accepted=true) toast와 MatchingDay 알림 toast의 중복 방지에 공용으로 사용한다.
export function matchAcceptedNotifKey(quizSetId: string): string {
  return `ditto_match_accepted_notif_${quizSetId}`;
}

export function getAvatarUrl(gender: string, index: number = 0): string {
  if (gender === 'FEMALE') {
    return `/assets/avatar/f${(index % 3) + 1}.webp`;
  }
  return `/assets/avatar/m${(index % 3) + 1}.webp`;
}

export function formatGender(gender: string): string {
  return gender === 'FEMALE' ? '여성' : '남성';
}

/**
 * 대화 기간 홈 그룹 카드(프로필 묶음·프로필 선택 시트)에 보여 줄 구성원.
 *
 * 후보 그룹의 `members` 는 수락 여부와 상관없이 그룹에 묶인 전원이다 — 응답에 구성원별 수락
 * 상태가 없다. 방이 열린 뒤에는 실제로 방에 들어온 사람(방의 `counterpartMemberIds`)만 남긴다
 * (QA 2026-10-26: 거절한 사람까지 프로필 선택에 떴다).
 *
 * 방이 그룹 방이 아니거나 겹치는 사람이 없으면 거르지 않는다. 홈은 "가장 최근 방"을 쓰므로
 * 이번 주 그룹 방이 아닐 수 있고, 엉뚱한 방으로 걸러 카드가 비는 것보다 전원을 보이는 편이 낫다.
 */
export function toJoinedGroupMembers(
  members: MatchCandidateDto[],
  room: ChatRoom | undefined,
): MatchCandidateDto[] {
  if (room?.sourceType !== "GROUP") return members;
  const joined = new Set(room.counterpartMemberIds.map(String));
  const inRoom = members.filter((member) => joined.has(member.userId));
  return inRoom.length > 0 ? inRoom : members;
}

//- Sub Components
