"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  deleteAllNotifications,
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notification/api/notificationApi";
import { markBellSeen, newestNotificationId } from "@/features/notification/lib/bellSeen";
import { isToday } from "@/features/notification/lib/notificationTime";
import { isUnread } from "@/features/notification/model/notificationMeta";
import type {
  NotificationCategory,
  NotificationFilter,
  NotificationItem,
  NotificationSection,
} from "@/features/notification/model/types";
import { syncAppBadge } from "@/shared/lib/native/appBadge";
import { PUSH_RECEIVED_EVENT } from "@/shared/lib/native/pushNotifications";
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
  /** 알림 한 건을 지운다. 서버에 기록돼 다른 기기에서도 빠진다. */
  hide: (id: number) => void;
  /** 지금 탭의 알림을 모두 지운다. 다른 탭의 알림은 건드리지 않는다. */
  hideAll: () => void;
  /** '전체 지우기'를 누를 수 있는 상태인지. */
  canHideAll: boolean;
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
  /**
   * 다시 읽어야 할 때 올리는 값. 목록과 미읽음 수 두 effect의 의존성에 함께 걸린다.
   *
   * 앱이 떠 있는 동안 푸시가 오면 OS가 배너를 안 띄울 수 있어(BE 위키
   * Frontend-Push-Guide §앱 구현 노트), 열려 있는 알림 센터가 스스로 최신을 받아야 한다.
   */
  const [reloadKey, setReloadKey] = useState(0);

  // 웹에서는 이 이벤트가 발생하지 않는다(푸시 진입점 전체가 네이티브로 막혀 있다).
  useEffect(() => {
    const onPushReceived = () => setReloadKey((previous) => previous + 1);
    window.addEventListener(PUSH_RECEIVED_EVENT, onPushReceived);
    return () => window.removeEventListener(PUSH_RECEIVED_EVENT, onPushReceived);
  }, []);

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
        // 전체 목록을 봤으니 홈 벨 레드닷을 내린다. 벨을 눌러 들어온 경로가 아니어도
        // (푸시 탭 등) 여기서 본 알림 때문에 점이 다시 뜨지 않게 한다.
        if (filter === "ALL") markBellSeen(newestNotificationId(data));
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
  }, [filter, reloadKey]);

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
  }, [reloadKey]);

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
    // 앱 아이콘 배지는 서버에 반영된 뒤에 맞춘다(웹에서는 no-op).
    void markNotificationRead(id)
      .then(() => syncAppBadge())
      .catch(() => undefined);
  }, []);

  const markAllRead = useCallback(() => {
    const readAt = new Date().toISOString();
    setItems((previous) =>
      previous.map((item) => (isUnread(item) ? { ...item, readAt } : item)),
    );
    setUnreadCount(0);
    void markAllNotificationsRead()
      .then(() => syncAppBadge())
      .catch(() => undefined);
  }, []);

  /**
   * 지우기는 서버에 기록한다. 예전에는 기기 저장소에 알림 id 만 적어 두고 목록에서 뺐는데,
   * DB 를 초기화해 id 가 다시 1부터 매겨지자 새 알림이 예전에 지운 id 와 겹쳐 보이지 않았다(2026-10-27).
   *
   * 화면에서는 먼저 빼고(낙관적), 실패하면 다시 읽어 서버 상태로 되돌린다. 서버는 지운 알림을
   * 미읽음 수에서도 빼므로, 지운 것이 안 읽은 알림이었으면 배지도 함께 내린다.
   */
  const hide = useCallback(
    (id: number) => {
      const target = items.find((item) => item.id === id);
      if (!target) return;
      setItems((previous) => previous.filter((item) => item.id !== id));
      if (isUnread(target)) setUnreadCount((previous) => Math.max(previous - 1, 0));
      void deleteNotification(id)
        .then(() => syncAppBadge())
        .catch(() => setReloadKey((previous) => previous + 1));
    },
    [items],
  );

  const hideAll = useCallback(() => {
    if (visibleItems.length === 0) return;
    const removedUnread = visibleItems.filter(isUnread).length;
    setItems([]);
    setUnreadCount((previous) => Math.max(previous - removedUnread, 0));
    void deleteAllNotifications(filter === "ALL" ? undefined : filter)
      .then(() => syncAppBadge())
      .catch(() => setReloadKey((previous) => previous + 1));
  }, [filter, visibleItems]);

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
    hide,
    hideAll,
    canHideAll: visibleItems.length > 0,
  };
}
