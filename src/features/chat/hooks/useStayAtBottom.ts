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

    /*
     * **사용자가 직접 굴렸을 때만** 고정을 푼다.
     *
     * scroll 이벤트는 손가락뿐 아니라 우리가 맞춘 프로그램 스크롤·콘텐츠가 자라며 생긴
     * 위치 변화로도 난다. 그걸 그대로 받으면, 방에 들어온 직후 사진이 아직 안 붙어 목록이
     * 짧은 순간에 잰 값 하나로 pinned 가 꺼진다. 그 뒤 사진이 붙어 목록이 자라도 stick 이
     * 막혀 있어 바닥으로 못 돌아온다 — 들락날락하다 보면 가끔 마지막 메시지가 아닌 곳에서
     * 시작하던 것의 정체다(2026-09-17 QA).
     *
     * 실제 제스처(휠·터치·키보드)가 한 번이라도 있어야 판정을 시작하므로, 위로 올려
     * 과거를 읽는 동안 건드리지 않는 성질은 그대로다.
     */
    let userDriven = false;
    const markUserDriven = () => {
      userDriven = true;
    };

    const remember = () => {
      if (!userDriven) return;
      pinnedRef.current = isPinnedToBottom(el);
    };
    remember();
    el.addEventListener("scroll", remember, { passive: true });
    el.addEventListener("wheel", markUserDriven, { passive: true });
    el.addEventListener("touchstart", markUserDriven, { passive: true });
    el.addEventListener("keydown", markUserDriven);

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

    /*
     * 방에 들어온 직후에도 같은 일정으로 몇 번 다시 붙인다.
     *
     * 목록의 첫 스크롤은 메시지가 도착한 뒤 rAF 두 번 뒤에 한 번만 돈다. 그 시점에 아직
     * 붙지 않은 것(지연 로드 사진·뒤늦게 붙는 배너·방 메타를 받아 늘어나는 안내 카드)이
     * 있으면 바닥이 그만큼 밀리는데, 그 변화가 load 나 ResizeObserver 로 **떨어지지 않는
     * 경우**가 있다. 들락날락을 반복하면 가끔 마지막 메시지가 아닌 곳에서 시작하던 이유다.
     * 성장 이벤트에만 기대지 않고 첫 720ms 동안 몇 번 더 맞춘다 — 이미 바닥이면 no-op 이고,
     * 사용자가 그 사이 위로 올리면 pinned 가 꺼져 건드리지 않는다.
     */
    handleViewportChange();

    // visualViewport 가 없는 환경(구형 브라우저·jsdom)에서는 window resize 로 떨어진다.
    const viewport = typeof window !== "undefined" ? window.visualViewport : undefined;
    if (viewport) {
      viewport.addEventListener("resize", handleViewportChange);
    } else {
      window.addEventListener("resize", handleViewportChange);
    }

    /*
     * 사진이 다 그려지면 그 높이만큼 목록이 자란다. img 의 load 는 버블링하지 않으므로
     * 목록에서 캡처 단계로 받는다. 지연 로드된 사진이 뒤늦게 들어와도 바닥을 유지한다.
     */
    el.addEventListener("load", stick, true);
    // 실패한 사진은 대체 박스로 바뀌며 높이가 또 달라진다.
    el.addEventListener("error", stick, true);

    /*
     * 목록 자신의 높이도 나중에 바뀐다 — 위쪽 배너·안내 카드가 방 정보를 받아 뒤늦게 붙으면
     * 목록이 그만큼 짧아지고, `scrollTop` 은 그대로라 바닥이 또 밀린다. visualViewport 는
     * 이 변화를 내지 않으므로 요소 크기를 직접 본다.
     */
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => stick());
    observer?.observe(el);

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
      el.removeEventListener("wheel", markUserDriven);
      el.removeEventListener("touchstart", markUserDriven);
      el.removeEventListener("keydown", markUserDriven);
      el.removeEventListener("load", stick, true);
      el.removeEventListener("error", stick, true);
      observer?.disconnect();
      fontsSettled = true;
      if (viewport) {
        viewport.removeEventListener("resize", handleViewportChange);
      } else {
        window.removeEventListener("resize", handleViewportChange);
      }
      for (const timer of timers) clearTimeout(timer);
    };
  }, [listRef]);
}
