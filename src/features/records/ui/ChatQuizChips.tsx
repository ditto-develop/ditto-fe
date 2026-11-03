"use client";

import styled from "styled-components";

import type { QuizChip } from "@/features/records/lib/roomAnswerText";

/**
 * 문항 카드의 답 칩 줄 — "나 · 노을빛"(밝음) / "사부작사부작 · 하늘빛"(어두움).
 * Figma Content Badge 3256:52697 · 3256:52759. 말풍선 카드와 입력창 위 미리보기가 같이 쓴다.
 */
export function ChatQuizChips({ chips }: { chips: QuizChip[] }) {
  if (chips.length === 0) return null;
  return (
    <Row>
      {chips.map((chip) => (
        <Chip key={chip.key} $tone={chip.tone}>
          {chip.label}
        </Chip>
      ))}
    </Row>
  );
}

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-10px);
`;

const Chip = styled.span<{ $tone: QuizChip["tone"] }>`
  display: inline-flex;
  align-items: center;
  height: var(--space-6);
  padding: 0 var(--spacing-6px);
  border-radius: var(--spacing-6px);
  box-sizing: border-box;
  background-color: ${({ $tone }) =>
    $tone === "mine"
      ? "var(--color-semantic-background-elevated-normal)"
      : "var(--color-semantic-label-normal)"};
  color: ${({ $tone }) =>
    $tone === "mine"
      ? "var(--color-semantic-label-alternative)"
      : "var(--color-semantic-static-white)"};
  font-family: var(--typography-font-family);
  font-size: var(--typography-caption-1-font-size);
  font-weight: 500;
  line-height: var(--typography-caption-1-line-height);
  letter-spacing: var(--typography-caption-1-letter-spacing);
  white-space: nowrap;
  font-feature-settings: "ss10" 1;
`;
