"use client";

import styled from "styled-components";

import { formatRecordMeta, pastRecordLabel } from "@/features/records/lib/recordFormat";
import type { QuizHistoryWeek } from "@/features/records/model/types";
import { Icon } from "@/shared/ui";

type PastRecordCardProps = {
  record: QuizHistoryWeek;
  onOpen: (quizSetId: number) => void;
};

/** 기록 탭 "지난 퀴즈" 한 줄(Figma 3254:37730). 카드 전체가 버튼이다. */
export function PastRecordCard({ record, onOpen }: PastRecordCardProps) {
  const label = pastRecordLabel(record);

  return (
    <Card type="button" onClick={() => onOpen(record.quizSetId)}>
      <Meta>{formatRecordMeta(record, { withWeek: true })}</Meta>
      <TitleRow>
        <Title>{record.title}</Title>
        <Chevron name="navigation.chevronRight" size={24} />
      </TitleRow>
      <Status $tone={label.tone}>{label.text}</Status>
    </Card>
  );
}

const Card = styled.button`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-4);
  border: none;
  border-radius: var(--radius-radi-4);
  background-color: var(--color-semantic-background-elevated-alternative);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
`;

const Meta = styled.span`
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const TitleRow = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
`;

const Title = styled.span`
  min-width: 0;
  font-size: var(--typography-headline-2-font-size);
  font-weight: var(--typography-headline-2-font-weight);
  line-height: var(--typography-headline-2-line-height);
  letter-spacing: var(--typography-headline-2-letter-spacing);
  color: var(--color-semantic-label-normal);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Chevron = styled(Icon)`
  color: var(--color-semantic-label-normal);
`;

const Status = styled.span<{ $tone: "positive" | "neutral" }>`
  font-size: var(--typography-label-2-font-size);
  font-weight: 600;
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: ${({ $tone }) =>
    $tone === "positive"
      ? "var(--color-semantic-status-positive)"
      : "var(--color-semantic-label-alternative)"};
`;
