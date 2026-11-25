"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

import type { LandingScreen } from "@/features/download/model/landingScreens";

interface HeroSliderProps {
  slides: readonly LandingScreen[];
  /** 손대기 전까지 저절로 넘기는 간격. */
  intervalMs?: number;
}

/** 이만큼 넘게 옆으로 밀어야 장이 넘어간다. */
const SWIPE_THRESHOLD_PX = 40;

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
}

/**
 * 첫 화면 그림 슬라이드(웹 다운로드 안내).
 *
 * 위치는 가로 스크롤이 아니라 transform(장 번호 × 100%)으로 옮긴다. 스크롤 스냅으로 만들었을 때
 * Safari(PC)에서 부드러운 스크롤이 몇 px 모자라게 멈춰 옆 장의 가장자리가 비쳐 보였다(2026-11-25).
 * 옆으로 밀면 손가락을 따라오다가 놓을 때 넘어가거나 돌아온다. 세로 스크롤은 브라우저에 그대로 둔다
 * (`touch-action: pan-y`).
 *
 * 손대기 전까지는 저절로 넘어가고, 밀거나 점을 누르면 멈춘다. 움직임 줄이기 설정이면 저절로 넘기지 않는다.
 */
export function HeroSlider({ slides, intervalMs = 4000 }: HeroSliderProps) {
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const count = slides.length;

  useEffect(() => {
    if (!autoplay || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setActive((prev) => (prev + 1) % count), intervalMs);
    return () => window.clearTimeout(timer);
  }, [active, autoplay, intervalMs, count]);

  const goTo = (index: number) => {
    setAutoplay(false);
    setActive(Math.min(Math.max(index, 0), count - 1));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (count < 2 || (event.pointerType === "mouse" && event.button !== 0)) return;
    setAutoplay(false);
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // 합성 이벤트(테스트) 등 캡처할 수 없는 포인터면 캡처 없이 진행한다.
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setDragOffset(event.clientX - drag.startX);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragOffset(null);
    if (cancelled) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;
    goTo(dx < 0 ? active + 1 : active - 1);
  };

  const dragging = dragOffset !== null;
  const transform = `translateX(calc(${-active * 100}% + ${dragOffset ?? 0}px))`;

  return (
    <Root>
      <Viewport
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => endDrag(event, false)}
        onPointerCancel={(event) => endDrag(event, true)}
        data-testid="hero-slider-viewport"
      >
        {/* 장 번호에 따라 바뀌는 위치라 인라인으로 둔다. */}
        <Track $dragging={dragging} style={{ transform }}>
          {slides.map((slide, index) => (
            <Slide key={slide.src} data-testid="hero-slide" aria-hidden={index === active ? undefined : true}>
              <SlideImage
                src={slide.src}
                alt={slide.alt}
                width={slide.width}
                height={slide.height}
                draggable={false}
                fetchPriority={index === 0 ? "high" : undefined}
              />
            </Slide>
          ))}
        </Track>
      </Viewport>

      {count > 1 && (
        <Dots>
          {slides.map((slide, index) => (
            <Dot
              key={slide.src}
              type="button"
              $active={index === active}
              aria-label={`${index + 1}번째 그림 보기`}
              aria-current={index === active ? "true" : undefined}
              onClick={() => goTo(index)}
            />
          ))}
        </Dots>
      )}
    </Root>
  );
}

const Root = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
`;

/* 폰이 놓이는 무대. 그림 속 폰은 무대 가장자리 밖으로 넘치고, 장이 넘어갈 때도 무대 밖으로 사라진다. */
const Viewport = styled.div`
  width: 100%;
  overflow: hidden;
  border-radius: var(--space-6);
  background-color: var(--color-semantic-background-normal-alternative);
  touch-action: pan-y;
  cursor: grab;
  /* Safari 가 둥근 모서리 밖으로 움직이는 장을 그리지 않게 한다. */
  isolation: isolate;
`;

const Track = styled.div<{ $dragging: boolean }>`
  display: flex;
  width: 100%;
  transition: ${({ $dragging }) => ($dragging ? "none" : "transform 0.5s ease")};
  will-change: transform;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Slide = styled.div`
  flex: 0 0 100%;
  user-select: none;
`;

/* 비스듬한 폰 그림(build-landing-shots.mjs). 폰 바깥이 투명해 무대 색이 비친다. */
const SlideImage = styled.img`
  display: block;
  width: 100%;
  height: auto;
`;

const Dots = styled.div`
  display: flex;
  gap: var(--space-2);
`;

/* 지금 장은 길쭉한 점. */
const Dot = styled.button<{ $active: boolean }>`
  width: ${({ $active }) => ($active ? "var(--space-5)" : "var(--space-2)")};
  height: var(--space-2);
  padding: 0;
  border: none;
  border-radius: var(--space-1);
  background-color: ${({ $active }) =>
    $active ? "var(--color-semantic-primary-normal)" : "var(--color-semantic-label-assistive)"};
  cursor: pointer;
  transition: width 0.2s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
