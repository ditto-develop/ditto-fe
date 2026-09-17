"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * 바닥에 붙어 있다고 볼 여유(px). 한 줄 높이보다 조금 크게 둔다 —
 * 스무스 스크롤이 끝난 직후에도 소수점 오차로 몇 px 남는 일이 있다.
 */
const BOTTOM_THRESHOLD_PX = 48;

/** 목록이 바닥에 붙어 있다고 볼 수 있는가. 위로 올려 과거를 읽는 중이면 false. */
export function isPinnedToBottom(
  el: Pick<HTMLElement, "scrollHeight" | "scrollTop" | "clientHeight">,
  threshold = BOTTOM_THRESHOLD_PX,
): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
}

/**
 * 키보드가 열리고 닫힐 때 대화 목록을 바닥에 붙여 둔다.
 *
 * 채팅방은 화면 높이에 맞춰지고(`overflow: hidden`) 목록만 안쪽에서 스크롤하는 구조라,
 * 키보드가 닫히면 목록의 높이(clientHeight)만 커지고 `scrollTop` 은 그대로다. 그러면 바닥에 붙어
 * 있던 마지막 메시지가 화면 밖으로 밀려난다 — "보내고 나면 대화가 내려가 버린다"의 정체다.
 * 목록의 자동 스크롤은 메시지 배열이 바뀔 때만 돌아서 이 변화를 못 본다.
 *
 * **콘텐츠가 나중에 자라는 것도 같은 문제다.** 목록의 사진은 `loading="lazy"` 라 첫 스크롤이
 * 끝난 뒤에 로드되면서 높이를 늘린다. `scrollTop` 은 그대로라 방금 맞춰 둔 바닥이 위로
 * 밀려 "방에 들어가면 마지막 메시지가 아니라 어정쩡한 곳에서 시작"한다. 메시지 배열이 바뀐
 * 것이 아니라 목록의 자동 스크롤도 돌지 않는다.
 *
 * **위로 올려 과거를 읽는 중에는 건드리지 않는다.** 그때 바닥으로 끌어내리면 읽던 자리를
 * 잃는다. 그래서 뷰포트가 바뀌거나 높이가 자라기 **전에** 바닥에 붙어 있었는지를 스크롤
 * 이벤트로 기억해 둔다.
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

    let frame: number | null = null;

    const stick = () => {
      if (!pinnedRef.current) return;
      const target = listRef.current;
      if (!target) return;
      target.scrollTop = target.scrollHeight;
    };

    const runScheduledStick = () => {
      frame = null;
      stick();
    };

    const scheduleStick = () => {
      if (frame !== null || !pinnedRef.current) return;
      frame = window.requestAnimationFrame(runScheduledStick);
    };

    /**
     * 키보드와 함께 채팅방 높이가 애니메이션되는 동안 목록 높이도 매 프레임 달라진다.
     * 정해진 시각에 여러 번 점프시키지 않고 실제 크기가 달라진 프레임에만 바닥을 맞춘다.
     */
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleStick);
    observer?.observe(el);

    // 요소 크기가 그대로인 오버레이형 모바일 브라우저에서도 기존 보정을 유지한다.
    const viewport = window.visualViewport;
    if (viewport) viewport.addEventListener("resize", scheduleStick);
    else window.addEventListener("resize", scheduleStick);

    /*
     * 사진이 다 그려지면 그 높이만큼 목록이 자란다. img 의 load 는 버블링하지 않으므로
     * 목록에서 캡처 단계로 받는다. 지연 로드된 사진이 뒤늦게 들어와도 바닥을 유지한다.
     */
    el.addEventListener("load", stick, true);
    // 실패한 사진은 대체 박스로 바뀌며 높이가 또 달라진다.
    el.addEventListener("error", stick, true);

    /*
     * 웹폰트가 교체되면 모든 말풍선의 줄바꿈이 다시 잡히며 높이가 달라진다.
     * 사진과 달리 한 번뿐이라 폰트가 준비되는 시점에 한 번만 다시 붙인다.
     */
    let fontsSettled = false;
    void document.fonts?.ready
      .then(() => {
        if (!fontsSettled) stick();
      })
      .catch(() => undefined);

    return () => {
      el.removeEventListener("scroll", remember);
      el.removeEventListener("load", stick, true);
      el.removeEventListener("error", stick, true);
      observer?.disconnect();
      fontsSettled = true;
      if (viewport) viewport.removeEventListener("resize", scheduleStick);
      else window.removeEventListener("resize", scheduleStick);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [listRef]);
}
