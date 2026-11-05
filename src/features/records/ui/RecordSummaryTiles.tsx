"use client";

import styled from "styled-components";

import type { QuizHistorySummary } from "@/features/records/model/types";

type RecordSummaryTilesProps = {
  summary: QuizHistorySummary;
};

/** 기록 탭 상단 3칸 — 참여한 주 · 답한 질문 · 소수 의견(Figma 3254:37727). */
export function RecordSummaryTiles({ summary }: RecordSummaryTilesProps) {
  const tiles = [
    { label: "참여한 주", value: summary.participatedWeeks, negative: false },
    { label: "답한 질문", value: summary.answeredQuestions, negative: false },
    // 소수 의견은 결과 화면의 "소수 의견" 칩과 같은 빨강이다.
    { label: "소수 의견", value: summary.minorityCount, negative: true },
  ];

  return (
    <Grid>
      {tiles.map((tile) => (
        <Tile key={tile.label}>
          <TileLabel>{tile.label}</TileLabel>
          <TileValue $negative={tile.negative}>{tile.value.toLocaleString("ko-KR")}</TileValue>
        </Tile>
      ))}
    </Grid>
  );
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
  width: 100%;
`;

const Tile = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4);
  border-radius: var(--radius-radi-4);
  background-color: var(--color-semantic-background-elevated-alternative);
  min-width: 0;
`;

const TileLabel = styled.span`
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
  white-space: nowrap;
`;

const TileValue = styled.strong<{ $negative: boolean }>`
  font-size: var(--typography-heading-1-font-size);
  font-weight: var(--typography-heading-1-font-weight);
  line-height: var(--typography-heading-1-line-height);
  letter-spacing: var(--typography-heading-1-letter-spacing);
  color: ${({ $negative }) =>
    $negative ? "var(--color-semantic-status-negative)" : "var(--color-semantic-label-normal)"};
`;
