"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * 바닥에 붙어 있다고 볼 여유(px). 한 줄 높이보다 조금 크게 둔다 —
 * 스무스 스크롤이 끝난 직후에도 소수점 오차로 몇 px 남는 일이 있다.
 */
const BOTTOM_THRESHOLD_PX = 48;

/**
 * 키보드가 닫히는 동안 뷰포트가 여러 번 바뀐다. 마지막 변화 뒤에도 한 번 더 맞춰야
 * 애니메이션이 끝난 최종 높이에 정확히 붙는다. 기존 키보드 코드가 재는 250~700ms 를 덮는다.
 */
const SETTLE_DELAYS_MS = [0, 120, 320, 720];

/** 목록이 바닥에 붙어 있는가. 위로 올려 과거를 읽는 중이면 false. */
export function isPinnedToBottom(
  el: Pick<HTMLElement, "scrollHeight" | "scrollTop" | "clientHeight">,
  threshold = BOTTOM_THRESHOLD_PX,
): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
}

/**
 * 키보드가 열리고 닫힐 때 대화 목록을 바닥에 붙여 둔다.
 *
 * 모바일에서 키보드는 레이아웃 뷰포트를 줄이지 않고 화면 위를 덮는다. 채팅방은
 * `height: 100dvh; overflow: hidden` 이고 목록만 안쪽에서 스크롤하는 구조라, 키보드가
 * 닫히면 목록의 높이(clientHeight)만 커지고 `scrollTop` 은 그대로다. 그러면 바닥에 붙어
 * 있던 마지막 메시지가 화면 밖으로 밀려난다 — "보내고 나면 대화가 내려가 버린다"의 정체다.
 * 목록의 자동 스크롤은 메시지 배열이 바뀔 때만 돌아서 이 변화를 못 본다.
 *
 * **위로 올려 과거를 읽는 중에는 건드리지 않는다.** 그때 바닥으로 끌어내리면 읽던 자리를
 * 잃는다. 그래서 뷰포트가 바뀌기 **전에** 바닥에 붙어 있었는지를 스크롤 이벤트로 기억해 둔다.
 */
export function useStayAtBottom(listRef: RefObject<HTMLElement | null>): void {
  const pinnedRef = useRef(true);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const remember = () => {
      pinnedRef.current = isPinnedToBottom(el);
    };
    remember();
    el.addEventListener("scroll", remember, { passive: true });

    const timers: ReturnType<typeof setTimeout>[] = [];

    const stick = () => {
      if (!pinnedRef.current) return;
      const target = listRef.current;
      if (!target) return;
      // 애니메이션 중에는 부드럽게 굴릴 이유가 없다 — 어차피 여러 번 다시 맞춘다.
      target.scrollTop = target.scrollHeight;
    };

    const handleViewportChange = () => {
      for (const delay of SETTLE_DELAYS_MS) {
        timers.push(setTimeout(stick, delay));
      }
    };

    // visualViewport 가 없는 환경(구형 브라우저·jsdom)에서는 window resize 로 떨어진다.
    const viewport = typeof window !== "undefined" ? window.visualViewport : undefined;
    if (viewport) {
      viewport.addEventListener("resize", handleViewportChange);
    } else {
      window.addEventListener("resize", handleViewportChange);
    }

    return () => {
      el.removeEventListener("scroll", remember);
      if (viewport) {
        viewport.removeEventListener("resize", handleViewportChange);
      } else {
        window.removeEventListener("resize", handleViewportChange);
      }
      for (const timer of timers) clearTimeout(timer);
    };
  }, [listRef]);
}
