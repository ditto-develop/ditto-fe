"use client";

import styled from "styled-components";

import type { ReportReason, ReportReasonOption } from "@/features/report/model/types";
import { Radio } from "@/shared/ui";

interface ReportReasonCardProps {
  option: ReportReasonOption;
  selected: boolean;
  onSelect: (reason: ReportReason) => void;
}

/** Figma 7.1 [2448:31189] — 신고 사유 라디오 카드. 카드 전체가 선택 영역이다. */
export function ReportReasonCard({ option, selected, onSelect }: ReportReasonCardProps) {
  return (
    <Card $selected={selected}>
      <TextGroup>
        <Label>
          {option.emoji} {option.label}
        </Label>
        <Description>{option.description}</Description>
      </TextGroup>
      <Radio
        name="report-reason"
        value={option.value}
        checked={selected}
        onChange={() => onSelect(option.value)}
        label={option.label}
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
