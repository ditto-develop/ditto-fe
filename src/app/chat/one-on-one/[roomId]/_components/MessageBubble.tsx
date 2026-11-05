"use client";

import styled from "styled-components";
import { selectableContent } from "@/shared/styles/selection";
import { ChatImage } from "@/app/chat/_components/ChatImage";
import { ChatMessageText } from "@/app/chat/_components/ChatMessageText";

import { getSystemMessageText } from "@/features/chat";
import type { ChatMessage, ChatOptimisticMessage } from "@/features/chat";
import { parseQuizCard, parseQuizHint } from "@/features/chat/lib/quizMessage";
import { ChatQuizCardView } from "@/features/records/ui/ChatQuizCardView";
import { RoomFirstHintCard } from "@/features/records/ui/RoomFirstHintCard";
import { RoomNoticeCard } from "./RoomNoticeCard";

interface MessageBubbleProps {
  message: ChatMessage | ChatOptimisticMessage;
  isMine: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  partnerAvatarUrl: string | null;
  partnerNickname: string;
  onImageClick?: (imageUrl: string) => void;
  /** 상대 아바타를 누르면 상대 프로필을 연다. */
  onPartnerClick?: () => void;
  onRetry?: () => void;
  /** 질문 카드의 문항 번호. 카드에는 없어 방 답변을 읽었을 때만(`RECORDS` 플래그) 안다. */
  quizOrderOf?: (quizId: number) => number | null;
}

