"use client";

import { useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import { Caption1 } from "@/components/common/Text";
import { ChatService } from "@/lib/api/services/ChatService";
import MessageBubble, { MessageItem } from "./MessageBubble";

interface MessageListProps {
  roomId: string;
  messages: MessageItem[];
  currentUserId: string;
  partnerAvatarUrl: string | null;
  onMessagesUpdate: (messages: MessageItem[], nextCursor: string | null) => void;
  nextCursor: string | null;
  hasMore: boolean;
}

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateLabel(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const day = DAYS[date.getDay()];
  return `${y}년 ${m}월 ${d}일 ${day}요일`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function MessageList({
  roomId,
  messages,
  currentUserId,
  partnerAvatarUrl,
  onMessagesUpdate,
  nextCursor,
  hasMore,
}: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isLoadingMore = useRef(false);
  const latestMessageId = useRef<string | null>(null);
  const isInitialLoad = useRef(true);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Initial scroll
  useEffect(() => {
    if (isInitialLoad.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
      isInitialLoad.current = false;
    }
  }, [messages.length]);

  // Polling for new messages
  useEffect(() => {
    if (messages.length > 0) {
      latestMessageId.current = messages[messages.length - 1].id;
    }

    const poll = async () => {
      try {
        const res = await ChatService.chatControllerGetMessages(roomId, undefined, 30);
        if (!res.success || !res.data) return;

        // API returns newest-first; reverse to get chronological order
        const polled = (res.data.messages as MessageItem[]).slice().reverse();
        if (!polled.length) return;

        const latestNew = polled[polled.length - 1].id;
        if (latestNew === latestMessageId.current) return;

        // Find only messages newer than current latest
        const knownId = latestMessageId.current;
        const knownIdx = polled.findIndex((m) => m.id === knownId);
        const genuinelyNew = knownIdx >= 0 ? polled.slice(knownIdx + 1) : polled;

        if (!genuinelyNew.length) return;

        latestMessageId.current = latestNew;
        onMessagesUpdate([...messages, ...genuinelyNew], res.data.nextCursor ?? null);

        // Mark as read
        ChatService.chatControllerMarkAsRead(roomId).catch(() => {});

        scrollToBottom();
      } catch {
        // ignore
      }
    };

    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [roomId, messages, onMessagesUpdate, scrollToBottom]);

  // Upward infinite scroll
  const handleScroll = useCallback(async () => {
    const el = listRef.current;
    if (!el || !hasMore || isLoadingMore.current) return;
    if (el.scrollTop > 60) return;

    isLoadingMore.current = true;
    const prevScrollHeight = el.scrollHeight;

    try {
      const res = await ChatService.chatControllerGetMessages(roomId, nextCursor ?? undefined, 30);
      if (!res.success || !res.data) return;

      // API returns newest-first; reverse to get chronological order
      const older = (res.data.messages as MessageItem[]).slice().reverse();
      const merged = [...older, ...messages];
      onMessagesUpdate(merged, res.data.nextCursor ?? null);

      // Maintain scroll position
      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight - prevScrollHeight;
        }
      });
    } catch {
      // ignore
    } finally {
      isLoadingMore.current = false;
    }
  }, [roomId, hasMore, nextCursor, messages, onMessagesUpdate]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Group messages: show avatar only for first consecutive message from partner
  const renderMessages = () => {
    const items: React.ReactNode[] = [];
    let prevDate: Date | null = null;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const msgDate = new Date(msg.createdAt);

      // Date separator
      if (!prevDate || !isSameDay(prevDate, msgDate)) {
        items.push(
          <DateSeparator key={`date-${msg.id}`}>
            <DateChip>
              <Caption1 $color="var(--color-semantic-label-alternative, rgba(47, 43, 39, 0.61))">
                {formatDateLabel(msgDate)}
              </Caption1>
            </DateChip>
          </DateSeparator>
        );
        prevDate = msgDate;
      }

      const isMine = msg.senderId === currentUserId;
      const nextMsg = messages[i + 1];
      const showAvatar =
        !isMine &&
        (nextMsg === undefined ||
          nextMsg.senderId !== msg.senderId ||
          !isSameDay(new Date(nextMsg.createdAt), msgDate));

      items.push(
        <MessageBubble
          key={msg.id}
          message={msg}
          isMine={isMine}
          showAvatar={showAvatar}
          partnerAvatarUrl={partnerAvatarUrl}
        />
      );
    }

    return items;
  };

  return (
    <ListContainer ref={listRef}>
      {renderMessages()}
      <div ref={bottomRef} />
    </ListContainer>
  );
}

const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  background-color: var(--color-semantic-background-normal-normal, #E9E6E2);
`;

const DateSeparator = styled.div`
  display: flex;
  justify-content: center;
  margin: 12px 0;
`;

const DateChip = styled.div`
  background: rgba(108, 101, 95, 0.08);
  padding: 4px 12px;
  border-radius: 100px;
`;
