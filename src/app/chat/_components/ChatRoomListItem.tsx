"use client";

import styled from "styled-components";
import { useRouter } from "next/navigation";
import { getChatRoomEndState } from "@/app/chat/_utils/chatRoomStatus";

// Extended type to support optional status fields the BE may return
export interface ChatRoomListItemData {
  roomId: string;
  partnerNickname: string;
  partnerAvatarUrl: string | null;
  lastMessageContent?: string;
  lastMessageAt?: string;
  unreadCount: number;
  expiresAt?: string | null; // optional — BE may or may not return this
  isEnded?: boolean;
  isGroup?: boolean;
  coParticipantAvatarUrl?: string | null;
}

interface ChatRoomListItemProps {
  room: ChatRoomListItemData;
}

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export function ChatRoomListItem({ room }: ChatRoomListItemProps) {
  const router = useRouter();
  const ended = getChatRoomEndState(room).isEnded;
  const hasStatus = room.isEnded !== undefined || room.expiresAt !== undefined;
  const showUnread = !ended && room.unreadCount > 0;

  return (
    <Row
      onClick={() =>
        router.push(
          room.isGroup
            ? `/chat/group/${room.roomId}`
            : `/chat/one-on-one/${room.roomId}`
        )
      }
    >
      <AvatarArea>
        {room.isGroup && room.coParticipantAvatarUrl ? (
          <GroupGrid>
            <SmallAvatar src={room.partnerAvatarUrl ?? "/assets/avatar/f1.png"} alt="" />
            <SmallAvatar src={room.coParticipantAvatarUrl} alt="" />
            <SmallAvatar src={room.partnerAvatarUrl ?? "/assets/avatar/f1.png"} alt="" />
            <SmallAvatar src={room.coParticipantAvatarUrl} alt="" />
          </GroupGrid>
        ) : (
          <SingleAvatar
            src={room.partnerAvatarUrl ?? "/assets/avatar/f1.png"}
            alt={room.partnerNickname}
          />
        )}
      </AvatarArea>

      <Content>
        <TopRow>
          <NameRow>
            <Name>{room.partnerNickname}</Name>
            {hasStatus && (
              ended ? (
                <EndedBadge>종료</EndedBadge>
              ) : (
                <ActiveBadge>
                  <ActiveBadgeText>진행중</ActiveBadgeText>
                  <ActiveBadgeBg />
                </ActiveBadge>
              )
            )}
          </NameRow>
          <DateText>
            {room.lastMessageAt ? formatDate(room.lastMessageAt) : ""}
          </DateText>
        </TopRow>
        <BottomRow>
          <LastMessage>{room.lastMessageContent ?? ""}</LastMessage>
          {showUnread && (
            <UnreadBadge>
              <UnreadBadgeBg />
              <UnreadCount>{room.unreadCount > 99 ? "99+" : room.unreadCount}</UnreadCount>
            </UnreadBadge>
          )}
        </BottomRow>
      </Content>
    </Row>
  );
}

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;

  &:active {
    opacity: 0.7;
  }
`;

const AvatarArea = styled.div`
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  position: relative;
`;

/* Single avatar: 48x48, circle, white bg, subtle border */
const SingleAvatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--color-semantic-line-normal-alternative);
  background-color: var(--color-semantic-background-normal-alternative);
`;

/* Group avatar: 2x2 grid of 24x24 avatars */
const GroupGrid = styled.div`
  display: grid;
  grid-template-columns: 24px 24px;
  grid-template-rows: 24px 24px;
  width: 48px;
  height: 48px;
`;

const SmallAvatar = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--color-semantic-line-normal-alternative);
  background-color: var(--color-semantic-background-normal-alternative);
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  height: 50px;
  justify-content: center;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
`;

/* Headline 2/Bold: SemiBold 17px, lineHeight 1.412 */
const Name = styled.span`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-headline-2-font-size);
  font-weight: 600;
  line-height: 1.412;
  color: var(--color-semantic-label-normal);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
`;

/* Caption 2/Medium: 11px weight 500, letterSpacing 0.3421px */
/* 진행중 badge: status/negative color at 8% bg, full color text */
const ActiveBadge = styled.span`
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  padding: 0 6px;
  border-radius: 6px;
  overflow: hidden;
`;

const ActiveBadgeBg = styled.span`
  position: absolute;
  inset: 0;
  background-color: var(--color-semantic-status-negative);
  opacity: 0.08;
  border-radius: 6px;
`;

const ActiveBadgeText = styled.span`
  position: relative;
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-caption-2-font-size);
  font-weight: 500;
  line-height: 1.273;
  letter-spacing: 0.3421px;
  color: var(--color-semantic-status-negative);
  white-space: nowrap;
`;

/* 종료 badge: fill/normal bg, label/alternative text */
const EndedBadge = styled.span`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  padding: 0 6px;
  border-radius: 6px;
  background-color: var(--color-semantic-fill-normal);
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-caption-2-font-size);
  font-weight: 500;
  line-height: 1.273;
  letter-spacing: 0.3421px;
  color: var(--color-semantic-label-alternative);
  white-space: nowrap;
`;

/* Caption 1/Medium: 12px weight 500, letterSpacing 0.3024px */
const DateText = styled.span`
  flex-shrink: 0;
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-caption-1-font-size);
  font-weight: 500;
  line-height: 1.334;
  letter-spacing: 0.3024px;
  color: var(--color-semantic-label-alternative);
`;

const BottomRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 23px;
  height: 26px;
`;

/* Body 2/Normal Medium: 15px weight 500, lineHeight 1.467, letterSpacing 0.144px */
const LastMessage = styled.span`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: 1.467;
  letter-spacing: 0.144px;
  color: var(--color-semantic-label-alternative);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
`;

/* Unread badge: 26x26 circle, primary/normal bg, Label 2/Medium 13px */
const UnreadBadge = styled.span`
  flex-shrink: 0;
  position: relative;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const UnreadBadgeBg = styled.span`
  position: absolute;
  inset: 0;
  background-color: var(--color-semantic-primary-normal);
  border-radius: 50%;
`;

/* Label 2/Medium: 13px weight 500, letterSpacing 0.2522px */
const UnreadCount = styled.span`
  position: relative;
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: 1.385;
  letter-spacing: 0.2522px;
  color: var(--color-semantic-static-white);
  text-align: center;
`;
