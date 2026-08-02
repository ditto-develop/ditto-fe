"use client";

import { useMemo, useState } from "react";
import styled from "styled-components";
import { MainBottomNav } from "@/app/home/MainBottomNav";
import { ChatRoomListItem, type ChatRoomListItemData } from "./ChatRoomListItem";
import { useChatRooms } from "@/features/chat";
import type { ChatRoomWithCounterpart } from "@/features/chat";
import { getChatRoomEndState } from "@/app/chat/_utils/chatRoomStatus";

type FilterType = "전체" | "진행중" | "종료";
const FILTERS: FilterType[] = ["전체", "진행중", "종료"];

/** 목록 미리보기 문구. IMAGE는 objectKey가 아니라 안내 문구를 보여준다. */
function toPreview(room: ChatRoomWithCounterpart): string | undefined {
  const last = room.lastMessage;
  if (!last) return undefined;
  if (last.messageType === "IMAGE") return "사진을 보냈어요.";
  return last.content;
}

function toListItem(room: ChatRoomWithCounterpart): ChatRoomListItemData {
  return {
    roomId: room.roomId,
    partnerNickname: room.counterpartNickname,
    partnerAvatarUrl: room.counterpartProfileImageUrl,
    lastMessageContent: toPreview(room),
    lastMessageAt: room.lastMessage?.createdAt,
    unreadCount: room.unreadCount,
    // 라이브 채팅 계약에는 방 종료/만료 정보가 없다. 상태 없는 방은 진행중으로 본다.
    isGroup: room.roomType === "GROUP",
  };
}

export function ChatListPageClient() {
  const [filter, setFilter] = useState<FilterType>("전체");
  const { rooms: chatRooms, loading } = useChatRooms();

  const rooms = useMemo(() => chatRooms.map(toListItem), [chatRooms]);

  const filteredRooms = rooms.filter((room) => {
    if (filter === "전체") return true;
    const ended = getChatRoomEndState(room).isEnded;
    return filter === "진행중" ? !ended : ended;
  });

  return (
    <Container>
      <Header>
        <Title>대화방</Title>
      </Header>

      <FilterRow>
        {FILTERS.map((f) => (
          <FilterChip key={f} $active={filter === f} onClick={() => setFilter(f)}>
            {f}
          </FilterChip>
        ))}
      </FilterRow>

      <Body>
        {loading ? (
          <EmptyState>불러오는 중...</EmptyState>
        ) : filteredRooms.length === 0 ? (
          <EmptyState>대화방이 없어요.</EmptyState>
        ) : (
          <RoomList>
            {filteredRooms.map((room) => (
              <ChatRoomListItem key={room.roomId} room={room} />
            ))}
          </RoomList>
        )}
      </Body>

      <MainBottomNav />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background-color: var(--color-semantic-background-normal-normal);
`;

const Header = styled.div`
  padding: 16px 20px;
`;

const Title = styled.h1`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-heading-1-font-size);
  font-weight: 600;
  line-height: 1.364;
  letter-spacing: -0.4268px;
  color: var(--color-semantic-label-normal);
  margin: 0;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 6px;
  padding: 0 20px 8px;
`;

const FilterChip = styled.button<{ $active: boolean }>`
  padding: 6px 8px;
  border-radius: 8px;
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: 1.429;
  letter-spacing: 0.203px;
  cursor: pointer;
  border: ${({ $active }) =>
    $active ? "none" : "1px solid var(--color-semantic-line-normal-neutral)"};
  background-color: ${({ $active }) =>
    $active ? "var(--color-semantic-label-strong)" : "transparent"};
  color: ${({ $active }) =>
    $active
      ? "var(--color-semantic-inverse-label)"
      : "var(--color-semantic-label-alternative)"};
  transition: background-color 0.15s;
`;

const Body = styled.div`
  flex: 1;
  padding: 24px 0 4px;
`;

const RoomList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 0 20px;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-1-normal-font-size);
  color: var(--color-semantic-label-alternative);
  padding-top: 80px;
`;
