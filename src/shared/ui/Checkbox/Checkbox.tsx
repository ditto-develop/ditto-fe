"use client";

import type { ReactNode } from "react";
import styled from "styled-components";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  helperText?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  helperText,
  disabled = false,
  className,
}: CheckboxProps) {
  return (
    <Label className={className} $disabled={disabled}>
      <HiddenInput
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <Box aria-hidden="true" $checked={checked}>
        {checked && (
          <svg viewBox="0 0 16 16">
            <path d="M3.5 8.2 6.7 11 12.5 5" />
          </svg>
        )}
      </Box>
      <TextGroup>
        <LabelText>{label}</LabelText>
        {helperText && <HelperText>{helperText}</HelperText>}
      </TextGroup>
    </Label>
  );
}

const Label = styled.label<{ $disabled: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
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

const Box = styled.span<{ $checked: boolean }>`
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

const TextGroup = styled.span`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2px);
`;

const LabelText = styled.span`
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-normal);
`;

const HelperText = styled.span`
  font-size: var(--typography-label-2-font-size);
  font-weight: var(--typography-label-2-font-weight);
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;
