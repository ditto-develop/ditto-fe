// 매칭 feature barrel exports
export type {
    MatchCardType,
    MatchProfile,
    OneOnOneMatch,
    GroupMatch,
    MatchBadgeInfo,
} from "./model/types";
export { getMatchBadgeInfo } from "./model/types";
export type { MatchItem } from "./hooks/useMatchCandidates";
export type {
    MatchCandidateDto,
    MatchRequestDto,
    MatchRequestStatus,
} from "./api/matchingApi";
