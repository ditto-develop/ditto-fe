"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notification/api/notificationApi";
import { isToday } from "@/features/notification/lib/notificationTime";
import { NOTIFICATION_CATEGORY } from "@/features/notification/model/notificationMeta";
import type {
  NotificationFilter,
  NotificationItem,
  NotificationSection,
} from "@/features/notification/model/types";

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
  markRead: (id: string) => void;
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

export function useNotifications(): UseNotificationsResult {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [now, setNow] = useState(0);
  const [filter, setFilter] = useState<NotificationFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    getNotifications()
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
  }, []);

  const visibleItems = useMemo(() => {
    const filtered =
      filter === "ALL"
        ? items
        : items.filter((item) => NOTIFICATION_CATEGORY[item.type] === filter);

    return [...filtered].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }, [filter, items]);

  const sections = useMemo(() => toSections(visibleItems, now), [visibleItems, now]);

  const markRead = useCallback((id: string) => {
    setItems((previous) =>
      previous.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
    // 읽음 표시는 화면 이동을 막을 만한 작업이 아니므로 실패해도 조용히 넘어간다.
    void markNotificationRead(id).catch(() => undefined);
  }, []);

  const markAllRead = useCallback(() => {
    setItems((previous) => previous.map((item) => ({ ...item, read: true })));
    void markAllNotificationsRead().catch(() => undefined);
  }, []);

  return {
    sections,
    now,
    filter,
    setFilter,
    loading,
    error,
    unreadCount: items.filter((item) => !item.read).length,
    isEmpty: !loading && visibleItems.length === 0,
    markRead,
    markAllRead,
  };
}
