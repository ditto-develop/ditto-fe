/**
 * Conversation feature — domain model types
 * Figma: 대화 관련 상태 및 플로우
 */

/** 대화 상태 */
export type ConversationStatus = "pending" | "accepted" | "rejected" | "active" | "ended";

/** 대화 요청 */
export interface ConversationRequest {
    id: string;
    fromUserId: string;
    toUserId: string;
    status: ConversationStatus;
    createdAt: string;
}

/** 대화 정보 */
export interface Conversation {
    id: string;
    matchId: string;
    participants: string[];
    status: ConversationStatus;
    lastMessage?: string;
    unreadCount: number;
}
