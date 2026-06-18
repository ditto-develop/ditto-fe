/**
 * Matching feature — domain model types
 * Figma: 3.1 매칭 & 프로필
 */

/** 매칭 결과 카드 타입 */
export type MatchCardType = "one" | "many" | "failmatch" | "beforematch";

/** 매칭 프로필 정보 */
export interface MatchProfile {
    id: string;
    nickname: string;
    age: number;
    gender: string;
    location: string;
    bio: string;
    avatarUrl: string;
    isMe?: boolean;
    matchRate?: number; // 일치율 (12개 중 N개)
}

/** 1:1 매칭 결과 */
export interface OneOnOneMatch {
    id: string;
    profile: MatchProfile;
    matchRate: number;
    hasRequested: boolean; // 내가 대화를 신청했는지
    hasReceivedRequest: boolean; // 상대가 대화를 신청했는지
}

/** 그룹 매칭 결과 */
export interface GroupMatch {
    id: string;
    members: MatchProfile[];
    groupName: string;
    acceptStatus: "pending" | "accepted" | "rejected";
}

/** Match badge 정보 (ContentBadge에 사용) */
export interface MatchBadgeInfo {
    label: string;
    variant: "positive" | "cautionary" | "destructive" | "navy";
    matchDescription: string;
}

/**
 * match rate에 따른 badge 변환.
 * 등급은 일치 비율(matchedQuestions / totalQuestions) 기준이며,
 * 기존 12문항 기준 컷(11/12, 8/12, 6/12)을 비율로 환산해 동작을 보존한다.
 */
export function getMatchBadgeInfo(matchedQuestions: number, totalQuestions: number): MatchBadgeInfo {
    const rate = totalQuestions > 0 ? (matchedQuestions / totalQuestions) * 100 : 0;
    const matchDescription = `${totalQuestions}개중 ${matchedQuestions}개 일치`;

    if (rate >= (11 / 12) * 100) {
        return {
            label: "🌟 당신과 가장 비슷해요",
            variant: "destructive",
            matchDescription,
        };
    } else if (rate >= (8 / 12) * 100) {
        return {
            label: "😊 대부분 비슷하게 생각해요",
            variant: "destructive",
            matchDescription,
        };
    } else if (rate >= (6 / 12) * 100) {
        return {
            label: "🙂 비슷하지만 새로운 관점도 있어요",
            variant: "cautionary",
            matchDescription,
        };
    } else {
        return {
            label: "👀 다르게 생각하는 편이에요",
            variant: "navy",
            matchDescription,
        };
    }
}
