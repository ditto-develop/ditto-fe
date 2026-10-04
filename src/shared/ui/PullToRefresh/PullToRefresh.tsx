"use client";

import React, { useEffect, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { RotateCw } from "lucide-react";

import { hasOpenOverlay } from "@/shared/lib/overlayStack";

/** 이만큼 당긴 뒤 손을 떼면 새로고침한다. */
const TRIGGER_PX = 64;
/** 아무리 당겨도 표시기는 여기까지만 내려온다. */
const MAX_PULL_PX = 96;
/** 새로고침하는 동안 표시기가 머무는 깊이. */
const HOLD_PX = 56;
/** 손가락이 움직인 거리 대비 표시기가 내려오는 비율. 1보다 작아야 당기는 손맛이 난다. */
const RESISTANCE = 0.5;
/** 세로 당김으로 확정하기 전 문턱. 가로 스와이프·탭과 가른다. */
const DIRECTION_LOCK_PX = 8;
/** 표시기 원의 지름. 접혀 있을 땐 이만큼 위로 숨긴다. */
const INDICATOR_PX = 36;

interface PullToRefreshProps {
  /** 끝날 때까지 표시기가 돈다. 실패해도 표시기는 걷힌다 — 오류 안내는 호출부 몫이다. */
  onRefresh: () => Promise<unknown>;
  children: React.ReactNode;
}

/**
 * 문서 맨 위에서 아래로 당기면 새로고침한다.
 *
 * 문서 스크롤 화면(홈)용이다. 내용은 움직이지 않고 상단에서 원형 표시기만 내려온다.
 * 내용을 transform 으로 끌어내리면 그 래퍼가 position: fixed 자식(홈의 결과 모달 등)의
 * 컨테이닝 블록이 돼 모달이 어긋난다.
 *
 * 당기는 동안은 리렌더하지 않는다. 터치 이동마다 state 를 바꾸면 목록 전체가 다시 그려져
 * 손가락을 늦게 따라온다 — 표시기 스타일만 프레임 단위로 직접 바꾼다.
 *
 * 모달·바텀시트가 떠 있으면 시작하지 않는다. 시트 안을 당긴 것이 홈 새로고침이 되면 안 된다.
 */
export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const indicatorRef = useRef<HTMLDivElement>(null);
  const onRefreshRef = useRef(onRefresh);
  const [refreshing, setRefreshing] = useState(false);

  // 렌더 중에 ref 를 쓰면 react-hooks/refs 에 걸린다. 매 렌더 뒤에 갱신한다(useBackClose 와 같은 방식).
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  });

  useEffect(() => {
    let startX = 0;
    let startY: number | null = null;
    let pulling = false;
    let busy = false;
    let distance = 0;
    let frame = 0;

    const paint = (animate: boolean) => {
      frame = 0;
      const indicator = indicatorRef.current;
      if (!indicator) return;
      const progress = Math.min(1, distance / TRIGGER_PX);
      indicator.style.transition = animate ? "transform 0.2s ease-out, opacity 0.2s ease-out" : "none";
      indicator.style.transform = `translate3d(-50%, ${distance - INDICATOR_PX}px, 0) rotate(${progress * 270}deg)`;
      indicator.style.opacity = String(progress);
    };

    const settle = (to: number) => {
      distance = to;
      if (frame) cancelAnimationFrame(frame);
      paint(true);
    };

    const reset = () => {
      startY = null;
      pulling = false;
    };

    const onTouchStart = (event: TouchEvent) => {
      if (busy || event.touches.length !== 1 || window.scrollY > 0 || hasOpenOverlay()) return;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      pulling = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (startY === null) return;
      const dx = event.touches[0].clientX - startX;
      const dy = event.touches[0].clientY - startY;

      if (!pulling) {
        if (Math.abs(dx) < DIRECTION_LOCK_PX && Math.abs(dy) < DIRECTION_LOCK_PX) return;
        // 위로 밀거나 옆으로 미는 제스처는 포기한다. 이 제스처 동안은 다시 보지 않는다.
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy) || window.scrollY > 0) {
          reset();
          return;
        }
        pulling = true;
      }

      // 당기는 동안은 브라우저 스크롤·바운스를 막는다. 막지 않으면 iOS 고무줄 효과와 겹친다.
      if (event.cancelable) event.preventDefault();
      distance = Math.min(MAX_PULL_PX, Math.max(0, dy - DIRECTION_LOCK_PX) * RESISTANCE);
      if (!frame) frame = requestAnimationFrame(() => paint(false));
    };

    const onTouchEnd = () => {
      if (!pulling) {
        reset();
        return;
      }
      reset();
      if (distance < TRIGGER_PX) {
        settle(0);
        return;
      }

      busy = true;
      setRefreshing(true);
      settle(HOLD_PX);
      void onRefreshRef
        .current()
        .catch(() => undefined)
        .finally(() => {
          busy = false;
          setRefreshing(false);
          settle(0);
        });
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    // preventDefault 를 불러야 하므로 passive 가 아니어야 한다.
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchEnd);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  return (
    <>
      <Indicator
        ref={indicatorRef}
        role="status"
        aria-label={refreshing ? "새로고침 중" : undefined}
        data-cy="pull-to-refresh"
        data-refreshing={refreshing || undefined}
      >
        <Spinner $spinning={refreshing} aria-hidden="true" />
      </Indicator>
      {children}
    </>
  );
}

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Indicator = styled.div`
  position: fixed;
  top: env(safe-area-inset-top, 0px);
  left: 50%;
  z-index: 10;
  width: var(--space-9);
  height: var(--space-9);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: var(--color-semantic-background-normal-normal);
  box-shadow: var(--style-semantic-shadow-emphasize);
  color: var(--color-semantic-primary-normal);
  opacity: 0;
  transform: translate3d(-50%, calc(-1 * var(--space-9)), 0);
  pointer-events: none;
`;

const Spinner = styled(RotateCw)<{ $spinning: boolean }>`
  width: var(--space-5);
  height: var(--space-5);
  ${({ $spinning }) =>
    $spinning &&
    css`
      animation: ${spin} 0.8s linear infinite;
    `}
`;
