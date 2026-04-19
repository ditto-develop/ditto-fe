"use client";

import styled, { css } from "styled-components";

interface VoteCreatedMessageBubbleProps {
  isMine: boolean;
  senderNickname: string;
  senderAvatarUrl: string | null;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  placeSummary: { head: string; extraCount: number };
  timeSummary: { head: string; extraCount: number };
  timestamp: string;
  unreadCount?: number;
  onClick: () => void;
}

function formatTime(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function summaryText(summary: { head: string; extraCount: number }): string {
  if (!summary.head) return "";
  return summary.extraCount > 0
    ? `${summary.head} 외 ${summary.extraCount}개`
    : summary.head;
}

export function VoteCreatedMessageBubble({
  isMine,
  senderNickname,
  senderAvatarUrl,
  isFirstInGroup,
  isLastInGroup,
  placeSummary,
  timeSummary,
  timestamp,
  unreadCount = 0,
  onClick,
}: VoteCreatedMessageBubbleProps) {
  const timeLabel = formatTime(timestamp);

  const card = (
    <VoteCard type="button" onClick={onClick} $isMine={isMine}>
      <VoteHeader>
        <InboxIcon aria-hidden="true">
          <InboxSvg />
        </InboxIcon>
        <VoteHeaderText>만남 투표가 열렸어요!</VoteHeaderText>
      </VoteHeader>
      <VoteBody>
        <VoteRow>
          <VoteRowIcon>
            <LocationSmall />
          </VoteRowIcon>
          <VoteRowText>{summaryText(placeSummary) || "장소 미정"}</VoteRowText>
        </VoteRow>
        <VoteRow>
          <VoteRowIcon>
            <ClockSmall />
          </VoteRowIcon>
          <VoteRowText>{summaryText(timeSummary) || "시간 미정"}</VoteRowText>
        </VoteRow>
      </VoteBody>
    </VoteCard>
  );

  if (isMine) {
    return (
      <SentRow>
        {isLastInGroup && (
          <SentMeta>
            {unreadCount > 0 && <ReadCount>{unreadCount}</ReadCount>}
            {timeLabel && <TimeLabel>{timeLabel}</TimeLabel>}
          </SentMeta>
        )}
        {card}
      </SentRow>
    );
  }

  return (
    <ReceivedRow>
      {isFirstInGroup ? (
        <AvatarSlot>
          <Avatar
            src={senderAvatarUrl ?? "/assets/avatar/f1.png"}
            alt={senderNickname}
          />
        </AvatarSlot>
      ) : (
        <AvatarPlaceholder />
      )}
      <ReceivedContainer>
        {isFirstInGroup && <NicknameLabel>{senderNickname}</NicknameLabel>}
        <ReceivedBubbleRow>
          {card}
          {isLastInGroup && (
            <ReceivedMeta>
              {unreadCount > 0 && <ReadCount>{unreadCount}</ReadCount>}
              {timeLabel && <TimeLabel>{timeLabel}</TimeLabel>}
            </ReceivedMeta>
          )}
        </ReceivedBubbleRow>
      </ReceivedContainer>
    </ReceivedRow>
  );
}

function InboxSvg() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M3.333 10.833V15a1.667 1.667 0 0 0 1.667 1.667h10A1.667 1.667 0 0 0 16.667 15v-4.167M3.333 10.833l1.942-5.825A1.667 1.667 0 0 1 6.858 3.75h6.284a1.667 1.667 0 0 1 1.583 1.258l1.942 5.825M3.333 10.833h3.334l1.25 2.5h3.333l1.25-2.5h3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LocationSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M7 7.875a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M7 12.833s4-3.083 4-6.416A4 4 0 0 0 3 6.417c0 3.333 4 6.416 4 6.416Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M7 4.083V7l1.75 1.75"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const fontBase = css`
  font-family: "Pretendard JP", sans-serif;
  font-feature-settings: "ss10" 1;
`;

const SentRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 2px;
  width: 100%;
`;

const ReceivedRow = styled.div`
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
  border: 1px solid
    var(--color-semantic-line-normal-alternative);
  background-color: var(
    --color-semantic-background-normal-alternative,
    var(--color-semantic-background-normal-alternative)
  );
`;

const ReceivedContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
`;

const NicknameLabel = styled.span`
  ${fontBase}
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

const SentMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  flex-shrink: 0;
`;

const ReceivedMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  flex-shrink: 0;
`;

const ReadCount = styled.span`
  ${fontBase}
  font-size: var(--typography-caption-2-font-size);
  font-weight: 500;
  line-height: 1.273;
  letter-spacing: 0.342px;
  color: var(--color-semantic-primary-strong);
  white-space: nowrap;
`;

const TimeLabel = styled.span`
  ${fontBase}
  font-size: var(--typography-caption-2-font-size);
  font-weight: 500;
  line-height: 1.273;
  letter-spacing: 0.342px;
  color: var(--color-semantic-label-alternative);
  white-space: nowrap;
`;

const VoteCard = styled.button<{ $isMine: boolean }>`
  width: 234px;
  border-radius: 12px;
  border: none;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  background-color: transparent;
  display: flex;
  flex-direction: column;

  &:active {
    opacity: 0.88;
  }
`;

const VoteHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background-color: var(--color-semantic-primary-normal);
`;

const InboxIcon = styled.span`
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-semantic-static-white);
`;

const VoteHeaderText = styled.span`
  ${fontBase}
  flex: 1;
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: 0.091px;
  color: var(--color-semantic-static-white);
`;

const VoteBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background-color: var(--color-semantic-static-white);
`;

const VoteRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const VoteRowIcon = styled.span`
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-semantic-label-alternative);
`;

const VoteRowText = styled.span`
  ${fontBase}
  flex: 1;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: 1.429;
  letter-spacing: 0.203px;
  color: var(--color-semantic-label-normal);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
