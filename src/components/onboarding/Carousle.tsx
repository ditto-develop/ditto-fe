
'use client';

import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

type CarouselProps = {
  images: string[];
  interval?: number; // 기본 2000ms
};

export function SplashCarousel({ images, interval = 2000 }: CarouselProps) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isDragging = useRef(false);

  const length = images.length;

  const goNext = () => {
    setIndex((prev) => (prev + 1) % length);                 // 2 -> 0, 0 -> 1 ...
  };

  const goPrev = () => {
    setIndex((prev) => (prev - 1 + length) % length);        // 0 -> 2, 2 -> 1 ...
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    clearTimer();
    timerRef.current = setTimeout(goNext, interval);
  };

  // 자동 넘김
  useEffect(() => {
    if (length <= 1) return;
    startTimer();
    return clearTimer;
    // index가 바뀔 때마다 타이머 리셋
  }, [index, interval, length]);

  // 터치 이벤트 (모바일 스와이프)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    clearTimer();
    isDragging.current = true;
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) {
      startTimer();
      return;
    }

    const start = touchStartX.current;
    const end = touchEndX.current;

    const SWIPE_THRESHOLD = 40; // px

    if (start != null && end != null) {
      const diff = start - end;

      if (diff > SWIPE_THRESHOLD) {
        // 왼쪽으로 스와이프 → 다음 슬라이드
        goNext();
      } else if (diff < -SWIPE_THRESHOLD) {
        // 오른쪽으로 스와이프 → 이전 슬라이드
        goPrev();
      }
    }

    isDragging.current = false;
    touchStartX.current = null;
    touchEndX.current = null;
    startTimer();
  };

  return (
    <CarouselRoot>
      <SlideViewport
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Slides style={{ transform: `translateX(-${index * 100}%)` }}>
          {images.map((src, i) => (
            <Slide key={i}>
              <img src={src} alt={`splash-${i + 1}`} />
            </Slide>
          ))}
        </Slides>
      </SlideViewport>

      <Dots>
        {images.map((_, i) => (
          <Dot
            key={i}
            $active={i === index}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </Dots>
    </CarouselRoot>
  );
}

const CarouselRoot = styled.div`
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SlideViewport = styled.div`
  width: 100%;
  overflow: hidden;
`;

const Slides = styled.div`
  display: flex;
  width: 100%;
  transition: transform 0.4s ease;
`;

const Slide = styled.div`
  min-width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;

  background-color: var(--color-semantic-background-normal-normal, #f3f1ec); /* 필요하면 토큰으로 */

  img {
    max-width: 70%;
    height: auto;
    object-fit: contain;
  }
`;

const Dots = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
`;

const Dot = styled.button<{ $active: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 999px;
  border: none;
  padding: 0;
  cursor: pointer;
  background-color: ${({ $active }) =>
    $active ? '#222' : 'rgba(0,0,0,0.25)'};
  opacity: ${({ $active }) => ($active ? 1 : 0.5)};
`;
