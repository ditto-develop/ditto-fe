"use client";

import styled from "styled-components";

import { getSystemMessageText } from "@/features/chat";
import type { ChatMessage, ChatOptimisticMessage } from "@/features/chat";
import { RoomNoticeCard } from "./RoomNoticeCard";

interface MessageBubbleProps {
  message: ChatMessage | ChatOptimisticMessage;
  isMine: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  partnerAvatarUrl: string | null;
  partnerNickname: string;
  onImageClick?: (imageUrl: string) => void;
  onRetry?: () => void;
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
  isLastInGroup,
  partnerAvatarUrl,
  partnerNickname,
  onImageClick,
  onRetry,
}: MessageBubbleProps) {
  // SYSTEM 메시지는 좌우 구분 없이 가운데 안내로 표시한다.
  // content에는 문장이 아니라 사건 코드가 오므로 문구는 FE가 만든다.
  // isMine(senderId === 내 ID)이 곧 '내가 종료했는가'다. 모르는 코드는 아예 그리지 않는다.
  if (message.messageType === "SYSTEM") {
    const systemText = getSystemMessageText(message, isMine);
    if (!systemText) return null;

    return <RoomNoticeCard>{systemText}</RoomNoticeCard>;
  }

  const deliveryStatus = "status" in message ? message.status : null;
  const imageUrl = "imageUrl" in message ? message.imageUrl : null;
  const body =
    message.messageType === "IMAGE" ? (
      <ImageButton
        type="button"
        onClick={() => imageUrl && onImageClick?.(imageUrl)}
        disabled={!imageUrl}
      >
        {imageUrl ? (
          <SentImage src={imageUrl} alt="보낸 이미지" loading="lazy" />
        ) : (
          <ImageFallback>
            {deliveryStatus === "failed" ? "사진 전송에 실패했어요" : "사진을 보내는 중이에요"}
          </ImageFallback>
        )}
      </ImageButton>
    ) : (
      <BubbleText>{message.content}</BubbleText>
    );

  if (isMine) {
    return (
      <SentRow>
        {deliveryStatus === "failed" ? (
          <FailureIcon aria-label="전송 실패">!</FailureIcon>
        ) : deliveryStatus === "sending" ? (
          <SendingIndicator aria-label="전송 중" />
        ) : isLastInGroup ? (
          <SentMeta>
            <TimeLabel>{formatTime(message.createdAt)}</TimeLabel>
          </SentMeta>
        ) : null}
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
    <ReceivedRow $isFirstInGroup={isFirstInGroup}>
      {isFirstInGroup && (
        <AvatarSlot>
          <Avatar src={partnerAvatarUrl ?? "/assets/avatar/f1.png"} alt={partnerNickname} />
        </AvatarSlot>
      )}
      <ReceivedContainer>
        {isFirstInGroup && <NicknameLabel>{partnerNickname}</NicknameLabel>}
        <ReceivedBubbleRow>
          <ReceivedBubble
            $isFirstInGroup={isFirstInGroup}
            $isImage={message.messageType === "IMAGE"}
          >
            {body}
          </ReceivedBubble>
          {isLastInGroup && (
            <ReceivedMeta>
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

const SentContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-2px);
`;

const AvatarSlot = styled.div`
  width: 40px;
  flex-shrink: 0;
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
`;

const ReceivedBubble = styled.div<{ $isFirstInGroup: boolean; $isImage: boolean }>`
  max-width: 255px;
  background-color: ${({ $isImage }) =>
    $isImage ? "transparent" : "var(--color-semantic-static-white)"};
  border-radius: ${({ $isFirstInGroup }) => ($isFirstInGroup ? "0 12px 12px 12px" : "12px")};
  padding: ${({ $isImage }) => ($isImage ? "0" : "8px")};
  overflow: hidden;
  word-break: break-word;
`;

const BubbleText = styled.p`
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

const SentImage = styled.img`
  display: block;
  max-width: 255px;
  max-height: 320px;
  width: auto;
  height: auto;
  border-radius: 12px;
  object-fit: cover;
`;

const ImageFallback = styled.span`
  display: inline-block;
  padding: 24px 16px;
  border-radius: 12px;
  background-color: var(--color-semantic-fill-normal);
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-2-font-size);
  color: var(--color-semantic-label-alternative);
`;

const SentMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
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

const ReceivedMeta = styled.div`
  display: flex;
  align-items: flex-end;
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
