"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";

/** 완전히 열렸을 때 드러나는 삭제 버튼의 폭. */
const ACTION_WIDTH = 80;

/** 이만큼 넘게 밀면 손을 떼도 열린 상태로 남는다. */
const OPEN_THRESHOLD = ACTION_WIDTH / 2;

/**
 * 세로 스크롤과 가로 스와이프를 가르는 문턱.
 * 이 값을 넘기 전에는 어느 쪽으로도 잠그지 않아, 목록 스크롤이 먼저 죽지 않는다.
 */
const DIRECTION_LOCK_PX = 8;

/** 이만큼 움직였으면 탭이 아니라 스와이프로 본다 — 손 떼는 순간의 클릭을 삼킨다. */
const TAP_SLOP_PX = 6;

interface SwipeToDeleteProps {
  onDelete: () => void;
  children: React.ReactNode;
  /** 삭제 버튼의 접근성 이름. "알림 삭제"처럼 무엇을 지우는지 넣는다. */
  deleteLabel: string;
  /** 스와이프를 막는다. 끝나지 않은 대화방처럼 지울 수 없는 줄에 쓴다. */
  disabled?: boolean;
  className?: string;
}

/**
 * 옆으로 밀면 삭제 버튼이 나오는 줄. 알림 센터와 대화방 목록이 함께 쓴다.
 *
 * 포인터 이벤트만 쓰고 라이브러리를 들이지 않는다. 터치·마우스·펜이 같은 경로로 들어오고
 * iOS 웹뷰에서도 동작한다.
 *
 * 삭제 버튼은 열려 있지 않아도 DOM 에 남겨 둔다 — 스와이프를 할 수 없는 사용자도
 * 탭 이동으로 삭제에 닿을 수 있어야 하기 때문이다.
 */
export function SwipeToDelete({
  onDelete,
  children,
  deleteLabel,
  disabled = false,
  className,
}: SwipeToDeleteProps) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const startRef = useRef<{ x: number; y: number; offset: number } | null>(null);
  /** null = 아직 방향 미정, "x" = 스와이프, "y" = 세로 스크롤(이 제스처는 포기) */
  const axisRef = useRef<"x" | "y" | null>(null);
  /** 방금 스와이프였는지. 손 떼는 순간 따라오는 click 을 삼키는 데 쓴다. */
  const swipedRef = useRef(false);

  const close = useCallback(() => setOffset(0), []);

  // 지울 수 없게 바뀌면(예: 방이 다시 열림) 열려 있던 것도 닫는다.
  useEffect(() => {
    if (disabled) setOffset(0);
  }, [disabled]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || event.pointerType === "mouse" && event.button !== 0) return;
    startRef.current = { x: event.clientX, y: event.clientY, offset };
    axisRef.current = null;
    swipedRef.current = false;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = startRef.current;
    if (disabled || !start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;

    if (axisRef.current === null) {
      if (Math.abs(dx) < DIRECTION_LOCK_PX && Math.abs(dy) < DIRECTION_LOCK_PX) return;
      axisRef.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (axisRef.current === "x") {
        setDragging(true);
        /**
         * 포인터를 이 요소에 붙잡아 둔다. 안 하면 손가락이 줄 밖으로 나가는 순간
         * pointerup 이 딴 데로 가서 줄이 열린 채 굳는다.
         *
         * 활성 포인터가 아니면 브라우저가 throw 한다(합성 이벤트로 들어오는 경우 등).
         * 캡처는 있으면 좋은 보정이지 제스처의 전제가 아니므로 삼킨다.
         */
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // 캡처 없이도 pointerup/pointercancel 로 제스처는 끝난다.
        }
      }
    }

    if (axisRef.current !== "x") return;

    if (Math.abs(dx) > TAP_SLOP_PX) swipedRef.current = true;
    // 왼쪽으로만 열린다. 오른쪽으로는 닫히는 데까지만.
    setOffset(Math.min(0, Math.max(-ACTION_WIDTH, start.offset + dx)));
  };

  const endGesture = (event: React.PointerEvent<HTMLDivElement>) => {
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // 캡처를 못 걸었던 경우다. 아래 정리만 하면 된다.
    }
    startRef.current = null;
    axisRef.current = null;
    setDragging(false);
    setOffset((current) => (current < -OPEN_THRESHOLD ? -ACTION_WIDTH : 0));
  };

  /**
   * 스와이프 끝에 따라오는 click 을 삼킨다. 캡처 단계에서 잡아야 줄 안쪽의 버튼·링크가
   * 눌리기 전에 막을 수 있다. 열려 있는 동안의 탭은 "닫기"로 쓴다.
   */
  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (swipedRef.current) {
      event.preventDefault();
      event.stopPropagation();
      swipedRef.current = false;
      return;
    }
    if (offset !== 0) {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  };

  return (
    <Track className={className}>
      <ActionSlot aria-hidden={disabled || undefined}>
        <DeleteButton
          type="button"
          aria-label={deleteLabel}
          disabled={disabled}
          onClick={() => {
            close();
            onDelete();
          }}
        >
          삭제
        </DeleteButton>
      </ActionSlot>

      <Sheet
        $offset={offset}
        $dragging={dragging}
        $swipeable={!disabled}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        onClickCapture={handleClickCapture}
      >
        {children}
      </Sheet>
    </Track>
  );
}

const Track = styled.div`
  position: relative;
  overflow: hidden;
  width: 100%;
`;

const ActionSlot = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: ${ACTION_WIDTH}px;
  display: flex;
`;

const DeleteButton = styled.button`
  flex: 1;
  border: none;
  cursor: pointer;
  background-color: var(--color-semantic-status-negative);
  color: var(--color-semantic-static-white);
  font-family: inherit;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 600;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);

  &:disabled {
    cursor: default;
    visibility: hidden;
  }
`;

const Sheet = styled.div<{ $offset: number; $dragging: boolean; $swipeable: boolean }>`
  position: relative;
  background-color: var(--color-semantic-background-normal-normal);
  transform: translateX(${({ $offset }) => $offset}px);
  /* 끌고 있는 동안 트랜지션이 붙으면 손가락보다 늦게 따라온다. */
  transition: ${({ $dragging }) => ($dragging ? "none" : "transform 0.18s ease-out")};
  /* 가로 제스처는 우리가 쓰고, 세로 스크롤은 브라우저에 넘긴다. */
  touch-action: ${({ $swipeable }) => ($swipeable ? "pan-y" : "auto")};
`;
