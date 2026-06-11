"use client";

import styled from "styled-components";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label": string;
};

export function Switch({ checked, onCheckedChange, disabled, "aria-label": ariaLabel }: SwitchProps) {
  return (
    <SwitchButton
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      $checked={checked}
      onClick={() => onCheckedChange(!checked)}
    >
      <SwitchKnob $checked={checked} />
    </SwitchButton>
  );
}

const SwitchButton = styled.button<{ $checked: boolean }>`
  width: var(--space-10);
  height: var(--space-6);
  padding: var(--space-1);
  border: 0;
  border-radius: var(--space-6);
  background-color: ${({ $checked }) =>
    $checked ? "var(--color-semantic-primary-normal)" : "var(--color-semantic-interaction-disable)"};
  cursor: pointer;
  transition: background-color 0.2s;

  &:disabled {
    cursor: not-allowed;
  }
`;

const SwitchKnob = styled.span<{ $checked: boolean }>`
  display: block;
  width: var(--space-4);
  height: var(--space-4);
  border-radius: var(--space-4);
  background-color: var(--color-semantic-static-white);
  transform: translateX(${({ $checked }) => ($checked ? "var(--space-4)" : "var(--space-0)")});
  transition: transform 0.2s;
`;
