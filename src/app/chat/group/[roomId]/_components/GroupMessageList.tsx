"use client";

import { useCallback, useEffect, useRef } from "react";
import type React from "react";
import styled from "styled-components";
import {
  formatMeetAt,
  getSystemMessageText,
  parseVoteSystemMessage,
  summarizeVoteOutcome,
} from "@/features/chat";
import type { ChatMessage, CounterpartProfile, GroupVote } from "@/features/chat";
import { renderChatSafetyWarnings } from "@/app/chat/_components/ChatSafetyWarning";
import {
  isPinnedToBottom,
  scrollListToBottom,
  useStayAtBottom,
} from "@/features/chat/hooks/useStayAtBottom";
import { useKeepScrollOnPrepend } from "@/features/chat/hooks/useKeepScrollOnPrepend";
import { useVisibleMessageRead } from "@/features/chat/hooks/useVisibleMessageRead";
import { isServerGeneratedMessage, parseQuizCard, parseQuizHint } from "@/features/chat/lib/quizMessage";
import type { QuizDistributionResponse } from "@/features/records/model/types";
import { RoomFirstHintCard } from "@/features/records/ui/RoomFirstHintCard";
import { GroupMessageBubble } from "./GroupMessageBubble";
import { VoteCreatedMessageBubble } from "./VoteCreatedMessageBubble";
import { VoteResultMessageBubble } from "./VoteResultMessageBubble";

interface GroupMessageListProps {
  messages: ChatMessage[];
  myUserId: number | null;
  /** 보낸 사람 해석용. 방 목록에는 닉네임·이미지가 없어 프로필을 따로 붙여 넘긴다. */
  memberById: Map<number, CounterpartProfile>;
  hasMore: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => void;
  onVisibleMessage: (messageId: number) => void;
  /** 종료·개방 전·연결 끊김 안내. 없으면 카드를 그리지 않는다. */
  notice?: string;
  onImageClick?: (imageUrl: string) => void;
  /** VOTE_CREATED 카드의 요약을 그리려면 상세가 필요하다. 아직 못 읽었으면 null. */
  getVoteById?: (voteId: number) => GroupVote | null;
  onVoteClick?: (voteId: number) => void;
  /** 보낸 사람 아바타를 누르면 그 사람 프로필을 연다. */
  onSenderClick?: (member: CounterpartProfile) => void;
  /**
   * 8.1 방 답변 분포(`RECORDS` 플래그가 켜져 있을 때만 값이 있다). 질문 카드에 문항 번호·내 선택지를 붙일 때 쓴다 —
   * 서버 그룹 카드에는 둘 다 없다.
   */
  quizDistribution?: QuizDistributionResponse | null;
}

