import type { AlertStatus } from "@/components/display/Card";

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
    return `/assets/avatar/f${(index % 3) + 1}.png`;
  }
  return `/assets/avatar/m${(index % 3) + 1}.png`;
}

export function formatGender(gender: string): string {
  return gender === 'FEMALE' ? '여성' : '남성';
}

//- Sub Components
