"use client";

import styled from "styled-components";
import type { ReactNode } from "react";

interface SectionHeaderProps {
    title: string;
    subtitle?: string | ReactNode;
    className?: string;
}

/**
 * SectionHeader — Figma: Section Header/Section Header
 * 섹션 제목 + 선택적 부제목. height: 32px (Figma 기준).
 */
export function SectionHeader({ title, subtitle, className }: SectionHeaderProps) {
  console.log('[src/shared/ui/SectionHeader/SectionHeader.tsx] SectionHeader'); // __component_log__
    return (
        <Container className={className}>
            <Title>{title}</Title>
            {subtitle && <Subtitle>{subtitle}</Subtitle>}
        </Container>
    );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 24px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: var(--typography-heading-1-font-size);
  font-weight: 700;
  line-height: 1.3;
  color: var(--color-semantic-label-strong);
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 400;
  line-height: 1.4;
  color: var(--color-semantic-label-alternative);
`;
