"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styled from "styled-components";
import { ChatService, type ChatRoomDetailDto } from "@/shared/lib/api/generated";
import { ChatRoomHeader } from "./ChatRoomHeader";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ChatLeaveModal } from "./ChatLeaveModal";
import { ChatMenuBottomSheet } from "./ChatMenuBottomSheet";
import type { MessageItem } from "./MessageBubble";
import { getChatRoomEndState } from "@/app/chat/_utils/chatRoomStatus";

function getUserIdFromToken(): string | null {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || payload.userId || null;
  } catch {
    return null;
  }
}

export function ChatRoomPageClient() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const router = useRouter();

  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [roomDetail, setRoomDetail] = useState<ChatRoomDetailDto | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [partnerLastReadMessageId, setPartnerLastReadMessageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasRoomDetail = roomDetail !== null;

  useEffect(() => {
    const userId = getUserIdFromToken();
    setMyUserId(userId);

    const init = async () => {
      try {
        const [detailRes, msgRes] = await Promise.all([
          ChatService.chatControllerGetChatRoomDetail(roomId),
          ChatService.chatControllerGetMessages(roomId, undefined, 30),
        ]);

        if (detailRes.success && detailRes.data) {
          setRoomDetail(detailRes.data);
        }

        if (msgRes.success && msgRes.data) {
          const msgs = (msgRes.data.messages as MessageItem[]).slice().reverse();
          setMessages(msgs);
          setNextCursor(msgRes.data.nextCursor ?? null);
          setHasMore(!!msgRes.data.nextCursor);
          setPartnerLastReadMessageId(msgRes.data.partnerLastReadMessageId ?? null);
        }

        ChatService.chatControllerMarkAsRead(roomId).catch(() => {});
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [roomId]);

  useEffect(() => {
    if (!hasRoomDetail) return;

    let isMounted = true;
    let isFetching = false;

    const refreshRoomDetail = async () => {
      if (isFetching || document.hidden) return;
      isFetching = true;

      try {
        const detailRes = await ChatService.chatControllerGetChatRoomDetail(roomId);
        if (isMounted && detailRes.success && detailRes.data) {
          setRoomDetail(detailRes.data);
          if (detailRes.data.partnerLastReadMessageId !== undefined) {
            setPartnerLastReadMessageId(detailRes.data.partnerLastReadMessageId ?? null);
          }
        }
      } catch {
        // ignore
      } finally {
        isFetching = false;
      }
    };

    const intervalId = window.setInterval(refreshRoomDetail, 3000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [roomId, hasRoomDetail]);

  const handleMessagesUpdate = useCallback(
    (newMessages: MessageItem[], cursor: string | null, newPartnerLastReadMessageId?: string | null) => {
      setMessages(newMessages);
      setNextCursor(cursor);
      setHasMore(!!cursor);
      if (newPartnerLastReadMessageId !== undefined) {
        setPartnerLastReadMessageId(newPartnerLastReadMessageId);
      }
    },
    []
  );

  const handleSend = async (content: string) => {
    try {
      const res = await ChatService.chatControllerSendMessage(roomId, { content });
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data as MessageItem]);
      }
    } catch {
      // ignore — MessageList polling will pick it up
    }
  };

  const handleLeave = async () => {
    try {
      await ChatService.chatControllerLeaveChatRoom(roomId, { reason: "USER_LEFT" });
    } catch {
      // ignore
    }
    router.replace("/chat");
  };

  if (loading) {
    return (
      <PageContainer>
        <EmptyMessage>불러오는 중...</EmptyMessage>
      </PageContainer>
    );
  }

  if (!roomDetail) {
    return (
      <PageContainer>
        <EmptyMessage>채팅방을 찾을 수 없어요.</EmptyMessage>
      </PageContainer>
    );
  }

  const expiresAt = roomDetail.expiresAt ? new Date(roomDetail.expiresAt) : null;
  const endState = getChatRoomEndState(roomDetail, myUserId);
  const isEnded = endState.isEnded;

  return (
    <PageContainer>
      <ChatRoomHeader
        roomId={roomId}
        partnerNickname={roomDetail.partner.nickname}
        expiresAt={expiresAt}
        onMenuClick={() => setIsMenuOpen(true)}
      />

      <MessageList
        roomId={roomId}
        messages={messages}
        currentUserId={myUserId ?? ""}
        partnerAvatarUrl={roomDetail.partner.profileImageUrl ?? null}
        partnerNickname={roomDetail.partner.nickname}
        partnerLastReadMessageId={partnerLastReadMessageId}
        onMessagesUpdate={handleMessagesUpdate}
        nextCursor={nextCursor}
        hasMore={hasMore}
        isEnded={isEnded}
        endedMessage={endState.message}
      />

      {!isEnded && <ChatInput onSend={handleSend} />}

      {isMenuOpen && (
        <ChatMenuBottomSheet
          onClose={() => setIsMenuOpen(false)}
          onLeave={() => setIsLeaveModalOpen(true)}
        />
      )}

      <ChatLeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={handleLeave}
      />
    </PageContainer>
  );
}

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100%;
  background-color: var(--color-semantic-background-normal-normal);
  overflow: hidden;
`;

const EmptyMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-1-normal-font-size);
  color: var(--color-semantic-label-alternative);
`;
