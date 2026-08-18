"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";

import { useNotifications } from "@/features/notification/hooks/useNotifications";
import { NOTIFICATION_FILTERS } from "@/features/notification/model/notificationMeta";
import type { NotificationItem } from "@/features/notification/model/types";
import { NotificationRow } from "@/features/notification/ui/NotificationRow";
import { EmptyState, FilterChips, TopNavigation } from "@/shared/ui";

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
  } = useNotifications();

  const handleSelect = (item: NotificationItem) => {
    if (!item.read) markRead(item.id);
    if (item.linkTo) router.push(item.linkTo);
  };

  return (
    <Page>
      <Header>
        <TopNavigation
          label="알림"
          titleAlign="left"
          onBack={() => router.back()}
          trailingElement={
            <MarkAllButton
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              모두 읽음
            </MarkAllButton>
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
                <NotificationRow key={item.id} item={item} now={now} onSelect={handleSelect} />
              ))}
            </List>
          </Section>
        ))}
      </Content>
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

const MarkAllButton = styled.button`
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
