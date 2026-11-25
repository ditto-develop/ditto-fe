"use client";

import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

export interface HeroSlide {
  src: string;
  alt: string;
  width: number;
  height: number;
}

interface HeroSliderProps {
  slides: readonly HeroSlide[];
  /** 손대기 전까지 저절로 넘기는 간격. */
  intervalMs?: number;
}

function scrollToSlide(track: HTMLElement, index: number) {
  track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
}

/**
 * 첫 화면 그림 슬라이드(웹 다운로드 안내).
 *
 * 넘기는 동작은 브라우저 가로 스크롤(스크롤 스냅)에 맡긴다 — 터치 스와이프·트랙패드가 그대로 된다.
 * 손대기 전까지는 저절로 넘어가고, 밀거나 점을 누르면 멈춘다. 움직임 줄이기 설정이면 저절로 넘기지 않는다.
 */
export function HeroSlider({ slides, intervalMs = 4000 }: HeroSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => {
      const track = trackRef.current;
      if (track) scrollToSlide(track, (active + 1) % slides.length);
    }, intervalMs);
    return () => window.clearTimeout(timer);
  }, [active, autoplay, intervalMs, slides.length]);

  // 지금 보이는 장은 스크롤 위치로 정한다. 손으로 밀어도, 저절로 넘어가도 같은 길로 온다.
  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  };

  const stopAutoplay = () => setAutoplay(false);

  return (
    <Root>
      <Track
        ref={trackRef}
        onScroll={handleScroll}
        onPointerDown={stopAutoplay}
        onTouchStart={stopAutoplay}
        onWheel={stopAutoplay}
        data-testid="hero-slider-track"
      >
        {slides.map((slide, index) => (
          <SlideImage
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            width={slide.width}
            height={slide.height}
            fetchPriority={index === 0 ? "high" : undefined}
          />
        ))}
      </Track>

      {slides.length > 1 && (
        <Dots>
          {slides.map((slide, index) => (
            <Dot
              key={slide.src}
              type="button"
              $active={index === active}
              aria-label={`${index + 1}번째 그림 보기`}
              aria-current={index === active ? "true" : undefined}
              onClick={() => {
                stopAutoplay();
                const track = trackRef.current;
                if (track) scrollToSlide(track, index);
              }}
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

/* 그림 자체에 배경이 있어 카드처럼 보이게 모서리만 둥글린다. */
const Track = styled.div`
  display: flex;
  width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  border-radius: var(--space-6);
  box-shadow: var(--style-semantic-shadow-emphasize);

  &::-webkit-scrollbar {
    display: none;
  }
`;

const SlideImage = styled.img`
  display: block;
  flex: 0 0 100%;
  width: 100%;
  height: auto;
  scroll-snap-align: start;
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
