"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

const MESSAGE_ID_ATTRIBUTE = "data-chat-message-id";

/**
 * 스크롤 컨테이너 안에서 실제로 화면과 겹친 마지막 메시지를 읽음 경계로 올린다.
 *
 * 메시지를 받았다는 이유만으로 최신 ID를 보내면, 사용자가 위쪽을 읽는 동안 화면 밖으로
 * 들어온 메시지까지 읽음 처리된다. 스크롤·리사이즈·백그라운드 복귀 때 DOM 위치를 다시
 * 확인해 보이는 구간까지만 서버에 알린다.
 */
export function useVisibleMessageRead<T extends HTMLElement>(
  listRef: RefObject<T | null>,
  messageVersion: string,
  onVisibleMessage: (messageId: number) => void,
): void {
  const callbackRef = useRef(onVisibleMessage);

  useEffect(() => {
    callbackRef.current = onVisibleMessage;
  }, [onVisibleMessage]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;

    let scheduleFrame = 0;
    let reportFrame = 0;

    const reportVisibleBoundary = () => {
      reportFrame = 0;
      if (document.visibilityState === "hidden") return;

      const listRect = list.getBoundingClientRect();
      let latestVisibleId = 0;

      list.querySelectorAll<HTMLElement>(`[${MESSAGE_ID_ATTRIBUTE}]`).forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.bottom <= listRect.top || rect.top >= listRect.bottom) return;

        const messageId = Number(element.dataset.chatMessageId);
        if (Number.isInteger(messageId)) latestVisibleId = Math.max(latestVisibleId, messageId);
      });

      if (latestVisibleId > 0) callbackRef.current(latestVisibleId);
    };

    const scheduleReport = () => {
      if (scheduleFrame) cancelAnimationFrame(scheduleFrame);
      if (reportFrame) cancelAnimationFrame(reportFrame);
      scheduleFrame = requestAnimationFrame(() => {
        scheduleFrame = 0;
        reportFrame = requestAnimationFrame(reportVisibleBoundary);
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "hidden") scheduleReport();
    };

    list.addEventListener("scroll", scheduleReport, { passive: true });
    window.addEventListener("resize", scheduleReport);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleReport);
    resizeObserver?.observe(list);
    list
      .querySelectorAll<HTMLElement>(`[${MESSAGE_ID_ATTRIBUTE}]`)
      .forEach((element) => resizeObserver?.observe(element));

    scheduleReport();

    return () => {
      if (scheduleFrame) cancelAnimationFrame(scheduleFrame);
      if (reportFrame) cancelAnimationFrame(reportFrame);
      resizeObserver?.disconnect();
      list.removeEventListener("scroll", scheduleReport);
      window.removeEventListener("resize", scheduleReport);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [listRef, messageVersion]);
}
