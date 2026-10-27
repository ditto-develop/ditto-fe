"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getNotifications } from "@/features/notification/api/notificationApi";
import {
  hasNewUnreadSince,
  healBellSeen,
  markBellSeen,
  newestNotificationId,
  readBellSeenId,
} from "@/features/notification/lib/bellSeen";
import { useOnAppResume } from "@/shared/lib/hooks/useOnAppResume";
import { PUSH_RECEIVED_EVENT } from "@/shared/lib/native/pushNotifications";

/** 새 알림을 찾는 범위. 목록은 최신순이라 마지막으로 본 뒤에 온 알림은 맨 앞에 몰려 있다. */
const CHECK_SIZE = 20;

type NotificationBellDot = {
  showDot: boolean;
  /** 벨을 눌렀을 때 부른다. 점을 바로 내리고 지금까지 온 알림을 본 것으로 적는다. */
  markSeen: () => void;
};

/**
 * 홈 헤더 벨의 레드닷. 마지막으로 벨을 누른(또는 알림 센터를 연) 뒤에 안 읽은 알림이 새로
 * 왔으면 띄운다 — 기준은 `bellSeen` 주석 참고.
 *
 * 홈은 폴링하지 않으므로(MainSection 주석) 진입·앱 복귀·포그라운드 푸시 때만 다시 확인한다.
 */
export function useNotificationBellDot(): NotificationBellDot {
  const [showDot, setShowDot] = useState(false);
  /** 마지막 확인에서 본 가장 최근 알림 id. 벨을 누르면 이 값까지 본 것으로 적는다. */
  const newestIdRef = useRef(0);

  const refresh = useCallback(() => {
    getNotifications({ size: CHECK_SIZE })
      .then(({ notifications }) => {
        newestIdRef.current = newestNotificationId(notifications);
        healBellSeen(newestIdRef.current);
        setShowDot(hasNewUnreadSince(notifications, readBellSeenId()));
      })
      // 점 하나로 화면을 막을 일은 아니다. 실패하면 직전 상태를 그대로 둔다.
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useOnAppResume(refresh);

  // 웹에서는 이 이벤트가 발생하지 않는다(푸시 진입점 전체가 네이티브로 막혀 있다).
  useEffect(() => {
    window.addEventListener(PUSH_RECEIVED_EVENT, refresh);
    return () => window.removeEventListener(PUSH_RECEIVED_EVENT, refresh);
  }, [refresh]);

  /*
   * 확인 응답보다 먼저 눌렸으면 newestIdRef 가 0 이라 여기서는 적을 것이 없다. 그 경우는
   * 이어서 열리는 알림 센터가 목록을 받으며 적는다(useNotifications).
   */
  const markSeen = useCallback(() => {
    setShowDot(false);
    markBellSeen(newestIdRef.current);
  }, []);

  return { showDot, markSeen };
}
