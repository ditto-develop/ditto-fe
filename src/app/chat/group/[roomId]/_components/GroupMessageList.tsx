"use client";

import { useCallback, useEffect, useRef } from "react";
import type React from "react";
import styled from "styled-components";
import { getSystemMessageText } from "@/features/chat";
import type { ChatMessage, CounterpartProfile } from "@/features/chat";
import { GroupMessageBubble } from "./GroupMessageBubble";

interface GroupMessageListProps {
  messages: ChatMessage[];
  myUserId: number | null;
  /** 보낸 사람 해석용. 방 목록에는 닉네임·이미지가 없어 프로필을 따로 붙여 넘긴다. */
  memberById: Map<number, CounterpartProfile>;
  hasMore: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => void;
  /** 종료·개방 전·연결 끊김 안내. 없으면 카드를 그리지 않는다. */
  notice?: string;
  onImageClick?: (imageUrl: string) => void;
}

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** BE는 `yyyy-MM-dd HH:mm:ss`로 내려준다. Safari 파싱을 위해 T로 바꾼다. */
function toDate(value: string): Date {
  return new Date(value.includes("T") ? value : value.replace(" ", "T"));
}

function formatDateLabel(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${DAYS[date.getDay()]}요일`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function GroupMessageList({
  messages,
  myUserId,
  memberById,
  hasMore,
  loadingOlder,
  onLoadOlder,
  notice,
  onImageClick,
}: GroupMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const renderedLatestMessageId = useRef<number | null>(null);
  const skipNextAutoScroll = useRef(false);
  const previousScrollHeight = useRef(0);

  // 새 메시지에서만 바닥으로 붙는다. 위로 스크롤해 과거를 불러온 직후에는 붙지 않는다.
  useEffect(() => {
    const latest = messages[messages.length - 1];
    if (!latest) return;

    if (renderedLatestMessageId.current === latest.id) {
      skipNextAutoScroll.current = false;
      return;
    }
    renderedLatestMessageId.current = latest.id;

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

  // 과거 메시지는 훅이 커서로 가져온다. 여기서는 스크롤 위치만 보존한다.
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || !hasMore || loadingOlder) return;
    if (el.scrollTop > 60) return;

    skipNextAutoScroll.current = true;
    previousScrollHeight.current = el.scrollHeight;
    onLoadOlder();
  }, [hasMore, loadingOlder, onLoadOlder]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return undefined;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const renderMessages = () => {
    const items: React.ReactNode[] = [];
    let prevDate: Date | null = null;

    messages.forEach((message, index) => {
      const messageDate = toDate(message.createdAt);

      if (!prevDate || !isSameDay(prevDate, messageDate)) {
        items.push(
          <DateSeparator key={`date-${message.id}`}>
            <DateChip>{formatDateLabel(messageDate)}</DateChip>
          </DateSeparator>,
        );
        prevDate = messageDate;
      }

      const isMine = myUserId !== null && message.senderId === myUserId;

      if (message.messageType === "SYSTEM") {
        // content는 사건 코드다. 모르는 코드는 그리지 않는다.
        const systemText = getSystemMessageText(message, isMine);
        if (systemText) {
          items.push(
            <SystemMessageRow key={message.id}>
              <SystemMessageText>{systemText}</SystemMessageText>
            </SystemMessageRow>,
          );
        }
        return;
      }

      const previous = index > 0 ? messages[index - 1] : null;
      const next = messages[index + 1] ?? null;

      const isFirstInGroup =
        !previous ||
        previous.messageType === "SYSTEM" ||
        previous.senderId !== message.senderId ||
        !isSameDay(toDate(previous.createdAt), messageDate);

      const isLastInGroup =
        !next ||
        next.messageType === "SYSTEM" ||
        next.senderId !== message.senderId ||
        !isSameDay(toDate(next.createdAt), messageDate);

      const sender = memberById.get(message.senderId);

      items.push(
        <GroupMessageBubble
          key={message.id}
          message={message}
          isMine={isMine}
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
          senderNickname={sender?.nickname ?? "알 수 없음"}
          senderAvatarUrl={sender?.profileImageUrl ?? null}
          onImageClick={onImageClick}
        />,
      );
    });

    return items;
  };

  return (
    <ListContainer ref={listRef}>
      {loadingOlder && <LoadingOlder>이전 메시지를 불러오는 중...</LoadingOlder>}
      {renderMessages()}
      {notice && (
        <EndedNoticeCard>
          <EndedNoticeContent>
            <EndedNoticeIcon aria-hidden="true">i</EndedNoticeIcon>
            <EndedNoticeMessage>{notice}</EndedNoticeMessage>
          </EndedNoticeContent>
        </EndedNoticeCard>
      )}
      <div ref={bottomRef} />
    </ListContainer>
  );
}

const LoadingOlder = styled.div`
  display: flex;
  justify-content: center;
  padding: 4px 0;
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-2-font-size);
  color: var(--color-semantic-label-alternative);
`;
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
