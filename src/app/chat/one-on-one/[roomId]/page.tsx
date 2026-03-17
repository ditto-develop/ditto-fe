"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import styled from "styled-components";
import { ChatService, ChatRoomDetailDto } from "@/lib/api/services/ChatService";
import { useCurrentUserId } from "@/lib/hooks/useCurrentUserId";
import ChatRoomHeader from "./_components/ChatRoomHeader";
import MessageList from "./_components/MessageList";
import ChatInput from "./_components/ChatInput";
import ChatLeaveModal from "./_components/ChatLeaveModal";
import type { MessageItem } from "./_components/MessageBubble";

export default function ChatRoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const router = useRouter();
  const currentUserId = useCurrentUserId();

  const [roomDetail, setRoomDetail] = useState<ChatRoomDetailDto | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load room detail + initial messages
  useEffect(() => {
    const init = async () => {
      try {
        const [detailRes, msgRes] = await Promise.all([
          ChatService.chatControllerGetChatRoomDetail(roomId),
          ChatService.chatControllerGetMessages(roomId, undefined, 30),
        ]);

        if (detailRes.success && detailRes.data) {
          setRoomDetail(detailRes.data);
        } else {
          router.replace("/home");
          return;
        }

        if (msgRes.success && msgRes.data) {
          const msgs = (msgRes.data.messages ?? []) as MessageItem[];
          setMessages(msgs.slice().reverse());
          setNextCursor(msgRes.data.nextCursor ?? null);
          setHasMore(!!msgRes.data.nextCursor);
        }

        // Mark as read
        ChatService.chatControllerMarkAsRead(roomId).catch(() => {});
      } catch {
        router.replace("/home");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [roomId, router]);

  const handleMessagesUpdate = useCallback(
    (newMessages: MessageItem[], cursor: string | null) => {
      setMessages(newMessages);
      setNextCursor(cursor);
      setHasMore(!!cursor);
    },
    []
  );

  const handleSend = async (content: string) => {
    const res = await ChatService.chatControllerSendMessage(roomId, { content });
    if (res.success && res.data) {
      const newMsg: MessageItem = {
        id: res.data.id,
        senderId: res.data.senderId,
        content: res.data.content,
        createdAt: res.data.createdAt,
      };
      setMessages((prev) => [...prev, newMsg]);
      ChatService.chatControllerMarkAsRead(roomId).catch(() => {});
    }
  };

  const handleLeave = async () => {
    await ChatService.chatControllerLeaveChatRoom(roomId, {});
    router.replace("/home");
  };

  if (loading || !roomDetail || !currentUserId) return null;

  const expiresAt = roomDetail.expiresAt ? new Date(roomDetail.expiresAt) : null;

  return (
    <PageContainer>
      <ChatRoomHeader
        roomId={roomId}
        partnerNickname={roomDetail.partner.nickname}
        expiresAt={expiresAt}
        onMenuClick={() => router.push(`/chat/one-on-one/${roomId}/menu`)}
      />
      <MessageList
        roomId={roomId}
        messages={messages}
        currentUserId={currentUserId}
        partnerAvatarUrl={roomDetail.partner.profileImageUrl}
        onMessagesUpdate={handleMessagesUpdate}
        nextCursor={nextCursor}
        hasMore={hasMore}
      />
      <ChatInput onSend={handleSend} />
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
  background-color: var(--color-semantic-background-normal-normal, #E9E6E2);
  overflow: hidden;
`;
