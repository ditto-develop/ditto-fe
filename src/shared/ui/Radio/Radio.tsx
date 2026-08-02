"use client";

import styled from "styled-components";

interface RadioProps {
  checked: boolean;
  /** 같은 그룹의 라디오끼리 공유하는 name. 키보드 방향키 이동에 필요하다. */
  name: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

/**
 * Radio — Figma: Control/Radio [807:11321]
 * 여러 항목 중 하나를 선택해야 할 때 사용한다.
 * 카드 전체를 label로 감싸 쓰는 경우가 많아 시각 요소만 제공한다.
 */
export function Radio({
  checked,
  name,
  value,
  onChange,
  disabled = false,
  label,
  className,
}: RadioProps) {
  return (
    <Wrapper className={className} $disabled={disabled}>
      <HiddenInput
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={() => onChange(value)}
      />
      <Circle aria-hidden="true" $checked={checked} />
    </Wrapper>
  );
}

const Wrapper = styled.span<{ $disabled: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2px);
  flex-shrink: 0;
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
`;

const HiddenInput = styled.input`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: inherit;

  &:focus-visible + span {
    outline: var(--spacing-2px) solid var(--color-semantic-line-normal-strong);
    outline-offset: var(--spacing-2px);
  }
`;

const Circle = styled.span<{ $checked: boolean }>`
  width: var(--space-5);
  height: var(--space-5);
  box-sizing: border-box;
  border-radius: 50%;
  border: var(--spacing-2px) solid
    ${({ $checked }) =>
      $checked
        ? "var(--color-semantic-primary-normal)"
        : "var(--color-semantic-line-normal-normal)"};
  background-color: ${({ $checked }) =>
    $checked
      ? "var(--color-semantic-primary-normal)"
      : "var(--color-semantic-background-normal-normal)"};
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &::after {
    content: "";
    width: var(--space-2);
    height: var(--space-2);
    border-radius: 50%;
    background-color: var(--color-semantic-static-white);
    opacity: ${({ $checked }) => ($checked ? 1 : 0)};
    transition: opacity 0.15s ease;
  }
`;
