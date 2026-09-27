"use client";

import styled from "styled-components";
import { useBackClose } from "@/shared/hooks/useBackClose";
import { useBodyScrollLock } from "@/shared/hooks/useBodyScrollLock";
import { Icon } from "@/shared/ui";

interface ChatImageViewerProps {
  /** null이면 닫힌 상태. */
  imageUrl: string | null;
  onClose: () => void;
}

/**
 * 채팅 이미지를 원본 비율 그대로 전체화면에 띄운다.
 * 말풍선 안에서는 고정 칸에 cover로 잘려 보이므로(ChatImage) 원본은 여기서 본다.
 * 배경이나 닫기 버튼을 누르거나 OS 뒤로가기를 하면 닫힌다.
 */
export function ChatImageViewer({ imageUrl, onClose }: ChatImageViewerProps) {
  const isOpen = imageUrl !== null;
  useBackClose(isOpen, onClose);
  useBodyScrollLock(isOpen);

  if (!imageUrl) return null;

  return (
    <Overlay role="dialog" aria-modal="true" aria-label="사진 보기" onClick={onClose}>
      <CloseButton type="button" aria-label="닫기" onClick={onClose}>
        <Icon name="navigation.close" size={24} />
      </CloseButton>
      <FullImage src={imageUrl} alt="보낸 이미지 원본" onClick={(e) => e.stopPropagation()} />
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-semantic-static-black);
`;

const CloseButton = styled.button`
  position: absolute;
  top: calc(env(safe-area-inset-top) + 12px);
  right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-semantic-static-white);
  cursor: pointer;
`;

const FullImage = styled.img`
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;
