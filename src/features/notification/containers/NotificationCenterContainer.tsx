"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";

import { getChatRooms } from "@/features/chat";
import { useNotifications } from "@/features/notification/hooks/useNotifications";
import {
  isUnread,
  NOTIFICATION_FILTERS,
  toNotificationTarget,
} from "@/features/notification/model/notificationMeta";
import type { NotificationItem } from "@/features/notification/model/types";
import { NotificationRow } from "@/features/notification/ui/NotificationRow";
import { AlertModal, EmptyState, FilterChips, SwipeToDelete, TopNavigation } from "@/shared/ui";

/**
 * Figma 7.2 알림 센터 [2508:31674] / empty [2508:32222]
 */
export function NotificationCenterContainer() {
  const router = useRouter();
  const {
    sections,
    now,
    filter,
    setFilter,
    loading,
    error,
    unreadCount,
    isEmpty,
    markRead,
    markAllRead,
    hide,
    hideAll,
    canHideAll,
  } = useNotifications();
  const [isClearAllOpen, setIsClearAllOpen] = useState(false);

  /**
   * 방 목록이 1:1/그룹을 구분하는 유일한 출처다(방 상세 API가 없다).
   * 못 찾으면 대화방 목록으로 보낸다 — 알림을 눌렀는데 아무 일도 안 일어나는 것보다 낫다.
   */
  const toChatRoomPath = async (roomId: number): Promise<string> => {
    const room = await getChatRooms()
      .then((rooms) => rooms.find((item) => item.roomId === roomId))
      .catch(() => undefined);

    if (!room) return "/chat";
    return room.sourceType === "GROUP"
      ? `/chat/group/${roomId}`
      : `/chat/one-on-one/${roomId}`;
  };

  const handleSelect = async (item: NotificationItem) => {
    if (isUnread(item)) markRead(item.id);

    const target = toNotificationTarget(item);
    // 모르는 type은 이동하지 않는다(BE 위키 명시 — enum이 늘어난다).
    if (!target) return;

    router.push(
      target.kind === "path" ? target.path : await toChatRoomPath(target.roomId),
    );
  };

  return (
    <Page>
      <Header>
        <TopNavigation
          label="알림"
          titleAlign="left"
          onBack={() => router.back()}
          trailingElement={
            <TrailingActions>
              <TextButton type="button" onClick={markAllRead} disabled={unreadCount === 0}>
                모두 읽음
              </TextButton>
              <TextButton
                type="button"
                onClick={() => setIsClearAllOpen(true)}
                disabled={!canHideAll}
              >
                전체 지우기
              </TextButton>
            </TrailingActions>
          }
        />
        <FilterChips
          label="알림 종류"
          options={NOTIFICATION_FILTERS}
          value={filter}
          onChange={setFilter}
        />
      </Header>

      <Content>
        {loading && <StateText>알림을 불러오는 중...</StateText>}
        {error && <StateText>알림을 불러오지 못했어요.</StateText>}

        {!loading && !error && isEmpty && (
          <EmptyStateSlot>
            <EmptyState
              icon="notification.bellLarge"
              title="새로운 알림이 없어요"
              description="중요한 소식이 오면 알려드릴게요."
            />
          </EmptyStateSlot>
        )}

        {sections.map((section) => (
          <Section key={section.key}>
            <SectionLabel>{section.label}</SectionLabel>
            <List>
              {section.items.map((item) => (
                <SwipeToDelete
                  key={item.id}
                  deleteLabel={`알림 삭제: ${item.title}`}
                  onDelete={() => hide(item.id)}
                >
                  <NotificationRow
                    item={item}
                    now={now}
                    onSelect={(selected) => void handleSelect(selected)}
                  />
                </SwipeToDelete>
              ))}
            </List>
          </Section>
        ))}
      </Content>

      {/* 지운 알림은 되돌릴 수 없으므로(서버에 삭제 API 가 없어 로컬 숨김이다) 한 번 묻는다. */}
      <AlertModal
        isOpen={isClearAllOpen}
        title="알림을 모두 지울까요?"
        message="지운 알림은 이 기기에서 다시 볼 수 없어요."
        confirmParams={{
          // 상단 바 버튼과 글자가 겹치지 않게 둔다 — 겹치면 어느 쪽을 눌렀는지 모른다.
          text: "모두 지우기",
          onClick: () => {
            hideAll();
            setIsClearAllOpen(false);
          },
        }}
        cancelParams={{ text: "취소", onClick: () => setIsClearAllOpen(false) }}
        onClose={() => setIsClearAllOpen(false)}
      />
    </Page>
  );
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background-color: var(--color-semantic-background-normal-normal);
`;

const Header = styled.div`
  position: sticky;
  top: 0;
  z-index: 1000;
  padding-bottom: var(--space-4);
  background-color: var(--color-semantic-background-normal-normal);
`;

const Content = styled.main`
  display: flex;
  flex: 1 0 0;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
  max-width: var(--space-max);
  margin: 0 auto;
  padding: var(--space-2) 0 var(--space-12);
  box-sizing: border-box;
`;

/* 빈 상태는 헤더를 뺀 남은 영역의 정중앙에 놓인다. Figma [2508:32604] */
const EmptyStateSlot = styled.div`
  display: flex;
  flex: 1 0 0;
  align-items: center;
  justify-content: center;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-10px);
`;

const SectionLabel = styled.h2`
  margin: 0;
  padding: 0 var(--space-4);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 600;
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
`;

const StateText = styled.p`
  margin: 0;
  padding: var(--space-4);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: var(--typography-body-2-normal-font-weight);
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

/* '모두 읽음'과 '전체 지우기'가 나란히 들어가므로 TrailingBox 안에서 한 줄로 묶는다. */
const TrailingActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

const TextButton = styled.button`
  border: none;
  background: none;
  padding: var(--space-1) 0;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);

  &:disabled {
    cursor: default;
    color: var(--color-semantic-label-assistive);
  }
`;
