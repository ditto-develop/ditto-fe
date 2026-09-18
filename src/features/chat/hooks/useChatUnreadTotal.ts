"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import { getChatRooms } from "@/features/chat/api/chatApi";
import {
  getChatUnreadTotal,
  setChatUnreadFromRooms,
  subscribeChatUnread,
} from "@/features/chat/lib/chatUnreadStore";
import { PUSH_RECEIVED_EVENT } from "@/shared/lib/native/pushNotifications";

/**
 * 하단 탭 '대화방' 배지 숫자.
 *
 * 값 자체는 chatUnreadStore 가 갖고 있고, 이 훅은 구독 + 갱신 시점만 담당한다.
 * 목록 화면(useChatRooms)이 방을 읽을 때마다 스토어를 채우므로 그 화면에서는 여기서 다시
 * 부르지 않아도 최신이다. 반대로 홈·프로필 탭에는 목록을 읽는 주체가 없어 직접 한 번 읽는다.
 *
 * SSR(정적 내보내기) 스냅샷은 항상 0 이다 — 서버에는 토큰이 없어 셀 것도 없고,
 * 0 을 내보내야 하이드레이션 불일치가 나지 않는다.
 */
export function useChatUnreadTotal(): number {
  const total = useSyncExternalStore(subscribeChatUnread, getChatUnreadTotal, () => 0);

  const refresh = useCallback(() => {
    getChatRooms()
      .then(setChatUnreadFromRooms)
      // 배지 숫자는 화면을 막을 값이 아니다. 실패하면 직전 값을 그대로 둔다.
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * 복귀·푸시 때 다시 센다. 방에 들어가 읽고 나오면 서버 값이 0 이 되는데, 탭 자체는
   * 리마운트되지 않는 경로(웹뷰 복귀·bfcache)가 있어 최초 1회 조회로는 못 잡는다.
   * useChatRooms 가 같은 이벤트를 듣는 화면에서는 스토어 갱신이 겹치지만 멱등이라 괜찮다.
   */
  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState !== "visible") return;
      refresh();
    };

    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("pageshow", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);
    // 웹에서는 발생하지 않는다(푸시 진입점 전체가 네이티브로 막혀 있다).
    window.addEventListener(PUSH_RECEIVED_EVENT, refresh);

    return () => {
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("pageshow", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
      window.removeEventListener(PUSH_RECEIVED_EVENT, refresh);
    };
  }, [refresh]);

  return total;
}