function formatTime(date: string): string {
  // BE는 `yyyy-MM-dd HH:mm:ss`로 내려준다. Safari에서 파싱되도록 T로 바꾼다.
  const d = new Date(date.includes("T") ? date : date.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function MessageBubble({
  message,
  isMine,
  isFirstInGroup,
  partnerAvatarUrl,
  partnerNickname,
  onImageClick,
  onPartnerClick,
  onRetry,
  quizOrderOf,
}: MessageBubbleProps) {
  const messageId = "id" in message ? message.id : undefined;

  // SYSTEM 메시지는 좌우 구분 없이 가운데 안내로 표시한다.
  // content에는 문장이 아니라 사건 코드가 오므로 문구는 FE가 만든다.
  // isMine(senderId === 내 ID)이 곧 '내가 종료했는가'다. 모르는 코드는 아예 그리지 않는다.
  if (message.messageType === "SYSTEM") {
    const systemText = getSystemMessageText(message, isMine);
    if (!systemText) return null;

    return <RoomNoticeCard messageId={messageId}>{systemText}</RoomNoticeCard>;
  }

  // 8.1 첫 대화 힌트 — 보낸 사람 없는 서버 메시지라 SYSTEM 처럼 가운데에 둔다. content 는 JSON 이라
  // 읽지 못하면 아무것도 그리지 않는다(원문을 말풍선에 보이면 안 된다).
  if (message.messageType === "QUIZ_HINT") {
    const hint = parseQuizHint(message.content);
    if (!hint) return null;
    return (
      <HintRow data-chat-message-id={messageId}>
        <RoomFirstHintCard hint={hint} />
      </HintRow>
    );
  }

  const deliveryStatus = "status" in message ? message.status : null;
  const unreadCount = "unreadCount" in message ? message.unreadCount : 0;
  const imageUrl = "imageUrl" in message ? message.imageUrl : null;
  const body =
    message.messageType === "IMAGE" ? (
      <ImageButton
        type="button"
        onClick={() => imageUrl && onImageClick?.(imageUrl)}
        disabled={!imageUrl}
      >
        {imageUrl ? (
          <ChatImage key={imageUrl} src={imageUrl} alt="보낸 이미지" />
        ) : (
          <ImageFallback>
            {deliveryStatus === "failed" ? "사진 전송에 실패했어요" : "사진을 보내는 중이에요"}
          </ImageFallback>
        )}
      </ImageButton>
    ) : (
      <BubbleText><ChatMessageText content={message.content} /></BubbleText>
    );

  /*
   * 8.1 질문 카드(QUIZ_CARD). content 는 서버가 만든 카드 JSON 이다. 덧붙인 한마디는 바로 뒤 TEXT
   * 메시지로 따로 와 일반 말풍선으로 이어진다(Figma 3256:38421). `RECORDS` 플래그와 상관없이 그린다.
   */
  const quiz = message.messageType === "QUIZ_CARD" ? parseQuizCard(message.content) : null;
  if (message.messageType === "QUIZ_CARD" && !quiz) return null;
  const quizCard = quiz ? (
    <ChatQuizCardView
      card={quiz}
      sentByMe={isMine}
      partnerName={partnerNickname}
      order={quizOrderOf?.(quiz.quizId) ?? null}
    />
  ) : null;

  if (isMine) {
    if (quizCard) {
      return (
        <SentRow data-chat-message-id={messageId}>
          <SentMeta>
            {unreadCount > 0 && (
              <TimeLabel aria-label={`안 읽은 사람 ${unreadCount}명`}>{unreadCount}</TimeLabel>
            )}
            <TimeLabel>{formatTime(message.createdAt)}</TimeLabel>
          </SentMeta>
          <QuizStack $align="end">{quizCard}</QuizStack>
        </SentRow>
      );
    }

    return (
      <SentRow data-chat-message-id={messageId}>
        {deliveryStatus === "failed" ? (
          <FailureIcon aria-label="전송 실패">!</FailureIcon>
        ) : deliveryStatus === "sending" ? (
          <SendingIndicator aria-label="전송 중" />
        ) : (
          <SentMeta>
            {unreadCount > 0 && (
              <TimeLabel aria-label={`안 읽은 사람 ${unreadCount}명`}>{unreadCount}</TimeLabel>
            )}
            <TimeLabel>{formatTime(message.createdAt)}</TimeLabel>
          </SentMeta>
        )}
        <SentContent>
          <SentBubble
            $isFirstInGroup={isFirstInGroup}
            $isImage={message.messageType === "IMAGE"}
          >
            {body}
          </SentBubble>
          {deliveryStatus === "failed" && onRetry && (
            <RetryButton type="button" onClick={onRetry}>
              재전송
            </RetryButton>
          )}
        </SentContent>
      </SentRow>
    );
  }

  return (
    <ReceivedRow $isFirstInGroup={isFirstInGroup} data-chat-message-id={messageId}>
      {isFirstInGroup && (
        <AvatarSlot
          type="button"
          onClick={onPartnerClick}
          disabled={!onPartnerClick}
          aria-label={`${partnerNickname} 프로필 보기`}
        >
          <Avatar src={partnerAvatarUrl ?? "/assets/avatar/f1.webp"} alt="" />
        </AvatarSlot>
      )}
      <ReceivedContainer>
        {isFirstInGroup && <NicknameLabel>{partnerNickname}</NicknameLabel>}
        <ReceivedBubbleRow>
          {quizCard ? (
            <QuizStack $align="start">{quizCard}</QuizStack>
          ) : (
            <ReceivedBubble
              $isFirstInGroup={isFirstInGroup}
              $isImage={message.messageType === "IMAGE"}
            >
              {body}
            </ReceivedBubble>
          )}
          {(
            <ReceivedMeta>
              {unreadCount > 0 && <TimeLabel aria-label={`안 읽은 사람 ${unreadCount}명`}>{unreadCount}</TimeLabel>}
              <TimeLabel>{formatTime(message.createdAt)}</TimeLabel>
            </ReceivedMeta>
          )}
        </ReceivedBubbleRow>
      </ReceivedContainer>
    </ReceivedRow>
  );
}

const SentRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 2px;
  width: 100%;
`;

const ReceivedRow = styled.div<{ $isFirstInGroup: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 2px;
  padding-left: ${({ $isFirstInGroup }) => ($isFirstInGroup ? "0" : "52px")};
`;

/* 첫 대화 힌트 — 메시지 목록 안 가운데 카드(Figma 3256:51233). 위아래로 띄워 말풍선 묶음과 떨어뜨린다. */
const HintRow = styled.div`
  width: 100%;
  margin: var(--spacing-6px) 0;
`;

/* 문항 카드. 덧붙인 한마디는 다음 TEXT 말풍선이다(Figma 3256:38421). */
const QuizStack = styled.div<{ $align: "start" | "end" }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ $align }) => ($align === "end" ? "flex-end" : "flex-start")};
  gap: var(--spacing-10px);
  min-width: 0;
  max-width: var(--space-64);
