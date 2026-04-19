"use client";

import styled from "styled-components";
import type { ReactNode } from "react";

interface SurfaceCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

/**
 * SurfaceCard — Figma에서 반복되는 카드 기반 콘텐츠 섹션.
 * warm neutral 배경, 8px radius, 24px padding, 24px gap.
 */
export function SurfaceCard({ children, className, onClick }: SurfaceCardProps) {
  console.log('[src/shared/ui/SurfaceCard/SurfaceCard.tsx] SurfaceCard'); // __component_log__
    return (
        <Card className={className} onClick={onClick} $clickable={!!onClick}>
            {children}
        </Card>
    );
}

const Card = styled.div<{ $clickable: boolean }>`
  position: relative;
  width: 100%;
  padding: 16px;
  background-color: var(--color-semantic-background-normal-normal);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
  overflow: visible;
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};

  ${({ $clickable }) =>
        $clickable &&
        `
    &:active {
      background-color: var(--color-semantic-interaction-inactive);
    }
  `}
`;
