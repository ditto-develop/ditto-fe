"use client";

import styled from "styled-components";

import type { ChatMessage } from "@/features/chat";

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  partnerAvatarUrl: string | null;
  partnerNickname: string;
  onImageClick?: (imageUrl: string) => void;
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
}: MessageBubbleProps) {
  // SYSTEM 메시지는 좌우 구분 없이 가운데 안내로 표시한다.
  if (message.messageType === "SYSTEM") {
    return (
      <SystemRow>
        <SystemText>{message.content}</SystemText>
      </SystemRow>
    );
  }

  const body =
    message.messageType === "IMAGE" ? (
      <ImageButton
        type="button"
        onClick={() => message.imageUrl && onImageClick?.(message.imageUrl)}
        disabled={!message.imageUrl}
      >
        {message.imageUrl ? (
          <SentImage src={message.imageUrl} alt="보낸 이미지" loading="lazy" />
        ) : (
          <ImageFallback>이미지를 불러오지 못했어요</ImageFallback>
        )}
      </ImageButton>
    ) : (
      <BubbleText>{message.content}</BubbleText>
    );

  if (isMine) {
    return (
      <SentRow>
        {isLastInGroup && (
          <SentMeta>
            <TimeLabel>{formatTime(message.createdAt)}</TimeLabel>
          </SentMeta>
        )}
        <SentBubble $isFirstInGroup={isFirstInGroup} $isImage={message.messageType === "IMAGE"}>
          {body}
        </SentBubble>
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

const SystemRow = styled.div`
  display: flex;
  justify-content: center;
  padding: 4px 0;
`;

const SystemText = styled.span`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: var(--typography-label-2-line-height);
  color: var(--color-semantic-label-alternative);
  text-align: center;
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