/** `"성수 카페거리 외 2개"`. 선택지가 없으면 빈 문자열이라 호출부가 대체 문구를 쓴다. */
function toSummary(labels: string[]): { head: string; extraCount: number } {
  return { head: labels[0] ?? "", extraCount: Math.max(0, labels.length - 1) };
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
  onVisibleMessage,
  notice,
  onImageClick,
  getVoteById,
  onVoteClick,
  onSenderClick,
  quizDistribution = null,
}: GroupMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const wasPinnedToBottom = useRef(true);
  // 키보드가 열리고 닫혀 목록 높이가 바뀌어도 바닥에 붙어 있게 한다(위로 읽는 중이면 건드리지 않는다).
  useStayAtBottom(listRef);

  const renderedLatestMessageId = useRef<number | null>(null);
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

  const { beginPrepend, isPending: isPrependPending } = useKeepScrollOnPrepend(
    listRef,
    messages[0]?.id ?? null,
    loadingOlder,
  );

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

    const sentByMe = myUserId !== null && latest.senderId === myUserId;
    if (!isInitialLoad.current && !wasPinnedToBottom.current && !sentByMe) return;

    const behavior: ScrollBehavior = isInitialLoad.current ? "instant" : "smooth";
    isInitialLoad.current = false;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const list = listRef.current;
        if (list) scrollListToBottom(list, behavior);
      });
    });
  }, [messages, myUserId]);

  // 최초 바닥 정렬이 예약된 뒤 가시성 검사를 붙여, 화면이 이동하기 전 ID를 먼저 보내지 않는다.
  useVisibleMessageRead(
    listRef,
    messages.map((message) => message.id).join(","),
    onVisibleMessage,
  );

  // 과거 메시지는 훅이 커서로 가져온다. 여기서는 스크롤 위치만 보존한다.
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    wasPinnedToBottom.current = isPinnedToBottom(el);
    if (!hasMore || loadingOlder || isPrependPending()) return;
    if (!userHasScrolled.current) return;
    if (el.scrollTop > 60) return;

    skipNextAutoScroll.current = true;
    beginPrepend();
    onLoadOlder();
  }, [beginPrepend, hasMore, isPrependPending, loadingOlder, onLoadOlder]);

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
      // 첫 대화 힌트(QUIZ_HINT)만 보낸 사람이 없다.
      const senderOf = (memberId: number | null) =>
        memberId === null ? undefined : memberById.get(memberId);

      // 8.1 첫 대화 힌트 — 서버 메시지라 가운데 카드로 둔다. 읽지 못하면 원문 JSON 을 보이지 않게 건너뛴다.
      if (message.messageType === "QUIZ_HINT") {
        const hint = parseQuizHint(message.content);
        if (hint) {
          items.push(
            <HintRow key={message.id} data-chat-message-id={message.id}>
              <RoomFirstHintCard hint={hint} />
            </HintRow>,
          );
        }
        return;
      }

      if (message.messageType === "SYSTEM") {
        // 투표 코드만 `:{voteId}` 접미가 붙는다. 카드로 그려야 하므로 먼저 가른다.
        const voteEvent = parseVoteSystemMessage(message);

        if (voteEvent?.code === "VOTE_CREATED") {
          const vote = getVoteById?.(voteEvent.voteId) ?? null;
          const creator = senderOf(message.senderId);

          items.push(
            <VoteCreatedMessageBubble
              key={message.id}
              messageId={message.id}
              isMine={isMine}
              senderNickname={creator?.nickname ?? "알 수 없음"}
              senderAvatarUrl={creator?.profileImageUrl ?? null}
              // 투표 카드는 늘 한 장짜리다 — 연속 말풍선 묶음에 넣지 않는다.
              isFirstInGroup
              isLastInGroup
              placeSummary={toSummary((vote?.placeOptions ?? []).map((option) => option.label))}
              timeSummary={toSummary(
                (vote?.timeOptions ?? []).map((option) => formatMeetAt(option.meetAt)),
              )}
              timestamp={message.createdAt}
              onClick={() => onVoteClick?.(voteEvent.voteId)}
              onAvatarClick={creator && onSenderClick ? () => onSenderClick(creator) : undefined}
            />,
          );
          return;
        }

        if (voteEvent?.code === "VOTE_CLOSED") {
          const vote = getVoteById?.(voteEvent.voteId) ?? null;
          /*
           * 상세를 아직 못 읽었거나(vote === null) 아무도 고르지 않은 채 마감되면
           * 보여 줄 결과가 없다. 그때만 예전 한 줄 안내로 떨어진다.
           */
          const outcome = vote ? summarizeVoteOutcome(vote) : null;

          if (!outcome) {
            items.push(
              <SystemMessageRow key={message.id} data-chat-message-id={message.id}>
                <SystemMessageText>만남 투표가 마감됐어요.</SystemMessageText>
              </SystemMessageRow>,
            );
            return;
          }

          const closerId = vote?.closedBy ?? message.senderId;
          const closer = senderOf(closerId);

          items.push(
            <VoteResultMessageBubble
              key={message.id}
              messageId={message.id}
              isMine={myUserId !== null && closerId === myUserId}
              senderNickname={closer?.nickname ?? "알 수 없음"}
              senderAvatarUrl={closer?.profileImageUrl ?? null}
              // 결과 카드도 늘 한 장짜리다 — 연속 말풍선 묶음에 넣지 않는다.
              isFirstInGroup
              isLastInGroup
              outcome={outcome}
              timestamp={message.createdAt}
              onClick={() => onVoteClick?.(voteEvent.voteId)}
              onAvatarClick={closer && onSenderClick ? () => onSenderClick(closer) : undefined}
            />,
          );
          return;
        }

        // content는 사건 코드다. 모르는 코드는 그리지 않는다.
        // MEMBER_LEFT는 나간 사람 이름이 필요해 senderId로 프로필을 찾아 넘긴다.
        const systemText = getSystemMessageText(
          message,
          isMine,
          senderOf(message.senderId)?.nickname,
        );
        if (systemText) {
          items.push(
            <SystemMessageRow key={message.id} data-chat-message-id={message.id}>
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
        isServerGeneratedMessage(previous) ||
        previous.senderId !== message.senderId ||
        !isSameDay(toDate(previous.createdAt), messageDate);

      const isLastInGroup =
        !next ||
        isServerGeneratedMessage(next) ||
        next.senderId !== message.senderId ||
        !isSameDay(toDate(next.createdAt), messageDate);

      const sender = senderOf(message.senderId);
      const cardQuizId =
        message.messageType === "QUIZ_CARD" ? (parseQuizCard(message.content)?.quizId ?? null) : null;
      const quizItem =
        cardQuizId === null
          ? null
          : (quizDistribution?.items.find((item) => item.quizId === cardQuizId) ?? null);

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
          // 나간 회원은 memberById 에 없다 — 열 프로필이 없으니 누를 수 없게 둔다.
          onAvatarClick={sender && onSenderClick ? () => onSenderClick(sender) : undefined}
          quizOrder={quizItem?.order ?? null}
          quizMyChoiceId={quizItem?.myChoiceId ?? null}
        />,
      );

      /**
       * 링크·금전 요구 주의 카드. 1:1 방에만 있었는데 같은 수법이 그룹 방에도 그대로
       * 들어온다(2026-09-15 QA). IMAGE 의 content 는 objectKey, 퀴즈 메시지는 JSON 이라 TEXT 만 본다.
       * 질문 카드에 덧붙인 한마디는 서버가 따로 TEXT 로 저장해 여기서 같이 걸린다.
       */
      if (message.messageType === "TEXT") {
        items.push(...renderChatSafetyWarnings(message.content, String(message.id)));
      }
    });

    return items;
  };

  return (
    <ListContainer ref={listRef} data-cy="message-list">
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
      <div />
    </ListContainer>
  );
}

/* 첫 대화 힌트 — 메시지 목록 안 가운데 카드(Figma 3270:36280). 위아래로 띄워 말풍선 묶음과 떨어뜨린다. */
const HintRow = styled.div`
  width: 100%;
  margin: var(--spacing-6px) 0;
`;

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
