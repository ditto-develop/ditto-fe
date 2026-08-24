"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notification/api/notificationApi";
import { isToday } from "@/features/notification/lib/notificationTime";
import { isUnread } from "@/features/notification/model/notificationMeta";
import type {
  NotificationCategory,
  NotificationFilter,
  NotificationItem,
  NotificationSection,
} from "@/features/notification/model/types";
import { parseServerDateTime } from "@/shared/lib/serverDateTime";

/**
 * 자동으로 이어 받을 최대 페이지 수.
 * 목록은 최근 30일 창이고 한 페이지가 100건이라 실제로는 대부분 1회로 끝난다.
 * Figma에 '더 보기' 어피어런스가 없어 커서를 UI로 노출하지 않고 여기서 소진한다.
 */
const MAX_PAGES = 3;

type UseNotificationsResult = {
  sections: NotificationSection[];
  /**
   * 목록을 받아온 시각. 구간 분류와 상대 시간 표기가 같은 기준을 쓰도록
   * 렌더마다 새로 읽지 않고 이 값을 공유한다.
   */
  now: number;
  filter: NotificationFilter;
  setFilter: (filter: NotificationFilter) => void;
  loading: boolean;
  error: boolean;
  unreadCount: number;
  isEmpty: boolean;
  markRead: (id: number) => void;
  markAllRead: () => void;
};

function toSections(items: NotificationItem[], now: number): NotificationSection[] {
  const today = items.filter((item) => isToday(item.createdAt, now));
  const earlier = items.filter((item) => !isToday(item.createdAt, now));

  return [
    { key: "TODAY" as const, label: "오늘", items: today },
    { key: "EARLIER" as const, label: "지난 소식", items: earlier },
  ].filter((section) => section.items.length > 0);
}

function toTimestamp(value: string): number {
  return parseServerDateTime(value)?.getTime() ?? 0;
}

/** 서버는 커서 페이지로 준다. nextCursor가 없어질 때까지(최대 MAX_PAGES) 모아 온다. */
async function loadAllPages(category?: NotificationCategory): Promise<NotificationItem[]> {
  const collected: NotificationItem[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { notifications, nextCursor } = await getNotifications({ category, cursor });
    collected.push(...notifications);
    if (!nextCursor) break;
    cursor = nextCursor;
  }

  return collected;
}

export function useNotifications(): UseNotificationsResult {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [now, setNow] = useState(0);
  const [filter, setFilter] = useState<NotificationFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // 목록에 없는(다른 카테고리 탭의) 알림까지 세야 하므로 전용 API 값을 쓴다.
  const [unreadCount, setUnreadCount] = useState(0);

  // 필터는 서버 파라미터다(category). 탭이 바뀌면 그 카테고리만 다시 받아 온다.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    loadAllPages(filter === "ALL" ? undefined : filter)
      .then((data) => {
        if (!active) return;
        setItems(data);
        setNow(Date.now());
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filter]);

  useEffect(() => {
    let active = true;
    getUnreadNotificationCount()
      .then((count) => {
        if (active) setUnreadCount(count);
      })
      .catch(() => {
        // 배지 숫자는 화면을 막을 값이 아니다. 실패하면 0으로 둔다.
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleItems = useMemo(
    () => [...items].sort((left, right) => toTimestamp(right.createdAt) - toTimestamp(left.createdAt)),
    [items],
  );

  const sections = useMemo(() => toSections(visibleItems, now), [visibleItems, now]);

  const markRead = useCallback((id: number) => {
    const readAt = new Date().toISOString();
    setItems((previous) =>
      previous.map((item) => (item.id === id && isUnread(item) ? { ...item, readAt } : item)),
    );
    setUnreadCount((previous) => Math.max(previous - 1, 0));
    // 읽음 표시는 화면 이동을 막을 만한 작업이 아니므로 실패해도 조용히 넘어간다.
    void markNotificationRead(id).catch(() => undefined);
  }, []);

  const markAllRead = useCallback(() => {
    const readAt = new Date().toISOString();
    setItems((previous) =>
      previous.map((item) => (isUnread(item) ? { ...item, readAt } : item)),
    );
    setUnreadCount(0);
    void markAllNotificationsRead().catch(() => undefined);
  }, []);

  return {
    sections,
    now,
    filter,
    setFilter,
    loading,
    error,
    unreadCount,
    isEmpty: !loading && visibleItems.length === 0,
    markRead,
    markAllRead,
  };
}
