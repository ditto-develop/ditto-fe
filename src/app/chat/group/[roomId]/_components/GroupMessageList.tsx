"use client";

import { useEffect, useRef, useCallback } from "react";
import type React from "react";
import styled from "styled-components";
import { GroupChatService, type GroupMessageItem } from "@/lib/api/services/GroupChatService";
import { GroupMessageBubble } from "./GroupMessageBubble";
import { VoteCreatedMessageBubble } from "./VoteCreatedMessageBubble";

interface GroupMessageListProps {
  roomId: string;
  messages: GroupMessageItem[];
  currentUserId: string;
  onMessagesUpdate: (messages: GroupMessageItem[], nextCursor: string | null) => void;
  nextCursor: string | null;
  hasMore: boolean;
  isEnded: boolean;
  endedMessage?: string;
  onVoteMessageClick?: (voteId: string) => void;
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

export function GroupMessageList({
  roomId,
  messages,
  currentUserId,
  onMessagesUpdate,
  nextCursor,
  hasMore,
  isEnded,
  endedMessage,
  onVoteMessageClick,
}: GroupMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isLoadingMore = useRef(false);
  const latestMessageId = useRef<string | null>(null);
  const isInitialLoad = useRef(true);
  const renderedLatestMessageId = useRef<string | null>(null);
  const skipNextAutoScroll = useRef(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const latest = messages[messages.length - 1];
    if (!latest) return;

    if (renderedLatestMessageId.current === latest.id) {
      skipNextAutoScroll.current = false;
      return;
    }

    renderedLatestMessageId.current = latest.id;
    latestMessageId.current = latest.id;

    if (skipNextAutoScroll.current) {
      skipNextAutoScroll.current = false;
      return;
    }

    const behavior: ScrollBehavior = isInitialLoad.current ? "instant" : "smooth";
    isInitialLoad.current = false;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior });
      });
    });
  }, [messages]);

  // Polling
  useEffect(() => {
    if (isEnded) return;

    if (messages.length > 0) {
      latestMessageId.current = messages[messages.length - 1].id;
    }

    const poll = async () => {
      try {
        const res = await GroupChatService.getGroupMessages(roomId, undefined, 30);
        if (!res.success || !res.data) return;

        const polled = res.data.messages.slice().reverse();
        if (!polled.length) return;

        const latestNew = polled[polled.length - 1].id;
        if (latestNew === latestMessageId.current) return;

        const knownId = latestMessageId.current;
        const knownIdx = polled.findIndex((m) => m.id === knownId);
        const genuinelyNew = knownIdx >= 0 ? polled.slice(knownIdx + 1) : polled;

        if (!genuinelyNew.length) return;

        latestMessageId.current = latestNew;
        onMessagesUpdate([...messages, ...genuinelyNew], res.data.nextCursor ?? null);

        GroupChatService.markGroupAsRead(roomId).catch(() => {});
      } catch {
        // ignore
      }
    };

    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [roomId, messages, onMessagesUpdate, isEnded]);

  // Upward infinite scroll
  const handleScroll = useCallback(async () => {
    const el = listRef.current;
    if (!el || !hasMore || isLoadingMore.current) return;
    if (el.scrollTop > 60) return;

    isLoadingMore.current = true;
    const prevScrollHeight = el.scrollHeight;

    try {
      const res = await GroupChatService.getGroupMessages(roomId, nextCursor ?? undefined, 30);
      if (!res.success || !res.data) return;

      const older = res.data.messages.slice().reverse();
      const merged = [...older, ...messages];
      skipNextAutoScroll.current = true;
      onMessagesUpdate(merged, res.data.nextCursor ?? null);

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

  const renderMessages = () => {
    const items: React.ReactNode[] = [];
    let prevDate: Date | null = null;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const msgDate = new Date(msg.createdAt);

      if (!prevDate || !isSameDay(prevDate, msgDate)) {
        items.push(
          <DateSeparator key={`date-${msg.id}`}>
            <DateChip>{formatDateLabel(msgDate)}</DateChip>
          </DateSeparator>
        );
        prevDate = msgDate;
      }

      const isMine = msg.senderId === currentUserId;
      // 앞뒤 메시지에서 시스템 메시지는 그룹 경계로 취급
      const prevMsg = i > 0 ? messages[i - 1] : null;
      const nextMsg = messages[i + 1] ?? null;

      const isFirstInGroup =
        !prevMsg ||
        prevMsg.type === 'SYSTEM' ||
        prevMsg.type === 'VOTE_OPENED' ||
        prevMsg.senderId !== msg.senderId ||
        !isSameDay(new Date(prevMsg.createdAt), msgDate);

      const isLastInGroup =
        !nextMsg ||
        nextMsg.type === 'SYSTEM' ||
        nextMsg.type === 'VOTE_OPENED' ||
        nextMsg.senderId !== msg.senderId ||
        !isSameDay(new Date(nextMsg.createdAt), msgDate);

      if (msg.type === 'SYSTEM') {
        items.push(
          <SystemMessageRow key={msg.id}>
            <SystemMessageText>{msg.content}</SystemMessageText>
          </SystemMessageRow>
        );
      } else if (msg.type === 'VOTE_OPENED') {
        const voteId = msg.voteMeta?.voteId;

        items.push(
          <VoteCreatedMessageBubble
            key={msg.id}
            isMine={isMine}
            senderNickname={msg.senderNickname}
            senderAvatarUrl={msg.senderAvatarUrl}
            isFirstInGroup={isFirstInGroup}
            isLastInGroup={isLastInGroup}
            placeSummary={msg.voteMeta?.placeSummary ?? { head: "", extraCount: 0 }}
            timeSummary={msg.voteMeta?.timeSummary ?? { head: "", extraCount: 0 }}
            timestamp={msg.createdAt}
            unreadCount={msg.unreadCount}
            onClick={() => {
              if (voteId) onVoteMessageClick?.(voteId);
            }}
          />
        );
      } else {
        items.push(
          <GroupMessageBubble
            key={msg.id}
            message={msg}
            isMine={isMine}
            isFirstInGroup={isFirstInGroup}
            isLastInGroup={isLastInGroup}
          />
        );
      }
    }

    return items;
  };

  return (
    <ListContainer ref={listRef}>
      {renderMessages()}
      {isEnded && (
        <EndedNoticeCard>
          <EndedNoticeContent>
            <EndedNoticeIcon aria-hidden="true">i</EndedNoticeIcon>
            <EndedNoticeMessage>
              {endedMessage ?? "대화가 종료되어 메시지를 보낼 수 없어요."}
            </EndedNoticeMessage>
          </EndedNoticeContent>
        </EndedNoticeCard>
      )}
      <div ref={bottomRef} />
    </ListContainer>
  );
}

const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: var(--color-semantic-background-normal-normal);
`;

const DateSeparator = styled.div`
  display: flex;
  justify-content: center;
  margin: 4px 0;
`;

const DateChip = styled.div`
  background: var(--color-semantic-fill-normal);
  padding: 4px 8px;
  border-radius: 8px;
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: 1.385;
  color: var(--color-semantic-label-alternative);
`;

const SystemMessageRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px 0;
`;

const SystemMessageText = styled.span`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: 1.385;
  letter-spacing: 0.2522px;
  color: var(--color-semantic-label-alternative);
  text-align: center;
`;

const EndedNoticeCard = styled.div`
  position: relative;
  overflow: clip;
  border-radius: 12px;
  width: 100%;
  margin-top: 4px;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-color: var(--color-semantic-background-normal-normal);
    opacity: 0.88;
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background-color: var(--color-semantic-primary-normal);
    opacity: 0.05;
  }
`;

const EndedNoticeContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  padding: 12px;
  box-sizing: border-box;
`;

const EndedNoticeIcon = styled.span`
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
  background-color: var(--color-semantic-label-normal);
  color: var(--color-semantic-static-white);
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-2-font-size);
  font-weight: 700;
  line-height: 1;
`;

const EndedNoticeMessage = styled.p`
  flex: 1;
  margin: 0;
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: 1.467;
  letter-spacing: 0.144px;
  color: var(--color-semantic-label-normal);
  font-feature-settings: "ss10" on;
`;
