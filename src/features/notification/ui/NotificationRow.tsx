"use client";

import styled from "styled-components";

import { formatNotificationTime } from "@/features/notification/lib/notificationTime";
import { NOTIFICATION_ICON } from "@/features/notification/model/notificationMeta";
import type { NotificationItem } from "@/features/notification/model/types";
import { Icon } from "@/shared/ui";

interface NotificationRowProps {
  item: NotificationItem;
  /** 목록 전체가 공유하는 기준 시각. 렌더 중 Date.now()를 읽지 않기 위해 주입받는다. */
  now: number;
  onSelect: (item: NotificationItem) => void;
}

/**
 * Figma 7.2 [2508:31679] — 알림 한 줄.
 * 읽은 알림은 background/normal/alternative로 가라앉히고,
 * 읽지 않은 알림은 페이지 배경과 같은 톤으로 도드라지게 둔다.
 */
export function NotificationRow({ item, now, onSelect }: NotificationRowProps) {
  return (
    <Row type="button" $read={item.read} onClick={() => onSelect(item)}>
      <IconSlot>
        <Icon name={NOTIFICATION_ICON[item.type]} size={20} />
      </IconSlot>
      <Texts>
        <Title>{item.title}</Title>
        <Body>{item.body}</Body>
        <Time>{formatNotificationTime(item.createdAt, now)}</Time>
      </Texts>
    </Row>
  );
}

const Row = styled.button<{ $read: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-4);
  border: none;
  border-bottom: var(--spacing-1px) solid var(--color-semantic-background-normal-alternative);
  box-sizing: border-box;
  text-align: left;
  cursor: pointer;
  background-color: ${({ $read }) =>
    $read
      ? "var(--color-semantic-background-normal-alternative)"
      : "var(--color-semantic-background-normal-normal)"};
`;

const IconSlot = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: var(--space-6);
  flex-shrink: 0;
  color: var(--color-semantic-line-solid-normal);
`;

const Texts = styled.span`
  display: flex;
  flex: 1 0 0;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-1);
`;

const Title = styled.span`
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 600;
  line-height: var(--typography-body-1-normal-line-height);
  letter-spacing: var(--typography-body-1-normal-letter-spacing);
  color: var(--color-semantic-label-normal);
`;

const Body = styled.span`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
`;

const Time = styled.span`
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;
