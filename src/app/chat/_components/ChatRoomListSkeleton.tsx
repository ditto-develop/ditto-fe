"use client";

import styled from "styled-components";

import { SkeletonBlock } from "@/shared/ui";

/** 목록이 한 화면을 채울 만큼만. 더 깔면 스크롤이 생겼다 사라진다. */
const ROW_COUNT = 5;

/**
 * 대화방 목록의 로딩 자리.
 *
 * 실루엣이 어긋나면 교체가 티나므로 ChatRoomListItem과 같은 치수를 쓴다
 * (48px 아바타, gap 12px, 본문 높이 50px). 바깥 여백도 RoomList와 같아야
 * 실제 목록이 들어올 때 행이 옆으로 밀리지 않는다.
 */
export function ChatRoomListSkeleton() {
  return (
    <List aria-hidden="true" data-cy="chat-list-skeleton">
      {Array.from({ length: ROW_COUNT }).map((_, index) => (
        <Row key={index}>
          <AvatarBlock $width="48px" $height="48px" $circle />
          <Content>
            <SkeletonBlock $width="120px" $height="20px" />
            <SkeletonBlock $width="70%" $height="16px" />
          </Content>
        </Row>
      ))}
    </List>
  );
}

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
  padding: 0 var(--space-5);
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AvatarBlock = styled(SkeletonBlock)`
  flex-shrink: 0;
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
