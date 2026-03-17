"use client";

import styled from "styled-components";
import { Body1Normal, Caption2 } from "@/components/common/Text";

export interface MessageItem {
  id: string;
  senderId: string;
  content: string;
  createdAt: string | Date;
}

interface MessageBubbleProps {
  message: MessageItem;
  isMine: boolean;
  showAvatar: boolean;
  partnerAvatarUrl: string | null;
}

function formatTime(date: string | Date): string {
  const d = new Date(date);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export default function MessageBubble({
  message,
  isMine,
  showAvatar,
  partnerAvatarUrl,
}: MessageBubbleProps) {
  if (isMine) {
    return (
      <SentRow>
        <SentMeta>
          <img
            src="/icons/status/circle-check-fill.svg"
            alt="읽음"
            width={14}
            height={14}
          />
          <TimeLabel>{formatTime(message.createdAt)}</TimeLabel>
        </SentMeta>
        <SentBubble>
          <Body1Normal $color="#fff">{message.content}</Body1Normal>
        </SentBubble>
      </SentRow>
    );
  }

  return (
    <ReceivedRow>
      <AvatarSlot>
        {showAvatar && (
          <Avatar
            src={partnerAvatarUrl ?? "/assets/avatar/f1.svg"}
            alt="avatar"
          />
        )}
      </AvatarSlot>
      <ReceivedBubble>
        <Body1Normal>{message.content}</Body1Normal>
        <TimeLabel>{formatTime(message.createdAt)}</TimeLabel>
      </ReceivedBubble>
    </ReceivedRow>
  );
}

const SentRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 6px;
  margin-bottom: 4px;
`;

const ReceivedRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 4px;
`;

const AvatarSlot = styled.div`
  width: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
`;

const Avatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(108, 101, 95, 0.08);
`;

const SentBubble = styled.div`
  max-width: 70%;
  background-color: var(--color-semantic-label-normal, #1A1815);
  border-radius: 12px 4px 12px 12px;
  padding: 10px 14px;
  word-break: break-word;
`;

const ReceivedBubble = styled.div`
  max-width: 70%;
  background-color: var(--color-semantic-static-white, #fff);
  border-radius: 4px 12px 12px 12px;
  padding: 10px 14px;
  word-break: break-word;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SentMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding-bottom: 2px;
`;

const TimeLabel = styled(Caption2)`
  color: var(--color-semantic-label-alternative, rgba(47, 43, 39, 0.61));
`;
