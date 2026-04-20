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
}


export const getMatchBadgeInfo = (count: number): { badge: string; color: AlertStatus; description: string } => {
  if (count >= 11) {
    return {
      badge: "🌟 당신과 가장 비슷해요",
      color: "destructive", // Semantic/Status/Negative
      description: `12개중 ${count}개 일치`
    };
  } else if (count >= 8) {
    return {
      badge: "😊 대부분 비슷하게 생각해요",
      color: "destructive", // Semantic/Status/Negative
      description: `12개중 ${count}개 일치`
    };
  } else if (count >= 6) {
    return {
      badge: "🙂 비슷하지만 새로운 관점도 있어요",
      color: "cautionary", // Semantic/Status/Cautionary
      description: `12개중 ${count}개 일치`
    };
  } else {
    return {
      badge: "👀 다르게 생각하는 편이에요",
      color: "navy", // Semantic/Accent/Foreground/Navy
      description: `12개중 ${count}개 일치`
    };
  }
};

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