`;

const SentContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-2px);
`;

const AvatarSlot = styled.button`
  width: 40px;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;

  &:disabled {
    cursor: default;
  }
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--color-semantic-line-normal-alternative);
`;

const ReceivedContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
`;

const NicknameLabel = styled.span`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 600;
  line-height: 1.429;
  color: var(--color-semantic-label-alternative);
`;

const ReceivedBubbleRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
`;

const SentBubble = styled.div<{ $isFirstInGroup: boolean; $isImage: boolean }>`
  max-width: 255px;
  background-color: ${({ $isImage }) =>
    $isImage ? "transparent" : "var(--color-semantic-fill-strong)"};
  border-radius: ${({ $isFirstInGroup }) => ($isFirstInGroup ? "12px 0 12px 12px" : "12px")};
  padding: ${({ $isImage }) => ($isImage ? "0" : "8px")};
  overflow: hidden;
  word-break: break-word;
  ${selectableContent}
`;

const ReceivedBubble = styled.div<{ $isFirstInGroup: boolean; $isImage: boolean }>`
  max-width: 255px;
  background-color: ${({ $isImage }) =>
    $isImage ? "transparent" : "var(--color-semantic-static-white)"};
  border-radius: ${({ $isFirstInGroup }) => ($isFirstInGroup ? "0 12px 12px 12px" : "12px")};
  padding: ${({ $isImage }) => ($isImage ? "0" : "8px")};
  overflow: hidden;
  word-break: break-word;
  ${selectableContent}
`;

const BubbleText = styled.p`
  white-space: pre-wrap;
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: 1.6;
  letter-spacing: 0.144px;
  color: var(--color-semantic-label-normal);
  margin: 0;
  white-space: pre-wrap;
`;

const ImageButton = styled.button`
  display: block;
  padding: 0;
  border: none;
  background: none;
  cursor: ${({ disabled }) => (disabled ? "default" : "zoom-in")};
  line-height: 0;
`;


// 로드된 ChatImage와 같은 칸 크기여야 전송 완료 시 버블이 튀지 않는다.
const ImageFallback = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
  border-radius: 12px;
  background-color: var(--color-semantic-fill-normal);
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-2-font-size);
  color: var(--color-semantic-label-alternative);
`;

/*
 * 안읽음 수는 시간 위, 말풍선 쪽 끝에 붙인다(그룹 말풍선과 같은 배치). 시간 칸의 반대쪽 끝에
 * 두면 시간 글자 폭만큼 말풍선에서 떨어져 보였다(QA 2026-10-26).
 */
const SentMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 2px;
  flex-shrink: 0;
`;

const FailureIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--space-4);
  height: var(--space-4);
  flex-shrink: 0;
  margin-bottom: var(--space-2);
  border-radius: 50%;
  background-color: var(--color-semantic-status-negative);
  color: var(--color-semantic-static-white);
  font-family: var(--typography-font-family);
  font-size: var(--typography-caption-2-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-caption-2-line-height);
`;

const SendingIndicator = styled.span`
  width: var(--space-4);
  height: var(--space-4);
  flex-shrink: 0;
  margin-bottom: var(--space-2);
  border-radius: 50%;
  background-color: var(--color-semantic-label-assistive);
  opacity: var(--color-atomic-opacity-52);
`;

const RetryButton = styled.button`
  padding: var(--space-1) 0 0;
  border: 0;
  background: transparent;
  color: var(--color-semantic-label-alternative);
  font-family: var(--typography-font-family);
  font-size: var(--typography-caption-1-font-size);
  font-weight: var(--typography-caption-1-font-weight);
  line-height: var(--typography-caption-1-line-height);
  letter-spacing: var(--typography-caption-1-letter-spacing);
  text-decoration: underline;
  cursor: pointer;
`;

/* SentMeta 와 좌우만 바꾼 배치. 가로로 두면 안읽음 수와 시간이 붙어 "112:30"처럼 읽혔다. */
const ReceivedMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 2px;
  flex-shrink: 0;
`;

const TimeLabel = styled.span`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-caption-2-font-size);
  font-weight: 500;
  line-height: 1.273;
  letter-spacing: 0.342px;
  color: var(--color-semantic-label-alternative);
  white-space: nowrap;
`;
