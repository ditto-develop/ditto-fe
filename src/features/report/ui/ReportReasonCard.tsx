"use client";

import styled from "styled-components";

import type { ReportReason, ReportReasonOption } from "@/features/report/model/types";

interface ReportReasonCardProps {
  option: ReportReasonOption;
  selected: boolean;
  onToggle: (reason: ReportReason) => void;
}

/**
 * Figma 7.1 [2448:31189] — 신고 사유 카드. 카드 전체가 선택 영역이다.
 * 여러 개를 고를 수 있다(2026-09-27 QA, BE `reasons[]`) — 라디오 대신 체크 표시를 쓴다.
 * 공용 Checkbox 는 자체 <label> 이라 카드 label 안에 넣을 수 없어 같은 모양을 여기서 그린다.
 */
export function ReportReasonCard({ option, selected, onToggle }: ReportReasonCardProps) {
  return (
    <Card $selected={selected}>
      <TextGroup>
        <Label>
          {option.emoji} {option.label}
        </Label>
        <Description>{option.description}</Description>
      </TextGroup>
      <HiddenInput
        type="checkbox"
        name="report-reason"
        value={option.value}
        checked={selected}
        aria-label={option.label}
        onChange={() => onToggle(option.value)}
      />
      <CheckBox aria-hidden="true" $checked={selected}>
        {selected && (
          <svg viewBox="0 0 16 16">
            <path d="M3.5 8.2 6.7 11 12.5 5" />
          </svg>
        )}
      </CheckBox>
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

const HiddenInput = styled.input`
  position: absolute;
  width: var(--spacing-1px);
  height: var(--spacing-1px);
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;

  &:focus-visible + span {
    outline: var(--spacing-2px) solid var(--color-semantic-line-normal-strong);
    outline-offset: var(--spacing-2px);
  }
`;

/* 공용 Checkbox(src/shared/ui/Checkbox) 의 상자와 같은 모양. */
const CheckBox = styled.span<{ $checked: boolean }>`
  width: var(--space-5);
  height: var(--space-5);
  flex-shrink: 0;
  border: var(--spacing-2px) solid
    ${({ $checked }) =>
      $checked
        ? "var(--color-semantic-primary-normal)"
        : "var(--color-semantic-line-normal-normal)"};
  border-radius: var(--space-1);
  background-color: ${({ $checked }) =>
    $checked
      ? "var(--color-semantic-primary-normal)"
      : "var(--color-semantic-background-normal-normal)"};
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-semantic-inverse-label);

  svg {
    width: var(--space-4);
    height: var(--space-4);
    fill: none;
    stroke: currentColor;
    stroke-width: var(--spacing-2px);
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;
