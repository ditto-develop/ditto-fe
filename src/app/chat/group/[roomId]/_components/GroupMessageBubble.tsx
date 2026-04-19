"use client";

import styled from "styled-components";
import type { GroupMessageItem } from "@/lib/api/services/GroupChatService";

interface GroupMessageBubbleProps {
  message: GroupMessageItem;
  isMine: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

function formatTime(date: string | Date): string {
  const d = new Date(date);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function GroupMessageBubble({
  message,
  isMine,
  isFirstInGroup,
  isLastInGroup,
}: GroupMessageBubbleProps) {
  if (isMine) {
    return (
      <SentRow>
        {isLastInGroup && (
          <SentMeta>
            {message.unreadCount > 0 && (
              <ReadCount>{message.unreadCount}</ReadCount>
            )}
            <TimeLabel>{formatTime(message.createdAt)}</TimeLabel>
          </SentMeta>
        )}
        <SentBubble $isFirstInGroup={isFirstInGroup}>
          <BubbleText>{message.content}</BubbleText>
        </SentBubble>
      </SentRow>
    );
  }

  return (
    <ReceivedRow $isFirstInGroup={isFirstInGroup}>
      {isFirstInGroup ? (
        <AvatarSlot>
          <Avatar
            src={message.senderAvatarUrl ?? "/assets/avatar/f1.png"}
            alt={message.senderNickname}
          />
        </AvatarSlot>
      ) : (
        <AvatarPlaceholder />
      )}
      <ReceivedContainer>
        {isFirstInGroup && (
          <NicknameLabel>{message.senderNickname}</NicknameLabel>
        )}
        <ReceivedBubbleRow>
          <ReceivedBubble $isFirstInGroup={isFirstInGroup}>
            <BubbleText>{message.content}</BubbleText>
          </ReceivedBubble>
          {isLastInGroup && (
            <ReceivedMeta>
              {message.unreadCount > 0 && (
                <ReadCount>{message.unreadCount}</ReadCount>
              )}
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
`;

const AvatarSlot = styled.div`
  width: 40px;
  flex-shrink: 0;
`;

const AvatarPlaceholder = styled.div`
  width: 40px;
  flex-shrink: 0;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--color-semantic-line-normal-alternative);
  background-color: var(--color-semantic-background-normal-alternative);
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

const SentBubble = styled.div<{ $isFirstInGroup: boolean }>`
  max-width: 240px;
  background-color: var(--color-semantic-fill-strong);
  border-radius: ${({ $isFirstInGroup }) =>
    $isFirstInGroup ? "12px 0 12px 12px" : "12px"};
  padding: 8px;
  word-break: break-word;
`;

const ReceivedBubble = styled.div<{ $isFirstInGroup: boolean }>`
  max-width: 255px;
  background-color: var(--color-semantic-static-white);
  border-radius: ${({ $isFirstInGroup }) =>
    $isFirstInGroup ? "0 12px 12px 12px" : "12px"};
  padding: 8px;
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
`;

const SentMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 0;
  flex-shrink: 0;
`;

const ReceivedMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 0;
  flex-shrink: 0;
`;

const ReadCount = styled.span`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-caption-2-font-size);
  font-weight: 500;
  line-height: 1.273;
  letter-spacing: 0.342px;
  color: var(--color-semantic-primary-strong);
  white-space: nowrap;
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
