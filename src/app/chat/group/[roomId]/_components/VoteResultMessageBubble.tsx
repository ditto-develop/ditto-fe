"use client";

import styled, { css } from "styled-components";

import type { VoteOutcome } from "@/features/chat";
import { parseServerDateTime } from "@/shared/lib/serverDateTime";

interface VoteResultMessageBubbleProps {
  isMine: boolean;
  senderNickname: string;
  senderAvatarUrl: string | null;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  /** 마감 결과. 아무도 고르지 않았으면 호출부가 한 줄 안내로 떨어뜨린다(여기로 오지 않는다). */
  outcome: VoteOutcome;
  timestamp: string;
  onClick: () => void;
}

function formatTime(date: string): string {
  // BE는 `yyyy-MM-dd HH:mm:ss`로 준다. 공백 구분자는 Safari에서 파싱되지 않는다.
  const d = parseServerDateTime(date);
  if (!d) return "";
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * 만남 투표가 마감됐을 때 채팅방에 남는 결과 카드.
 *
 * Figma 4.2.4 — 확정 [2192:23826] / 동표 [2232:40125]. 두 프레임이 같은 카드의 두 상태다
 * (한쪽은 내가 마감해 오른쪽, 한쪽은 남이 마감해 왼쪽 — VOTE_CREATED 카드와 같은 규칙).
 *
 * 마감은 방 멤버 누구나 할 수 있고 서버는 승자를 계산하지 않는다. 1위·동표 판정은
 * `summarizeVoteOutcome`(features/chat/lib/voteResult.ts)이 하고 이 화면은 그리기만 한다.
 */
export function VoteResultMessageBubble({
  isMine,
  senderNickname,
  senderAvatarUrl,
  isFirstInGroup,
  isLastInGroup,
  outcome,
  timestamp,
  onClick,
}: VoteResultMessageBubbleProps) {
  const timeLabel = formatTime(timestamp);
  const decided = outcome.kind === "decided";

  const card = (
    <ResultCard type="button" onClick={onClick}>
      <CardHeader>
        <HeaderIcon aria-hidden="true">
          <CheckSvg />
        </HeaderIcon>
        <HeaderText>
          {decided ? "투표 결과가 확정됐어요!" : "투표가 동표로 마감됐어요"}
        </HeaderText>
      </CardHeader>

      {outcome.kind === "decided" ? (
        <DecidedBody>
          <DecidedRow>
            <RowIcon aria-hidden="true">
              <LocationSvg />
            </RowIcon>
            <RowText>{outcome.place}</RowText>
          </DecidedRow>
          <DecidedRow>
            <RowIcon aria-hidden="true">
              <ClockSvg />
            </RowIcon>
            <RowText>{outcome.time}</RowText>
          </DecidedRow>
        </DecidedBody>
      ) : (
        <TiedBody>
          <TiedSection>
            <SectionTitle>만남 장소</SectionTitle>
            <RankList>
              {outcome.places.map((label, index) => (
                <RankRow key={`place-${label}`}>
                  <RankBadge>{index + 1}</RankBadge>
                  <RankText>{label}</RankText>
                </RankRow>
              ))}
            </RankList>
          </TiedSection>
          <TiedSection>
            <SectionTitle>만남 시간</SectionTitle>
            <RankList>
              {outcome.times.map((label, index) => (
                <RankRow key={`time-${label}`}>
                  <RankBadge>{index + 1}</RankBadge>
                  <RankText>{label}</RankText>
                </RankRow>
              ))}
            </RankList>
          </TiedSection>
        </TiedBody>
      )}
    </ResultCard>
  );

  if (isMine) {
    return (
      <SentRow>
        {isLastInGroup && <SentMeta>{timeLabel && <TimeLabel>{timeLabel}</TimeLabel>}</SentMeta>}
        {card}
      </SentRow>
    );
  }

  return (
    <ReceivedRow>
      {isFirstInGroup ? (
        <AvatarSlot>
          <Avatar src={senderAvatarUrl ?? "/assets/avatar/f1.png"} alt={senderNickname} />
        </AvatarSlot>
      ) : (
        <AvatarPlaceholder />
      )}
      <ReceivedContainer>
        {isFirstInGroup && <NicknameLabel>{senderNickname}</NicknameLabel>}
        <ReceivedBubbleRow>
          {card}
          {isLastInGroup && (
            <ReceivedMeta>{timeLabel && <TimeLabel>{timeLabel}</TimeLabel>}</ReceivedMeta>
          )}
        </ReceivedBubbleRow>
      </ReceivedContainer>
    </ReceivedRow>
  );
}

function CheckSvg() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 13L9.5 17.5L19 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LocationSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 10.125a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M9 16.5s5.25-3.964 5.25-8.25a5.25 5.25 0 1 0-10.5 0C3.75 12.536 9 16.5 9 16.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="6.75" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M9 5.25V9l2.25 2.25"
        stroke="currentColor"
        strokeWidth="1.4"
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

/* Figma 카드 폭 234px. VOTE_CREATED 카드와 같은 값이라 두 카드가 같은 줄에 나란히 서도 어긋나지 않는다. */
const ResultCard = styled.button`
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

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 23px;
  background-color: var(--color-semantic-primary-normal);
`;

const HeaderIcon = styled.span`
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-semantic-static-white);
`;

const HeaderText = styled.span`
  ${fontBase}
  flex: 1;
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: 0.091px;
  color: var(--color-semantic-static-white);
`;

/* 확정 카드의 본문만 옅은 회색이다. 동표 카드는 흰색(TiedBody) — Figma 두 프레임의 실제 차이다. */
const DecidedBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 23px;
  background-color: var(--color-semantic-line-normal-neutral);
`;

const DecidedRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const RowIcon = styled.span`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-semantic-label-strong);
`;

const RowText = styled.span`
  ${fontBase}
  flex: 1;
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: 0.091px;
  color: var(--color-semantic-label-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TiedBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px 23px;
  background-color: var(--color-semantic-static-white);
`;

const TiedSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SectionTitle = styled.span`
  ${fontBase}
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: 0.091px;
  color: var(--color-semantic-label-strong);
`;

const RankList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const RankRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

const RankBadge = styled.span`
  ${fontBase}
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background-color: var(--color-semantic-primary-normal);
  color: var(--color-semantic-static-white);
  font-size: var(--typography-caption-1-font-size);
  font-weight: 600;
  line-height: 1.334;
`;

const RankText = styled.span`
  ${fontBase}
  flex: 1;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: 1.467;
  letter-spacing: 0.144px;
  color: var(--color-semantic-label-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  border: 1px solid var(--color-semantic-line-normal-alternative);
  background-color: var(--color-semantic-background-normal-alternative);
`;

const ReceivedContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const NicknameLabel = styled.span`
  ${fontBase}
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: 1.429;
  letter-spacing: 0.203px;
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
  flex-shrink: 0;
`;

const ReceivedMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex-shrink: 0;
`;

const TimeLabel = styled.span`
  ${fontBase}
  font-size: var(--typography-caption-1-font-size);
  font-weight: 500;
  line-height: 1.273;
  letter-spacing: 0.342px;
  color: var(--color-semantic-label-alternative);
  white-space: nowrap;
`;
