"use client";

import type { ReactNode } from "react";
import styled from "styled-components";

import type { IconName } from "@/shared/ui/Icon/Icon";
import { Icon } from "@/shared/ui/Icon/Icon";

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: ReactNode;
  /** 하단에 놓을 CTA 등. */
  action?: ReactNode;
  className?: string;
}

/**
 * EmptyState — Figma: Empty State/Empty State [2508:32605]
 * 목록에 표시할 내용이 없을 때 사용한다.
 * 72px 원형 배경 위에 40px 아이콘을 얹는 구조.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Container className={className}>
      <IconCircle>
        <Icon name={icon} size={40} />
      </IconCircle>
      <TextGroup>
        <Title>{title}</Title>
        {description && <Description>{description}</Description>}
      </TextGroup>
      {action}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-10px);
  width: 100%;
  padding: 60px var(--space-4);
  box-sizing: border-box;
`;

const IconCircle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--space-18);
  height: var(--space-18);
  border-radius: 50%;
  flex-shrink: 0;
  background-color: var(--color-semantic-fill-normal);
  color: var(--color-semantic-label-assistive);
`;

const TextGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  text-align: center;
`;

const Title = styled.p`
  margin: 0;
  font-size: var(--typography-headline-1-font-size);
  font-weight: var(--typography-headline-1-font-weight);
  line-height: var(--typography-headline-1-line-height);
  letter-spacing: var(--typography-headline-1-letter-spacing);
  color: var(--color-semantic-label-normal);
`;

const Description = styled.p`
  margin: 0;
  font-size: var(--typography-body-2-reading-font-size);
  font-weight: var(--typography-body-2-reading-font-weight);
  line-height: var(--typography-body-2-reading-line-height);
  letter-spacing: var(--typography-body-2-reading-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;
