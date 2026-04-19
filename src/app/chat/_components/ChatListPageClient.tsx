"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { MainBottomNav } from "@/app/home/MainBottomNav";
import { ChatRoomListItem, type ChatRoomListItemData } from "./ChatRoomListItem";
import { ChatService } from "@/lib/api/services/ChatService";
import { getChatRoomEndState } from "@/app/chat/_utils/chatRoomStatus";

type FilterType = "전체" | "진행중" | "종료";
const FILTERS: FilterType[] = ["전체", "진행중", "종료"];

export function ChatListPageClient() {
  const [filter, setFilter] = useState<FilterType>("전체");
  const [rooms, setRooms] = useState<ChatRoomListItemData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let isFetching = false;

    const fetchRooms = async (showLoading = false) => {
      if (isFetching) return;
      isFetching = true;
      if (showLoading) setLoading(true);

      try {
        const listRes = await ChatService.chatControllerGetChatRooms();
        if (!listRes.success || !listRes.data) return;

        const merged: ChatRoomListItemData[] = listRes.data.map((item) => ({
          roomId: item.roomId,
          partnerNickname: item.partnerNickname ?? "알 수 없음",
          partnerAvatarUrl: item.partnerAvatarUrl ?? null,
          lastMessageContent: item.lastMessageContent,
          lastMessageAt: item.lastMessageAt,
          unreadCount: item.unreadCount,
          expiresAt: item.expiresAt ?? null,
          isEnded: getChatRoomEndState(item).isEnded,
          isGroup: item.isGroup,
          coParticipantAvatarUrl: item.coParticipantAvatarUrl,
        }));

        if (isMounted) setRooms(merged);
      } catch {
        // ignore
      } finally {
        isFetching = false;
        if (isMounted) setLoading(false);
      }
    };

    fetchRooms(true);
    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      fetchRooms();
    }, 3000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

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
