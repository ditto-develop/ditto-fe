"use client";

import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";

import { Icon } from "@/shared/ui";

/** 이 기기에서 그룹 "우리 그룹의 답변" 툴팁을 닫았는지. 방마다가 아니라 기기 한 번이다. */
const SEEN_STORAGE_KEY = "ditto.records.groupAnswersTooltipSeen";

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_STORAGE_KEY) === "1";
  } catch {
    // 저장소를 못 읽으면(프라이빗 창 등) 봤다고 친다 — 매번 뜨는 쪽이 더 거슬린다.
    return true;
  }
}

function writeSeen(): void {
  try {
    window.localStorage.setItem(SEEN_STORAGE_KEY, "1");
  } catch {
    // 못 적으면 이번 화면에서만 닫힌다.
  }
}

/**
 * "첫 진입 1회만 노출, x 혹은 아이콘 누르면 다시 안 뜸"(Figma 주석 3269:34323).
 * 1:1 방에는 띄우지 않는다(주석 3269:34324).
 */
export function useGroupAnswersTooltip(): { visible: boolean; dismiss: () => void } {
  // 정적 HTML·하이드레이션 첫 렌더에서는 저장소를 못 읽으므로 숨긴 채 시작한다.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!readSeen());
  }, []);

  const dismiss = useCallback(() => {
    writeSeen();
    setVisible(false);
  }, []);

  return { visible, dismiss };
}

type RoomAnswersTooltipProps = {
  onClose: () => void;
};

/**
 * 헤더 문서 아이콘 아래에 걸리는 안내 말풍선(Figma Tooltip/Extended 3262:55481).
 * 꼬리가 위쪽, 아이콘 중심을 가리킨다. 헤더(position: sticky) 안에 절대 위치로 놓는다.
 */
export function RoomAnswersTooltip({ onClose }: RoomAnswersTooltipProps) {
  return (
    <Bubble role="tooltip" data-cy="room-answers-tooltip">
      <Texts>
        <Title>우리 그룹의 답변</Title>
        <Description>질문에 고른 답변을 볼 수 있어요</Description>
      </Texts>
      <CloseButton type="button" aria-label="안내 닫기" onClick={onClose}>
        <Icon name="navigation.close" size={16} />
      </CloseButton>
    </Bubble>
  );
}

/*
 * 위치: 헤더 오른쪽 끝에서 16px 안쪽, 꼬리는 문서 아이콘(오른쪽에서 16 + 24 + 8 + 12 = 60px)의
 * 가운데. 말풍선 오른쪽 끝 기준으로는 60 - 16 = 44px 이다.
 * 세로는 헤더 아랫변 기준(상단 safe-area 가 늘어도 같이 내려간다) — 헤더 76px 중 아이콘 아랫변이
 * 40px 이라 말풍선은 48px(아래에서 28px)에서 시작해 꼬리 끝이 아이콘 바로 밑에 온다.
 */
const Bubble = styled.div`
  position: absolute;
  top: calc(100% - var(--space-7));
  right: var(--space-4);
  z-index: 110;
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  min-width: var(--space-16);
  padding: var(--spacing-10px);
  border-radius: var(--space-2);
  box-sizing: border-box;
  background-color: var(--color-semantic-inverse-background);
  backdrop-filter: blur(32px);

  &::before {
    content: "";
    position: absolute;
    top: calc(-1 * var(--spacing-6px));
    right: calc(var(--space-10) + var(--space-1) - var(--spacing-6px));
    width: var(--space-3);
    height: var(--space-3);
    transform: rotate(45deg);
    border-radius: var(--spacing-2px);
    background-color: var(--color-semantic-inverse-background);
  }
`;

const Texts = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6px);
  padding: 0 var(--spacing-2px);
`;

const Title = styled.p`
  margin: 0;
  font-family: var(--typography-font-family);
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-inverse-label);
`;

const Description = styled.p`
  margin: 0;
  font-family: var(--typography-font-family);
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 600;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-inverse-label);
  opacity: var(--color-atomic-opacity-61);
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2px);
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-semantic-inverse-label);
  opacity: var(--color-atomic-opacity-61);
`;
