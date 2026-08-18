"use client";

import React, { useCallback, useEffect, useRef } from "react";
import styled from "styled-components";

import { isRoomEndedSystemMessage } from "@/features/chat";
import type { ChatMessage, ChatOptimisticMessage } from "@/features/chat";
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
const URL_PATTERN =
  /((https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9-]+\.(com|net|org|io|co|me|kr|app|dev|gg|tv|ly|to|ai|so|xyz|site|info|link)(\/[^\s]*)?)/i;
const ACCOUNT_PATTERN = /\b\d{2,6}-\d{2,6}-\d{2,10}\b/;
const MONEY_REQUEST_PATTERN =
  /(입금|송금|계좌|계좌번호|보내주|보내 주세요|보내주세요|입금해|입금해 주세요|입금해주세요|수수료|선입금|착불|돈\s*보내|금액|만원|원\b|페이|송금해|이체)/;

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
  const renderedLatestKey = useRef<string | null>(null);
  // 위로 스크롤로 과거를 붙이면 스크롤 위치를 보정해야 하므로 자동 스크롤을 한 번 건너뛴다.
  const skipNextAutoScroll = useRef(false);
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

      if (isTextMessage(message) && URL_PATTERN.test(message.content)) {
        items.push(
          <SectionWarning
            key={`link-warning-${key}`}
            message="출처 불명의 링크는 악성코드 또는 피싱 사이트로 연결될 수 있습니다. 클릭에 주의하세요!"
          />,
        );
      }

      if (
        isTextMessage(message) &&
        (ACCOUNT_PATTERN.test(message.content) || MONEY_REQUEST_PATTERN.test(message.content))
      ) {
        items.push(
          <SectionWarning
            key={`money-warning-${key}`}
            message="금전 요구는 100% 사기입니다. 피해 위험이 있으니 주의하세요!"
          />,
        );
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

function SectionWarning({ message }: { message: string }) {
  return (
    <WarningCard>
      <WarningCardContent>
        <WarningIconWrap>
          <WarningIconBackdrop />
          <WarningIcon src="/icons/status/warning.svg" alt="주의" width={20} height={20} />
        </WarningIconWrap>
        <WarningMessage>{message}</WarningMessage>
      </WarningCardContent>
    </WarningCard>
  );
}

const WarningCard = styled.div`
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
    background-color: var(--color-semantic-status-cautionary);
    opacity: 0.05;
  }
`;

const WarningCardContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  padding: 12px;
  box-sizing: border-box;
`;

const WarningIconWrap = styled.div`
  position: relative;
  width: 20px;
  height: 22px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const WarningIconBackdrop = styled.div`
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 5px;
  right: 5px;
  background-color: var(--color-semantic-static-white);
  border-radius: 100px;
`;

const WarningIcon = styled.img`
  position: relative;
  z-index: 1;
  width: 20px;
  height: 20px;
`;

const WarningMessage = styled.p`
  flex: 1;
  margin: 0;
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: 1.467;
  letter-spacing: 0.144px;
  color: var(--color-semantic-status-cautionary);
  font-feature-settings: "ss10" on;
`;
