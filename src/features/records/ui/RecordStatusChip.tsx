"use client";

import type { ReactNode } from "react";
import styled from "styled-components";

/**
 * 기록 카드 오른쪽 위 상태 칩(Figma Chip/Filter — 3254:37071 · 3254:37962 · 3255:37096).
 * - `primary`: "이번 주" — 진한 바탕
 * - `neutral`: "결과 공개 전" — 옅은 회색 바탕
 * - `positive`: "결과 공개" — 초록 바탕
 */
export type RecordStatusChipTone = "primary" | "neutral" | "positive";

const BACKGROUND: Record<RecordStatusChipTone, string> = {
  primary: "var(--color-semantic-primary-normal)",
  neutral: "var(--color-semantic-line-solid-neutral)",
  positive: "var(--color-semantic-status-positive)",
};

const FOREGROUND: Record<RecordStatusChipTone, string> = {
  primary: "var(--color-semantic-inverse-label)",
  neutral: "var(--color-semantic-primary-normal)",
  positive: "var(--color-semantic-inverse-label)",
};

type RecordStatusChipProps = {
  tone: RecordStatusChipTone;
  children: ReactNode;
  className?: string;
};

export function RecordStatusChip({ tone, children, className }: RecordStatusChipProps) {
  return (
    <Chip $tone={tone} className={className}>
      {children}
    </Chip>
  );
}

const Chip = styled.span<{ $tone: RecordStatusChipTone }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-1) 7px;
  border-radius: var(--spacing-6px);
  background-color: ${({ $tone }) => BACKGROUND[$tone]};
  color: ${({ $tone }) => FOREGROUND[$tone]};
  font-size: var(--typography-caption-1-font-size);
  font-weight: 500;
  line-height: var(--typography-caption-1-line-height);
  letter-spacing: var(--typography-caption-1-letter-spacing);
  white-space: nowrap;
`;
