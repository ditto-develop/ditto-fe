export type ChatRoomItemDto = {
    roomId: string;
    partnerNickname: string;
    partnerAvatarUrl: string | null;
    lastMessageContent?: string;
    lastMessageAt?: string;
    unreadCount: number;
    expiresAt?: string | null;
    isGroup?: boolean;
    coParticipantAvatarUrl?: string | null;
    status?: string;
    canSendMessage?: boolean;
    endedAt?: string | null;
    endedByUserId?: string | null;
    endedReason?: string | null;
    isEnded?: boolean;
    isPartnerLeft?: boolean;
    partnerLastReadMessageId?: string | null;
};

