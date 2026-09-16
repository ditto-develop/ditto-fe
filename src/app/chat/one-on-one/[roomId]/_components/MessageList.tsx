"use client";

import React, { useCallback, useEffect, useRef } from "react";
import styled from "styled-components";

import { isRoomEndedSystemMessage } from "@/features/chat";
import type { ChatMessage, ChatOptimisticMessage } from "@/features/chat";
import { renderChatSafetyWarnings } from "@/app/chat/_components/ChatSafetyWarning";
import { useStayAtBottom } from "@/features/chat/hooks/useStayAtBottom";
import { MessageBubble } from "./MessageBubble";
import { RoomNoticeCard } from "./RoomNoticeCard";

interface MessageListProps {
  messages: ChatMessage[];
  optimisticMessages?: ChatOptimisticMessage[];
  myUserId: number | null;
  partnerAvatarUrl: string | null;
  partnerNickname: string;
  hasMore: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => void;
  /** 연결이 끊겼을 때 상단에 띄우는 안내. */
  notice?: string | null;
  onImageClick?: (imageUrl: string) => void;
  onRetrySend?: (localId: string) => void;
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

/** 경고 배너는 사용자가 직접 쓴 TEXT에만 적용한다(IMAGE의 objectKey는 대상이 아니다). */
function isTextMessage(message: ChatMessage | ChatOptimisticMessage): boolean {
  return message.messageType === "TEXT";
}

function isOptimisticMessage(
  message: ChatMessage | ChatOptimisticMessage,
): message is ChatOptimisticMessage {
  return "localId" in message;
}

function messageKey(message: ChatMessage | ChatOptimisticMessage): string {
  return isOptimisticMessage(message) ? message.localId : String(message.id);
}

function senderKey(message: ChatMessage | ChatOptimisticMessage): string {
  return isOptimisticMessage(message) ? "optimistic-mine" : String(message.senderId);
}

export function MessageList({
  messages,
  optimisticMessages = [],
  myUserId,
  partnerAvatarUrl,
  partnerNickname,
  hasMore,
  loadingOlder,
  onLoadOlder,
  notice,
  onImageClick,
  onRetrySend,
}: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  // 키보드가 열리고 닫혀 목록 높이가 바뀌어도 바닥에 붙어 있게 한다(위로 읽는 중이면 건드리지 않는다).
  useStayAtBottom(listRef);

  const renderedLatestKey = useRef<string | null>(null);
  // 위로 스크롤로 과거를 붙이면 스크롤 위치를 보정해야 하므로 자동 스크롤을 한 번 건너뛴다.
  const skipNextAutoScroll = useRef(false);

  /**
   * 사용자가 실제로 목록을 만졌는가.
   *
   * 과거 페이지를 부르는 조건이 `scrollTop <= 60` 뿐이라, **바닥으로 맞추는 프로그램 스크롤도
   * scroll 이벤트를 낸다**는 점이 문제였다. 방이 짧아 바닥에서의 `scrollTop` 이 이미 60 이하면
   * (내용이 화면에 다 들어오면 0이다) 들어가자마자 "사용자가 위로 올렸다"로 오해해 과거를
   * 붙였고, 뒤이어 위치 보정이 돌면서 방금 맞춘 바닥 대신 **이전 페이지의 첫 메시지**로
   * 화면이 튀었다. "들어가면 내가 연달아 보낸 것 중 가장 오래된 메시지가 떠 있다"의 정체다.
   *
   * 손가락·휠·키보드가 닿기 전에는 과거를 부르지 않는다. 시간(setTimeout)으로 재면 기기
   * 성능에 따라 갈리지만, 입력 이벤트는 갈리지 않는다.
   */
  const userHasScrolled = useRef(false);

  const previousScrollHeight = useRef(0);

  useEffect(() => {
    const latest = optimisticMessages[optimisticMessages.length - 1] ?? messages[messages.length - 1];
    if (!latest) return;

    const latestKey = messageKey(latest);
    if (renderedLatestKey.current === latestKey) return;
    renderedLatestKey.current = latestKey;

    if (skipNextAutoScroll.current) {
      skipNextAutoScroll.current = false;
      const el = listRef.current;
      if (el) {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight - previousScrollHeight.current;
        });
      }
      return;
    }

    const behavior: ScrollBehavior = isInitialLoad.current ? "instant" : "smooth";
    isInitialLoad.current = false;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior }));
    });
  }, [messages, optimisticMessages]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || !hasMore || loadingOlder) return;
    if (!userHasScrolled.current) return;
    if (el.scrollTop > 60) return;

    skipNextAutoScroll.current = true;
    previousScrollHeight.current = el.scrollHeight;
    onLoadOlder();
  }, [hasMore, loadingOlder, onLoadOlder]);

  // 목록을 직접 만진 순간부터 과거 로드를 연다. 프로그램 스크롤은 이 이벤트를 내지 않는다.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return undefined;

    const markUserScroll = () => {
      userHasScrolled.current = true;
    };
    const events = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    events.forEach((type) => el.addEventListener(type, markUserScroll, { passive: true }));

    return () => {
      events.forEach((type) => el.removeEventListener(type, markUserScroll));
    };
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return undefined;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const renderMessages = () => {
    const items: React.ReactNode[] = [];
    let prevDate: Date | null = null;
    const displayMessages: (ChatMessage | ChatOptimisticMessage)[] = [
      ...messages,
      ...optimisticMessages,
    ];

    displayMessages.forEach((message, index) => {
      const messageDate = toDate(message.createdAt);
      const key = messageKey(message);

      if (!prevDate || !isSameDay(prevDate, messageDate)) {
        items.push(
          <DateSeparator key={`date-${key}`}>
            <DateChip>{formatDateLabel(messageDate)}</DateChip>
          </DateSeparator>,
        );
        prevDate = messageDate;
      }

      const previous = index > 0 ? displayMessages[index - 1] : null;
      const next = displayMessages[index + 1] ?? null;
      const isSystem = message.messageType === "SYSTEM";

      const isFirstInGroup =
        isSystem ||
        !previous ||
        senderKey(previous) !== senderKey(message) ||
        previous.messageType === "SYSTEM" ||
        !isSameDay(toDate(previous.createdAt), messageDate);

      const isLastInGroup =
        isSystem ||
        !next ||
        senderKey(next) !== senderKey(message) ||
        next.messageType === "SYSTEM" ||
        !isSameDay(toDate(next.createdAt), messageDate);

      items.push(
        <MessageBubble
          key={key}
          message={message}
          isMine={
            isOptimisticMessage(message) ||
            (myUserId !== null && message.senderId === myUserId)
          }
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
          partnerAvatarUrl={partnerAvatarUrl}
          partnerNickname={partnerNickname}
          onImageClick={onImageClick}
          onRetry={
            isOptimisticMessage(message) ? () => onRetrySend?.(message.localId) : undefined
          }
        />,
      );

      if (isTextMessage(message)) {
        items.push(...renderChatSafetyWarnings(message.content, key));
      }
    });

    return items;
  };

  const hasRoomEndedSystemMessage = messages.some(isRoomEndedSystemMessage);

  return (
    <ListContainer ref={listRef} data-cy="message-list">
      <WarningText>
        안전한 만남을 위해 가급적 ditto 에서 대화를 나눠주세요.{"\n"}
        불건전한 행위 발견 시 신고해 주세요.
      </WarningText>
      {loadingOlder && <LoadingOlder>이전 메시지를 불러오는 중...</LoadingOlder>}
      {renderMessages()}
      {notice && !hasRoomEndedSystemMessage && <RoomNoticeCard>{notice}</RoomNoticeCard>}
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

const WarningText = styled.p`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: 1.385;
  letter-spacing: 0.252px;
  color: var(--color-semantic-label-alternative);
  text-align: center;
  white-space: pre-line;
  margin: 4px 0 8px;
`;

const LoadingOlder = styled.p`
  margin: 0;
  text-align: center;
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-2-font-size);
  color: var(--color-semantic-label-alternative);
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

