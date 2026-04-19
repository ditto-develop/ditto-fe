"use client";

import { useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import { ChatService } from "@/lib/api/services/ChatService";
import type { MessageItem } from "./MessageBubble";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  roomId: string;
  messages: MessageItem[];
  currentUserId: string;
  partnerAvatarUrl: string | null;
  partnerNickname: string;
  partnerLastReadMessageId: string | null | undefined;
  onMessagesUpdate: (messages: MessageItem[], nextCursor: string | null, partnerLastReadMessageId?: string | null) => void;
  nextCursor: string | null;
  hasMore: boolean;
  isEnded: boolean;
  endedMessage?: string;
}

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const URL_PATTERN = /((https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9-]+\.(com|net|org|io|co|me|kr|app|dev|gg|tv|ly|to|ai|so|xyz|site|info|link)(\/[^\s]*)?)/i;
const ACCOUNT_PATTERN = /\b\d{2,6}-\d{2,6}-\d{2,10}\b/;
const MONEY_REQUEST_PATTERN =
  /(입금|송금|계좌|계좌번호|보내주|보내 주세요|보내주세요|입금해|입금해 주세요|입금해주세요|수수료|선입금|착불|돈\s*보내|금액|만원|원\b|페이|송금해|이체)/;

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

function containsExternalLink(content: string): boolean {
  return URL_PATTERN.test(content);
}

function containsMoneyRequest(content: string): boolean {
  return ACCOUNT_PATTERN.test(content) || MONEY_REQUEST_PATTERN.test(content);
}

export function MessageList({
  roomId,
  messages,
  currentUserId,
  partnerAvatarUrl,
  partnerNickname,
  partnerLastReadMessageId,
  onMessagesUpdate,
  nextCursor,
  hasMore,
  isEnded,
  endedMessage,
}: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isLoadingMore = useRef(false);
  const latestMessageId = useRef<string | null>(null);
  const isInitialLoad = useRef(true);
  const renderedLatestMessageId = useRef<string | null>(null);
  const skipNextAutoScroll = useRef(false);

  // Keep the newest message visible after initial load, sends, and polling updates.
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

  // Polling — skip for ended rooms
  useEffect(() => {
    if (isEnded) return;

    if (messages.length > 0) {
      latestMessageId.current = messages[messages.length - 1].id;
    }

    const poll = async () => {
      try {
        const res = await ChatService.chatControllerGetMessages(roomId, undefined, 30);
        if (!res.success || !res.data) return;

        const polled = (res.data.messages as MessageItem[]).slice().reverse();
        if (!polled.length) return;

        const latestNew = polled[polled.length - 1].id;
        if (latestNew === latestMessageId.current) return;

        const knownId = latestMessageId.current;
        const knownIdx = polled.findIndex((m) => m.id === knownId);
        const genuinelyNew = knownIdx >= 0 ? polled.slice(knownIdx + 1) : polled;

        if (!genuinelyNew.length) return;

        latestMessageId.current = latestNew;
        onMessagesUpdate(
          [...messages, ...genuinelyNew],
          res.data.nextCursor ?? null,
          res.data.partnerLastReadMessageId ?? null,
        );

        ChatService.chatControllerMarkAsRead(roomId).catch(() => {});
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
      const res = await ChatService.chatControllerGetMessages(roomId, nextCursor ?? undefined, 30);
      if (!res.success || !res.data) return;

      const older = (res.data.messages as MessageItem[]).slice().reverse();
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

    // partnerLastReadMessageId: 상대가 읽은 마지막 메시지 ID
    // 그 ID 이하에 있는 내 메시지 중 가장 마지막에만 읽음 표시
    const readReceiptMessageId = (() => {
      if (!partnerLastReadMessageId) return null;
      const idx = messages.findIndex((m) => m.id === partnerLastReadMessageId);
      const searchUpTo = idx >= 0 ? idx : messages.length - 1;
      for (let i = searchUpTo; i >= 0; i--) {
        if (messages[i].senderId === currentUserId) return messages[i].id;
      }
      return null;
    })();

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const msgDate = new Date(msg.createdAt);

      // Date separator
      if (!prevDate || !isSameDay(prevDate, msgDate)) {
        items.push(
          <DateSeparator key={`date-${msg.id}`}>
            <DateChip>{formatDateLabel(msgDate)}</DateChip>
          </DateSeparator>
        );
        prevDate = msgDate;
      }

      const isMine = msg.senderId === currentUserId;
      const prevMsg = i > 0 ? messages[i - 1] : null;
      const nextMsg = messages[i + 1] ?? null;

      const isFirstInGroup =
        !prevMsg ||
        prevMsg.senderId !== msg.senderId ||
        !isSameDay(new Date(prevMsg.createdAt), msgDate);

      const isLastInGroup =
        !nextMsg ||
        nextMsg.senderId !== msg.senderId ||
        !isSameDay(new Date(nextMsg.createdAt), msgDate);

      items.push(
        <MessageBubble
          key={msg.id}
          message={msg}
          isMine={isMine}
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
          showReadReceipt={msg.id === readReceiptMessageId}
          partnerAvatarUrl={partnerAvatarUrl}
          partnerNickname={partnerNickname}
        />
      );

      if (containsExternalLink(msg.content)) {
        items.push(
          <SectionWarning
            key={`link-warning-${msg.id}`}
            message="출처 불명의 링크는 악성코드 또는 피싱 사이트로 연결될 수 있습니다. 클릭에 주의하세요!"
          />
        );
      }

      if (containsMoneyRequest(msg.content)) {
        items.push(
          <SectionWarning
            key={`money-warning-${msg.id}`}
            message="금전 요구는 100% 사기입니다. 피해 위험이 있으니 주의하세요!"
          />
        );
      }
    }

    return items;
  };

  return (
    <ListContainer ref={listRef}>
      {!isEnded && (
        <WarningText>
          안전한 만남을 위해 가급적 ditto 에서 대화를 나눠주세요.{"\n"}
          불건전한 행위 발견 시 신고해 주세요.
        </WarningText>
      )}
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
          <WarningIcon
            src="/icons/status/warning.svg"
            alt="주의"
            width={20}
            height={20}
          />
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
