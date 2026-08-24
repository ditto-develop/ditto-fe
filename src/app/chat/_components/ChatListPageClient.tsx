"use client";

import { useMemo, useState } from "react";
import styled from "styled-components";
import { MainBottomNav } from "@/app/home/MainBottomNav";
import { ChatRoomListItem, type ChatRoomListItemData } from "./ChatRoomListItem";
import { deriveRoomState, getLastMessagePreview, useChatRooms } from "@/features/chat";
import type { ChatRoomWithCounterpart } from "@/features/chat";
import { toReviewHref, usePendingReviews } from "@/features/rating/hooks/usePendingReviews";
import { useSystemPeriod } from "@/features/system/hooks/useSystemPeriod";
import type { SystemPeriod } from "@/features/system/api/systemStateApi";
import { Button } from "@/shared/ui";

type FilterType = "전체" | "진행중" | "종료";
const FILTERS: FilterType[] = ["전체", "진행중", "종료"];

function toListItem(
  room: ChatRoomWithCounterpart,
  serverPeriod: SystemPeriod | null,
  reviewHref?: string,
): ChatRoomListItemData {
  return {
    roomId: room.roomId,
    partnerNickname: room.counterpartNickname,
    partnerAvatarUrl: room.counterpartProfileImageUrl,
    lastMessageContent: getLastMessagePreview(room),
    lastMessageAt: room.lastMessage?.createdAt,
    unreadCount: room.unreadCount,
    state: deriveRoomState(room, undefined, serverPeriod),
    // 재매칭 방은 1:1이다. 그룹만 별도 화면으로 보낸다.
    isGroup: room.sourceType === "GROUP",
    reviewHref,
  };
}

export function ChatListPageClient() {
  const [filter, setFilter] = useState<FilterType>("전체");
  const { rooms: chatRooms, loading } = useChatRooms();
  const { reviews } = usePendingReviews();
  // '대기중' 배지도 어드민 시각 오버라이드를 따라야 한다.
  const serverPeriod = useSystemPeriod();

  // 평가가 열린 방에만 '평가하기' 진입점을 붙인다.
  const reviewHrefByRoomId = useMemo(
    () => new Map(reviews.map((review) => [String(review.chatRoomId), toReviewHref(review)])),
    [reviews],
  );

  const rooms = useMemo(
    () =>
      chatRooms.map((room) =>
        toListItem(room, serverPeriod, reviewHrefByRoomId.get(String(room.roomId))),
      ),
    [chatRooms, reviewHrefByRoomId, serverPeriod],
  );

  // 개방 전(금요일 대기) 방은 아직 끝나지 않았으므로 '진행중'에 함께 둔다.
  const filteredRooms = rooms.filter((room) => {
    if (filter === "전체") return true;
    const ended = room.state === "ENDED";
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
          <EmptyState>
            <EmptyTitle>불러오는 중...</EmptyTitle>
          </EmptyState>
        ) : filteredRooms.length === 0 ? (
          <EmptyState>
            <EmptyTitle>
              {filter === "전체" ? "아직 나눈 대화가 없어요" : "대화방이 없어요"}
            </EmptyTitle>
            {filter === "전체" ? (
              <EmptyDescription>
                퀴즈에 참여하고 새로운 만남을 시작해 보세요!
              </EmptyDescription>
            ) : (
              <ShowAllButton type="button" $size="medium" onClick={() => setFilter("전체")}>
                대화목록 전체보기
              </ShowAllButton>
            )}
          </EmptyState>
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
  display: flex;
  flex-direction: column;
  padding: var(--space-6) 0 var(--space-1);
`;

const RoomList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
  padding: 0 var(--space-5);
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: var(--space-2) var(--space-4);
  box-sizing: border-box;
`;

const EmptyTitle = styled.p`
  width: 100%;
  margin: 0;
  color: var(--color-semantic-label-normal);
  font-family: var(--typography-font-family);
  font-size: var(--typography-headline-1-font-size);
  font-weight: var(--typography-headline-1-font-weight);
  line-height: var(--typography-headline-1-line-height);
  letter-spacing: var(--typography-headline-1-letter-spacing);
  text-align: center;
`;

const EmptyDescription = styled.p`
  width: 100%;
  margin: var(--spacing-2px) 0 0;
  color: var(--color-semantic-label-alternative);
  font-family: var(--typography-font-family);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: var(--typography-body-2-normal-font-weight);
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  text-align: center;
`;

const ShowAllButton = styled(Button)`
  margin-top: var(--space-4);
`;
