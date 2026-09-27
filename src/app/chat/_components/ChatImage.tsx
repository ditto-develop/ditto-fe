"use client";

import { useCallback, useState } from "react";
import styled from "styled-components";
import { SkeletonBlock } from "@/shared/ui";

type LoadState = "loading" | "loaded" | "error";

interface ChatImageProps {
  src: string;
  alt: string;
}

/**
 * 채팅 IMAGE 메시지 본문.
 *
 * BE가 이미지 크기(width/height)를 주지 않아 실제 비율로 칸을 잡을 수 없다. 그래서 고정 크기
 * 칸을 먼저 깔고 스켈레톤을 보여 주다가, 로드되면 그 칸 안에 cover로 채운다. 로드 전후로
 * 버블 높이가 같아서 아래 메시지가 밀리거나 바닥 스크롤이 틀어지지 않는다.
 * 원본 비율은 탭해서 여는 뷰어에서 본다.
 */
export function ChatImage({ src, alt }: ChatImageProps) {
  const [state, setState] = useState<LoadState>("loading");

  // 캐시에 있던 이미지는 onLoad보다 먼저 완료될 수 있어 마운트 시점에 한 번 확인한다.
  const imageRef = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete) setState(img.naturalWidth > 0 ? "loaded" : "error");
  }, []);

  return (
    <Frame>
      {state === "loading" && <Placeholder $width="100%" $height="100%" $radius="0" />}
      {state === "error" ? (
        <ErrorText>이미지를 불러오지 못했어요</ErrorText>
      ) : (
        <Image
          ref={imageRef}
          src={src}
          alt={alt}
          loading="lazy"
          $loaded={state === "loaded"}
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
        />
      )}
    </Frame>
  );
}

const Frame = styled.span`
  position: relative;
  display: block;
  width: 200px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  background-color: var(--color-semantic-fill-normal);
`;

const Placeholder = styled(SkeletonBlock)`
  position: absolute;
  inset: 0;
`;

const Image = styled.img<{ $loaded: boolean }>`
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: ${({ $loaded }) => ($loaded ? 1 : 0)};
  transition: opacity 0.2s ease-out;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const ErrorText = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-2-font-size);
  line-height: var(--typography-label-2-line-height);
  color: var(--color-semantic-label-alternative);
`;
