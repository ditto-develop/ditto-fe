"use client";

import styled from "styled-components";

import type { FeedbackType, FeedbackTypeOption } from "@/features/feedback/model/types";
import { Radio } from "@/shared/ui";

interface FeedbackTypeCardProps {
  option: FeedbackTypeOption;
  selected: boolean;
  onSelect: (type: FeedbackType) => void;
}

/**
 * 의견 유형 카드. 하나만 고른다 — 카드 전체가 라디오의 label 이다.
 * 신고 사유 카드(ReportReasonCard)와 같은 모양에 체크 대신 라디오를 쓴다.
 */
export function FeedbackTypeCard({ option, selected, onSelect }: FeedbackTypeCardProps) {
  return (
    <Card $selected={selected}>
      <TextGroup>
        <Label>
          {option.emoji} {option.label}
        </Label>
        <Description>{option.description}</Description>
      </TextGroup>
      <Radio
        name="feedback-type"
        value={option.value}
        checked={selected}
        label={option.label}
        onChange={() => onSelect(option.value)}
      />
    </Card>
  );
}

const Card = styled.label<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4);
  border-radius: var(--space-3);
  box-sizing: border-box;
  cursor: pointer;
  transition: border-color 0.15s ease;
  border: 1px solid
    ${({ $selected }) =>
      $selected
        ? "var(--color-semantic-line-normal-strong)"
        : "var(--color-semantic-line-normal-neutral)"};
`;

const TextGroup = styled.div`
  display: flex;
  flex: 1 0 0;
  min-width: 0;
  flex-direction: column;
  gap: var(--spacing-2px);
`;

const Label = styled.span`
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 600;
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-normal);
`;

const Description = styled.span`
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 400;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-normal);
`;
