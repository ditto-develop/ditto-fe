"use client";

import type { ReactNode } from "react";
import styled from "styled-components";

import { Icon } from "@/shared/ui/Icon/Icon";

type SectionMessageTone = "negative" | "cautionary" | "positive";

interface SectionMessageProps {
  title: string;
  description: ReactNode;
  tone?: SectionMessageTone;
  className?: string;
}

const toneColor: Record<SectionMessageTone, string> = {
  negative: "var(--color-semantic-status-negative)",
  cautionary: "var(--color-semantic-status-cautionary)",
  positive: "var(--color-semantic-status-positive)",
};

/**
 * SectionMessage — Figma: Section Message/Section Message [1893:18571]
 * 사용자의 작업 또는 시스템 상황에 대한 상태를 제공한다.
 * 토스트와 달리 사용자가 해제할 때까지 화면에 남는다.
 */
export function SectionMessage({
  title,
  description,
  tone = "negative",
  className,
}: SectionMessageProps) {
  return (
    <Container className={className} $tone={tone} role="status">
      <IconSlot $tone={tone}>
        <Icon name="status.circleExclamation" size={20} />
      </IconSlot>
      <Message>
        <Title $tone={tone}>{title}</Title>
        <Description>{description}</Description>
      </Message>
    </Container>
  );
}

const Container = styled.div<{ $tone: SectionMessageTone }>`
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3);
  border-radius: var(--space-3);
  box-sizing: border-box;
  overflow: hidden;
  background-color: var(--color-semantic-background-normal-normal);

  /* Figma: 배경 위에 tone 색을 5% 얹는다. */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-color: ${({ $tone }) => toneColor[$tone]};
    opacity: var(--color-atomic-opacity-5);
    pointer-events: none;
  }
`;

const IconSlot = styled.span<{ $tone: SectionMessageTone }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--space-5);
  height: 22px;
  flex-shrink: 0;
  color: ${({ $tone }) => toneColor[$tone]};
`;

const Message = styled.div`
  position: relative;
  display: flex;
  flex: 1 0 0;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-1);
`;

const Title = styled.p<{ $tone: SectionMessageTone }>`
  margin: 0;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: ${({ $tone }) => toneColor[$tone]};
`;

const Description = styled.p`
  margin: 0;
  font-size: var(--typography-label-1-reading-font-size);
  font-weight: 400;
  line-height: var(--typography-label-1-reading-line-height);
  letter-spacing: var(--typography-label-1-reading-letter-spacing);
  color: var(--color-semantic-label-neutral);
`;
