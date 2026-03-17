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

/** match rate에 따른 badge 변환 */
export function getMatchBadgeInfo(matchCount: number): MatchBadgeInfo {
    if (matchCount >= 11) {
        return {
            label: "🌟 당신과 가장 비슷해요",
            variant: "destructive",
            matchDescription: `12개중 ${matchCount}개 일치`,
        };
    } else if (matchCount >= 8) {
        return {
            label: "😊 대부분 비슷하게 생각해요",
            variant: "destructive",
            matchDescription: `12개중 ${matchCount}개 일치`,
        };
    } else if (matchCount >= 6) {
        return {
            label: "🙂 비슷하지만 새로운 관점도 있어요",
            variant: "cautionary",
            matchDescription: `12개중 ${matchCount}개 일치`,
        };
    } else {
        return {
            label: "👀 다르게 생각하는 편이에요",
            variant: "navy",
            matchDescription: `12개중 ${matchCount}개 일치`,
        };
    }
}
