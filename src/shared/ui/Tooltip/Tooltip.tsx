"use client";

import styled from "styled-components";

import { Icon } from "@/shared/ui/Icon/Icon";

interface TooltipProps {
  message: string;
  /** 지정하면 닫기(×) 버튼이 노출된다. */
  onClose?: () => void;
  /** 말풍선 꼬리 방향. 기본값은 왼쪽(요소 오른쪽에 붙는 툴팁). */
  arrow?: "left" | "none";
  className?: string;
}

/**
 * Tooltip — Figma: Tooltip/Extended [2448:30741]
 * 행동에 설명이 필요한 경우 사용한다.
 */
export function Tooltip({ message, onClose, arrow = "left", className }: TooltipProps) {
  return (
    <Container className={className} role="tooltip" $arrow={arrow}>
      <Message>{message}</Message>
      {onClose && (
        <CloseButton type="button" onClick={onClose} aria-label="툴팁 닫기">
          <Icon name="navigation.close" size={16} />
        </CloseButton>
      )}
    </Container>
  );
}

const Container = styled.div<{ $arrow: "left" | "none" }>`
  position: relative;
  display: inline-flex;
  align-items: flex-start;
  gap: var(--space-2);
  min-width: var(--space-16);
  padding: var(--spacing-10px);
  border-radius: var(--space-2);
  box-sizing: border-box;
  background-color: var(--color-semantic-inverse-background);
  backdrop-filter: blur(32px);

  ${({ $arrow }) =>
    $arrow === "left" &&
    `
    &::before {
      content: "";
      position: absolute;
      top: 50%;
      left: -6px;
      width: 12px;
      height: 12px;
      transform: translateY(-50%) rotate(45deg);
      border-radius: 2px;
      background-color: var(--color-semantic-inverse-background);
    }
  `}
`;

const Message = styled.p`
  margin: 0;
  padding: 0 var(--spacing-2px);
  max-width: 228px;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-inverse-label);
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2px);
  border: none;
  background: none;
  cursor: pointer;
  flex-shrink: 0;
  color: var(--color-semantic-inverse-label);
  opacity: var(--color-atomic-opacity-61);
`;
